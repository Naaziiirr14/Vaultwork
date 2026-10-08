import Milestone from "../models/Milestone.js";
import Dispute from "../models/Dispute.js";
import asyncHandler from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";
import { addHistory, releaseMilestone } from "../utils/milestoneFlow.js";
import { runAutoRelease } from "../utils/autoRelease.js";
import { getRazorpay, isRazorpayConfigured, verifySignature } from "../config/razorpay.js";

const loadMilestone = async (id) => {
  const milestone = await Milestone.findById(id).populate("job");
  if (!milestone) throw httpError(404, "Milestone not found");
  return milestone;
};

const assertClient = (m, user) => {
  if (String(m.job.client) !== String(user._id)) {
    throw httpError(403, "Only the client of this job can do this");
  }
};

const assertFreelancer = (m, user) => {
  if (!m.job.freelancer || String(m.job.freelancer) !== String(user._id)) {
    throw httpError(403, "Only the hired freelancer can do this");
  }
};

const assertStatus = (m, status, message) => {
  if (m.status !== status) throw httpError(400, message);
};

const markFunded = async (m, user, paymentId, note) => {
  m.status = "funded";
  m.razorpayPaymentId = paymentId;
  addHistory(m, "funded", user._id, note);
  await m.save();
};

// POST /api/milestones/:id/fund-order  (client) -> Razorpay order create
export const createFundOrder = asyncHandler(async (req, res) => {
  const m = await loadMilestone(req.params.id);
  assertClient(m, req.user);
  if (m.job.status !== "in_progress") {
    throw httpError(400, "Hire a freelancer before funding milestones");
  }
  assertStatus(m, "pending", "This milestone is already funded");
  if (!isRazorpayConfigured()) {
    throw httpError(503, "Razorpay keys are not set on the server");
  }

  let order;
  try {
    const razorpay = await getRazorpay();
    order = await razorpay.orders.create({
      amount: m.amount * 100, // paise
      currency: "INR",
      receipt: `ms_${String(m._id)}`,
      notes: { milestoneId: String(m._id), jobId: String(m.job._id) },
    });
  } catch (err) {
    throw httpError(502, `Razorpay error: ${err?.error?.description || err.message}`);
  }

  m.razorpayOrderId = order.id;
  await m.save();
  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// POST /api/milestones/:id/verify  (client) -> checkout success aana apram
export const verifyPayment = asyncHandler(async (req, res) => {
  const m = await loadMilestone(req.params.id);
  assertClient(m, req.user);
  assertStatus(m, "pending", "This milestone is already funded");

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw httpError(400, "Payment details are missing");
  }
  if (m.razorpayOrderId !== razorpay_order_id) {
    throw httpError(400, "This payment does not belong to this milestone");
  }
  if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    throw httpError(400, "Payment verification failed");
  }

  await markFunded(m, req.user, razorpay_payment_id, "Client funded the escrow via Razorpay");
  res.json({ milestone: m });
});

// POST /api/milestones/:id/mock-fund  (client) -> dev/demo only
export const mockFund = asyncHandler(async (req, res) => {
  if (process.env.ALLOW_MOCK_PAYMENT !== "true") {
    throw httpError(403, "Simulated payments are turned off");
  }
  const m = await loadMilestone(req.params.id);
  assertClient(m, req.user);
  if (m.job.status !== "in_progress") {
    throw httpError(400, "Hire a freelancer before funding milestones");
  }
  assertStatus(m, "pending", "This milestone is already funded");

  await markFunded(m, req.user, `mock_pay_${Date.now()}`, "Client funded the escrow (simulated payment)");
  res.json({ milestone: m });
});

// POST /api/milestones/:id/submit  (freelancer)
export const submitWork = asyncHandler(async (req, res) => {
  const m = await loadMilestone(req.params.id);
  assertFreelancer(m, req.user);
  assertStatus(m, "funded", "Work can be submitted only after the client funds this milestone");

  const note = String(req.body.note || "").trim();
  const link = String(req.body.link || "").trim();
  if (!note) throw httpError(400, "Tell the client what you are delivering");

  const days = Number(process.env.AUTO_RELEASE_DAYS) || 7;
  m.status = "submitted";
  m.submission = { note, link, submittedAt: new Date() };
  m.autoReleaseAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  addHistory(m, "submitted", req.user._id, "Freelancer submitted the work");
  await m.save();
  res.json({ milestone: m });
});

// POST /api/milestones/:id/approve  (client)
export const approveWork = asyncHandler(async (req, res) => {
  const m = await loadMilestone(req.params.id);
  assertClient(m, req.user);
  assertStatus(m, "submitted", "There is no submitted work to approve");

  await releaseMilestone(m, { by: req.user._id, note: "Client approved. Payment released to the freelancer" });
  res.json({ milestone: m });
});

// POST /api/milestones/:id/reject  (client) -> dispute create aagum
export const rejectWork = asyncHandler(async (req, res) => {
  const m = await loadMilestone(req.params.id);
  assertClient(m, req.user);
  assertStatus(m, "submitted", "There is no submitted work to reject");

  const reason = String(req.body.reason || "").trim();
  if (reason.length < 10) {
    throw httpError(400, "Explain what is wrong in at least 10 characters");
  }

  m.status = "disputed";
  m.autoReleaseAt = undefined;
  addHistory(m, "disputed", req.user._id, "Client rejected the work. Sent to admin");
  await m.save();

  const dispute = await Dispute.create({
    milestone: m._id,
    job: m.job._id,
    raisedBy: req.user._id,
    reason,
  });
  res.status(201).json({ milestone: m, dispute });
});

// POST /api/milestones/auto-release/run  (admin) -> demo ku manual trigger
export const runAutoReleaseNow = asyncHandler(async (req, res) => {
  const released = await runAutoRelease();
  res.json({ released });
});

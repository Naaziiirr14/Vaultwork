import Dispute from "../models/Dispute.js";
import Job from "../models/Job.js";
import Milestone from "../models/Milestone.js";
import asyncHandler from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";
import { refundMilestone, releaseMilestone } from "../utils/milestoneFlow.js";

// GET /api/disputes
export const listDisputes = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role !== "admin") {
    const jobs = await Job.find({
      $or: [{ client: req.user._id }, { freelancer: req.user._id }],
    }).select("_id");
    filter = { job: { $in: jobs.map((j) => j._id) } };
  }

  const disputes = await Dispute.find(filter)
    .sort({ status: -1, createdAt: -1 })
    .populate("milestone", "title amount status")
    .populate({
      path: "job",
      select: "title client freelancer",
      populate: [
        { path: "client", select: "name" },
        { path: "freelancer", select: "name" },
      ],
    })
    .populate("raisedBy", "name");

  res.json({ disputes });
});

// PUT /api/disputes/:id/resolve  (admin)
export const resolveDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw httpError(404, "Dispute not found");
  if (dispute.status !== "open") throw httpError(400, "This dispute is already resolved");

  const { decision } = req.body;
  const adminNote = String(req.body.adminNote || "").trim();
  if (!["release", "refund"].includes(decision)) {
    throw httpError(400, "Decision must be release or refund");
  }

  const milestone = await Milestone.findById(dispute.milestone);
  if (!milestone || milestone.status !== "disputed") {
    throw httpError(400, "This milestone is not in a disputed state");
  }

  const note = `Admin decision: ${
    decision === "release" ? "released to the freelancer" : "refunded to the client"
  }${adminNote ? `. ${adminNote}` : ""}`;

  if (decision === "release") await releaseMilestone(milestone, { by: req.user._id, note });
  else await refundMilestone(milestone, { by: req.user._id, note });

  dispute.status = "resolved";
  dispute.decision = decision;
  dispute.adminNote = adminNote;
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();
  await dispute.save();

  res.json({ dispute });
});

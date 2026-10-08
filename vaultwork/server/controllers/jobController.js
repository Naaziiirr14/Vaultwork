import Job from "../models/Job.js";
import Milestone from "../models/Milestone.js";
import Dispute from "../models/Dispute.js";
import asyncHandler from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseSkills = (skills) => {
  const list = Array.isArray(skills)
    ? skills
    : typeof skills === "string"
    ? skills.split(",")
    : [];
  return list.map((s) => String(s).trim()).filter(Boolean).slice(0, 8);
};

// POST /api/jobs  (client)
export const createJob = asyncHandler(async (req, res) => {
  const { title, description, skills, milestones } = req.body;
  if (!title || !description) throw httpError(400, "Title and description are required");
  if (!Array.isArray(milestones) || milestones.length < 1 || milestones.length > 6) {
    throw httpError(400, "Add between 1 and 6 milestones");
  }

  const cleaned = milestones.map((m, i) => ({
    title: String(m.title || "").trim(),
    description: String(m.description || "").trim(),
    amount: Number(m.amount),
    order: i + 1,
  }));
  if (cleaned.some((m) => !m.title || !Number.isInteger(m.amount) || m.amount < 1)) {
    throw httpError(400, "Every milestone needs a title and a whole-rupee amount (₹1 or more)");
  }

  const budget = cleaned.reduce((sum, m) => sum + m.amount, 0);
  const job = await Job.create({
    title,
    description,
    skills: parseSkills(skills),
    budget,
    milestoneCount: cleaned.length,
    client: req.user._id,
  });

  await Milestone.insertMany(
    cleaned.map((m) => ({
      ...m,
      job: job._id,
      history: [{ status: "pending", note: "Milestone created", by: req.user._id }],
    }))
  );

  res.status(201).json({ job });
});

// GET /api/jobs?search=  (open jobs)
export const listOpenJobs = asyncHandler(async (req, res) => {
  const filter = { status: "open" };
  const search = String(req.query.search || "").trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ title: rx }, { description: rx }, { skills: rx }];
  }

  const jobs = await Job.find(filter)
    .sort({ createdAt: -1 })
    .populate("client", "name")
    .lean();

  const uid = String(req.user._id);
  const data = jobs.map((j) => ({
    ...j,
    applicantCount: j.applicants.length,
    hasApplied: j.applicants.some((a) => String(a.freelancer) === uid),
    applicants: undefined,
  }));
  res.json({ jobs: data });
});

// GET /api/jobs/mine
export const myJobs = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  let filter = {};
  if (req.user.role === "client") filter = { client: uid };
  if (req.user.role === "freelancer") {
    filter = { $or: [{ freelancer: uid }, { "applicants.freelancer": uid }] };
  }

  const jobs = await Job.find(filter)
    .sort({ updatedAt: -1 })
    .populate("client", "name")
    .populate("freelancer", "name")
    .lean();

  const milestones = await Milestone.find({ job: { $in: jobs.map((j) => j._id) } })
    .select("job amount status")
    .lean();

  const progress = {};
  for (const m of milestones) {
    const p = (progress[String(m.job)] ||= { count: 0, done: 0, released: 0, inEscrow: 0 });
    p.count += 1;
    if (["released", "refunded"].includes(m.status)) p.done += 1;
    if (m.status === "released") p.released += m.amount;
    if (["funded", "submitted", "disputed"].includes(m.status)) p.inEscrow += m.amount;
  }

  const data = jobs.map((j) => {
    let myStatus = null;
    if (req.user.role === "freelancer") {
      if (j.freelancer && String(j.freelancer._id) === String(uid)) myStatus = "hired";
      else if (j.status === "open") myStatus = "applied";
      else myStatus = "not selected";
    }
    return {
      ...j,
      applicantCount: j.applicants.length,
      applicants: undefined,
      myStatus,
      progress: progress[String(j._id)] || { count: 0, done: 0, released: 0, inEscrow: 0 },
    };
  });
  res.json({ jobs: data });
});

// GET /api/jobs/:id
export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate("client", "name email")
    .populate("freelancer", "name email")
    .populate("applicants.freelancer", "name email");
  if (!job) throw httpError(404, "Job not found");

  const uid = String(req.user._id);
  const isClient = String(job.client?._id) === uid;
  const isFreelancer = Boolean(job.freelancer) && String(job.freelancer._id) === uid;
  const isAdmin = req.user.role === "admin";
  const hasApplied = job.applicants.some((a) => String(a.freelancer?._id) === uid);

  if (job.status !== "open" && !(isClient || isFreelancer || isAdmin || hasApplied)) {
    throw httpError(403, "You don't have access to this job");
  }

  const milestones = await Milestone.find({ job: job._id })
    .sort({ order: 1 })
    .populate("history.by", "name role");
  const disputes = await Dispute.find({ job: job._id }).populate("raisedBy", "name");

  const obj = job.toObject();
  obj.applicantCount = obj.applicants.length;
  obj.hasApplied = hasApplied;
  obj.applicants = isClient || isAdmin ? obj.applicants : [];

  res.json({ job: obj, milestones, disputes, access: { isClient, isFreelancer, isAdmin } });
});

// POST /api/jobs/:id/apply  (freelancer)
export const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw httpError(404, "Job not found");
  if (job.status !== "open") throw httpError(400, "This job is no longer open");
  if (job.applicants.some((a) => String(a.freelancer) === String(req.user._id))) {
    throw httpError(400, "You have already applied to this job");
  }

  job.applicants.push({
    freelancer: req.user._id,
    message: String(req.body.message || "").trim().slice(0, 500),
  });
  await job.save();
  res.status(201).json({ message: "Application sent" });
});

// POST /api/jobs/:id/hire  (client)
export const hireFreelancer = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw httpError(404, "Job not found");
  if (String(job.client) !== String(req.user._id)) {
    throw httpError(403, "Only the client who posted this job can hire");
  }
  if (job.status !== "open") throw httpError(400, "This job is already in progress");

  const { freelancerId } = req.body;
  if (!job.applicants.some((a) => String(a.freelancer) === String(freelancerId))) {
    throw httpError(400, "That freelancer has not applied to this job");
  }

  job.freelancer = freelancerId;
  job.status = "in_progress";
  await job.save();
  res.json({ message: "Freelancer hired. You can fund the first milestone now." });
});

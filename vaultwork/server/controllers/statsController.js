import Job from "../models/Job.js";
import Milestone from "../models/Milestone.js";
import Dispute from "../models/Dispute.js";
import asyncHandler from "../utils/asyncHandler.js";

// GET /api/stats/me  -> role based dashboard numbers
export const myStats = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  let filter = {};
  if (req.user.role === "client") filter = { client: uid };
  if (req.user.role === "freelancer") filter = { freelancer: uid };

  const jobs = await Job.find(filter).select("status");
  const ids = jobs.map((j) => j._id);

  const grouped = await Milestone.aggregate([
    { $match: { job: { $in: ids } } },
    { $group: { _id: "$status", total: { $sum: "$amount" } } },
  ]);
  const sum = (...statuses) =>
    grouped.filter((g) => statuses.includes(g._id)).reduce((s, g) => s + g.total, 0);

  const count = (status) => jobs.filter((j) => j.status === status).length;

  const stats = {
    jobs: {
      total: jobs.length,
      open: count("open"),
      active: count("in_progress"),
      completed: count("completed"),
    },
    amounts: {
      pending: sum("pending"),
      inEscrow: sum("funded", "submitted", "disputed"),
      released: sum("released"),
      refunded: sum("refunded"),
    },
    openDisputes: 0,
  };

  if (req.user.role === "admin") {
    stats.openDisputes = await Dispute.countDocuments({ status: "open" });
  } else {
    stats.openDisputes = await Dispute.countDocuments({ status: "open", job: { $in: ids } });
  }
  if (req.user.role === "freelancer") {
    stats.jobs.applied = await Job.countDocuments({
      status: "open",
      "applicants.freelancer": uid,
    });
  }

  res.json(stats);
});

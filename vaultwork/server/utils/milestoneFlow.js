import Job from "../models/Job.js";
import Milestone from "../models/Milestone.js";

export const addHistory = (milestone, status, by, note) => {
  milestone.history.push({ status, by: by || null, note, at: new Date() });
};

// Ellaa milestones um released/refunded aana job "completed" aagum
export const syncJobStatus = async (jobId) => {
  const list = await Milestone.find({ job: jobId }).select("status");
  const done =
    list.length > 0 && list.every((m) => ["released", "refunded"].includes(m.status));
  await Job.findOneAndUpdate(
    { _id: jobId, status: { $in: ["in_progress", "completed"] } },
    { status: done ? "completed" : "in_progress" }
  );
};

const finish = async (milestone, status, by, note) => {
  milestone.status = status;
  milestone.autoReleaseAt = undefined;
  addHistory(milestone, status, by, note);
  await milestone.save();
  await syncJobStatus(milestone.job?._id ?? milestone.job);
  return milestone;
};

// NOTE: Ithu ledger simulation. Real product la inga RazorpayX payout API call pannuvom.
export const releaseMilestone = (milestone, { by = null, note } = {}) =>
  finish(milestone, "released", by, note || "Payment released to the freelancer");

export const refundMilestone = (milestone, { by = null, note } = {}) =>
  finish(milestone, "refunded", by, note || "Payment refunded to the client");

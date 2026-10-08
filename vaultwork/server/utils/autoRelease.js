import cron from "node-cron";
import Milestone from "../models/Milestone.js";
import { releaseMilestone } from "./milestoneFlow.js";

// Submit panni, client respond pannala + autoReleaseAt time aachu na release pannidum
export const runAutoRelease = async () => {
  try {
    const due = await Milestone.find({
      status: "submitted",
      autoReleaseAt: { $lte: new Date() },
    });
    for (const milestone of due) {
      await releaseMilestone(milestone, {
        note: "Auto-released: the client did not respond in time",
      });
    }
    if (due.length) console.log(`Auto-released ${due.length} milestone(s)`);
    return due.length;
  } catch (err) {
    console.error("Auto-release failed:", err.message);
    return 0;
  }
};

export const startAutoRelease = () => {
  cron.schedule("*/10 * * * *", runAutoRelease); // every 10 minutes
};

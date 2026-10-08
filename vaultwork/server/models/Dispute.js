import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    milestone: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
    decision: { type: String, enum: ["release", "refund", null], default: null },
    adminNote: { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Dispute", disputeSchema);

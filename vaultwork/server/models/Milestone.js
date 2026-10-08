import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/*
  Milestone status flow:
  pending -> funded -> submitted -> released
                          |
                          +-> disputed -> released (admin) / refunded (admin)
*/
const milestoneSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    amount: { type: Number, required: true, min: 1 },
    order: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending", "funded", "submitted", "disputed", "released", "refunded"],
      default: "pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    submission: {
      note: String,
      link: String,
      submittedAt: Date,
    },
    autoReleaseAt: Date,
    history: [historySchema],
  },
  { timestamps: true }
);

export default mongoose.model("Milestone", milestoneSchema);

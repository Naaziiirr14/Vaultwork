import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema({
  freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, default: "", maxlength: 500 },
  appliedAt: { type: Date, default: Date.now },
});

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    skills: [{ type: String, trim: true }],
    // budget = milestones oda total (server la calculate aagum)
    budget: { type: Number, required: true, min: 1 },
    milestoneCount: { type: Number, default: 0 },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["open", "in_progress", "completed"],
      default: "open",
    },
    applicants: [applicantSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);

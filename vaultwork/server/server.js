import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { isRazorpayConfigured } from "./config/razorpay.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { startAutoRelease } from "./utils/autoRelease.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import disputeRoutes from "./routes/disputeRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Render la deploy pannumbodhu proxy trust pannanum
app.set("trust proxy", 1);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim().replace(/\/$/, ""))
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Escrow API running");
});

// Frontend ku: Razorpay iruka, mock payment allowed ah nu therinjukka
app.get("/api/config", (req, res) => {
  res.json({
    razorpayEnabled: isRazorpayConfigured(),
    mockPayments: process.env.ALLOW_MOCK_PAYMENT === "true",
    autoReleaseDays: Number(process.env.AUTO_RELEASE_DAYS) || 7,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/stats", statsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAutoRelease();
});

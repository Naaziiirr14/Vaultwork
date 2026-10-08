import { Router } from "express";
import {
  approveWork,
  createFundOrder,
  mockFund,
  rejectWork,
  runAutoReleaseNow,
  submitWork,
  verifyPayment,
} from "../controllers/milestoneController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.post("/auto-release/run", authorize("admin"), runAutoReleaseNow);
router.post("/:id/fund-order", authorize("client"), createFundOrder);
router.post("/:id/verify", authorize("client"), verifyPayment);
router.post("/:id/mock-fund", authorize("client"), mockFund);
router.post("/:id/submit", authorize("freelancer"), submitWork);
router.post("/:id/approve", authorize("client"), approveWork);
router.post("/:id/reject", authorize("client"), rejectWork);

export default router;

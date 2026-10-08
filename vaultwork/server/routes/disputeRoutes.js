import { Router } from "express";
import { listDisputes, resolveDispute } from "../controllers/disputeController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listDisputes);
router.put("/:id/resolve", authorize("admin"), resolveDispute);

export default router;

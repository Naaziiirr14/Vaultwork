import { Router } from "express";
import {
  applyToJob,
  createJob,
  getJob,
  hireFreelancer,
  listOpenJobs,
  myJobs,
} from "../controllers/jobController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect);

router.get("/", listOpenJobs);
router.get("/mine", myJobs); // /:id ku munnadi irukanum
router.post("/", authorize("client"), createJob);
router.get("/:id", getJob);
router.post("/:id/apply", authorize("freelancer"), applyToJob);
router.post("/:id/hire", authorize("client"), hireFreelancer);

export default router;

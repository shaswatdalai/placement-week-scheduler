import { Router } from "express";
import { createInterviewController,getInterviewsController } from "../controllers/interview.controller";

const router = Router();

router.post("/", createInterviewController);
router.get("/", getInterviewsController);

export default router;
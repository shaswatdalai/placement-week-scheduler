import { Router } from "express";
import { createInterviewController } from "../controllers/interview.controller";

const router = Router();

router.post("/", createInterviewController);

export default router;
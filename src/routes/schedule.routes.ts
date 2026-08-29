import { Router } from "express";
import {
    getScheduleController,
    getScheduleDiffController,
    getMetricsController,
    getExplanationController
} from "../controllers/schedule.controller";

const router = Router();

// Current schedule (filterable by ?status= and ?companyId=)
router.get("/", getScheduleController);

// Latest disruption diff (or all diffs with ?all=true)
router.get("/diff", getScheduleDiffController);

// Schedule quality metrics
router.get("/metrics", getMetricsController);

// Explanation for a specific interview
router.get("/explanations/:interviewId", getExplanationController);

export default router;

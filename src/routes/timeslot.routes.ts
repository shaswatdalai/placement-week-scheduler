import { Router } from "express";

import { createTimeSlotController,getTimeSlotsController } from "../controllers/timeslot.controller";

const router = Router();

router.post("/", createTimeSlotController);
router.get("/", getTimeSlotsController);

export default router;
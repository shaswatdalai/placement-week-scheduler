import { Router } from "express";

import { createTimeSlotController } from "../controllers/timeslot.controller";

const router = Router();

router.post("/", createTimeSlotController);

export default router;
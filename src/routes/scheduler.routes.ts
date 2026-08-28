import { Router } from "express";

import generateScheduleController
    from "../controllers/scheduler.controller";


const router = Router();


router.post(
    "/generate",
    generateScheduleController
);


export default router;
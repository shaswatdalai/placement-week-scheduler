import { Router } from "express";
import {
    companyDelayController,
    panelUnavailableController,
    studentWithdrawalController,
    roomUnavailableController,
    compoundDisruptionController
} from "../controllers/disruption.controller";

const router = Router();

router.post("/company-delay", companyDelayController);
router.post("/panel-unavailable", panelUnavailableController);
router.post("/student-withdrawal", studentWithdrawalController);
router.post("/room-unavailable", roomUnavailableController);
router.post("/compound", compoundDisruptionController);

export default router;

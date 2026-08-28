import { Router } from "express";
import { createPanelController,getPanelsController } from "../controllers/panel.controller";

const router = Router();

router.post("/", createPanelController);
router.get("/", getPanelsController);

export default router;
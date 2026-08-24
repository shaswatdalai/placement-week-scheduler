import { Router } from "express";
import { createPanelController } from "../controllers/panel.controller";

const router = Router();

router.post("/", createPanelController);

export default router;
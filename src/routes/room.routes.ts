import { Router } from "express";
import { createRoomController } from "../controllers/room.controller";

const router = Router();

router.post("/", createRoomController);

export default router;
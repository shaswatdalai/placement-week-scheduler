import { Router } from "express";
import { createRoomController,getRoomsController } from "../controllers/room.controller";

const router = Router();

router.post("/", createRoomController);
router.get("/", getRoomsController);

export default router;
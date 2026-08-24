import { Router } from "express";
import { createStudentController } from "../controllers/student.controller";

const router = Router();

router.post("/", createStudentController);

export default router;
import { Router } from "express";
import { createCompanyController,getCompaniesController } from "../controllers/company.controller";

const router = Router();

router.post("/", createCompanyController);
router.get("/", getCompaniesController);

export default router;
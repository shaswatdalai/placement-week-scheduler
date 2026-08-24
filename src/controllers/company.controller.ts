import { Request, Response } from "express";
import { createCompany } from "../services/company.service";

export const createCompanyController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const company = await createCompany(req.body);

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error("Error creating company:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create company"
    });
  }
};
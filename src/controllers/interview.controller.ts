import { Request, Response } from "express";
import { createInterview } from "../services/interview.service";

export const createInterviewController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const interview = await createInterview(req.body);

    res.status(201).json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error("Error creating interview:", error);

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create interview"
    });
  }
};
import { Request, Response } from "express";
import { createInterview,getInterviews } from "../services/interview.service";

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
export const getInterviewsController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const interviews = await getInterviews();

        res.status(200).json({
            success: true,
            data: interviews
        });
    } catch (error) {
        console.error("Error fetching interviews:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch interviews"
        });
    }
};
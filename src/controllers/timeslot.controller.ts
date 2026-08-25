import { Request, Response } from "express";

import { createTimeSlot } from "../services/timeslot.service";

export const createTimeSlotController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const timeSlot = await createTimeSlot(req.body);

    res.status(201).json({
      success: true,
      data: timeSlot
    });
  } catch (error) {
    console.error("Error creating timeslot:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create timeslot"
    });
  }
};
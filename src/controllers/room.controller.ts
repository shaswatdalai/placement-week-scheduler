import { Request, Response } from "express";
import { createRoom } from "../services/room.service";

export const createRoomController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const room = await createRoom(req.body);

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error("Error creating room:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create room"
    });
  }
};
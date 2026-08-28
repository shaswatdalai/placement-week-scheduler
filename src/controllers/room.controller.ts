import { Request, Response } from "express";
import { createRoom,getRooms } from "../services/room.service";

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

export const getRoomsController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const rooms = await getRooms();

        res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error("Error fetching rooms:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch rooms"
        });
    }
};
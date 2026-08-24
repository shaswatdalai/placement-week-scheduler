import Room, { IRoom } from "../models/room.model";

export const createRoom = async (
  data: Partial<IRoom>
): Promise<IRoom> => {
  const room = await Room.create(data);

  return room;
};
import TimeSlot, { ITimeSlot } from "../models/timeslot.model";

export const createTimeSlot = async (
  timeSlotData: Partial<ITimeSlot>
): Promise<ITimeSlot> => {
  const timeSlot = await TimeSlot.create(timeSlotData);

  return timeSlot;
};
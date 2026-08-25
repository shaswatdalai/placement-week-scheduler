import { ITimeSlot } from "../models/timeslot.model";

interface ITimeWindow {
  startTime: Date;
  endTime: Date;
}

const findAvailableTime = (
  timeSlots: ITimeSlot[],
  duration: number
): ITimeWindow | null => {
  const availableSlots = timeSlots
    .filter((slot) => slot.status === "AVAILABLE")//show the slots which are available
    .sort(
      (a, b) =>
        a.startTime.getTime() - b.startTime.getTime()
    );

  for (let i = 0; i < availableSlots.length; i++) {
    const startTime = availableSlots[i].startTime;

    let endTime = startTime;

    for (let j = i; j < availableSlots.length; j++) {
      const currentSlot = availableSlots[j];

      if (currentSlot.startTime.getTime() !== endTime.getTime()) {
        break;
      }

      endTime = currentSlot.endTime;

      const durationInMinutes =
        (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      if (durationInMinutes >= duration) {
        return {
          startTime,
          endTime
        };
      }
    }
  }

  return null;
};
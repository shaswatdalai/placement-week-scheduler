import Interview from "../models/interview.model";
import TimeSlot from "../models/timeslot.model";
import Panel from "../models/panel.model";
import Room from "../models/room.model";
import Company from "../models/company.model";
import Student from "../models/student.model";

import generateSchedule from "./scheduler.service";


// Loads data from DB, runs the scheduler, persists only the changed interviews.
const scheduleInterviews = async () => {

    const interviews = await Interview.find();
    const timeSlots  = await TimeSlot.find();
    const panels     = await Panel.find();
    const rooms      = await Room.find();
    const companies  = await Company.find();
    const students   = await Student.find();

    const pendingInterviews = interviews.filter(
        (interview) => interview.status === "pending"
    );

    generateSchedule(interviews, timeSlots, panels, rooms, companies, students);

    for (const interview of pendingInterviews) {
        if (
            interview.status === "scheduled" ||
            interview.status === "unscheduled"
        ) {
            await interview.save();
        }
    }

    return pendingInterviews;
};


export default scheduleInterviews;
import Interview from "../models/interview.model";
import TimeSlot from "../models/timeslot.model";
import Panel from "../models/panel.model";
import Room from "../models/room.model";
import Company from "../models/company.model";

import generateSchedule from "./scheduler.service";


const scheduleInterviews = async () => {

    // Get all required data from MongoDB
    const interviews = await Interview.find();
    const timeSlots = await TimeSlot.find();
    const panels = await Panel.find();
    const rooms = await Room.find();
    const companies = await Company.find();


    // Keep track of interviews that were pending
    const pendingInterviews = interviews.filter(
        (interview) => interview.status === "pending"
    );


    // Run the actual scheduling logic
    generateSchedule(
        interviews,
        timeSlots,
        panels,
        rooms,
        companies
    );


    // Save only the interviews that were successfully scheduled
    for (const interview of pendingInterviews) {

        if (interview.status === "scheduled") {
            await interview.save();
        }
    }


    return pendingInterviews;
};


export default scheduleInterviews;
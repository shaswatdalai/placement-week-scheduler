import { Request, Response } from "express";

import scheduleInterviews from "../services/scheduler-db.service";


const generateScheduleController = async (
    req: Request,
    res: Response
) => {

    try {

        const scheduledInterviews =
            await scheduleInterviews();

        return res.status(200).json({
            message: "Schedule generated successfully",
            interviews: scheduledInterviews
        });

    } catch (error) {

        console.error("Error generating schedule:", error);

        return res.status(500).json({
            message: "Failed to generate schedule"
        });
    }
};


export default generateScheduleController;
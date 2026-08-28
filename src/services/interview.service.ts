import Interview, { IInterview } from "../models/interview.model";

import Student from "../models/student.model";
import Company from "../models/company.model";
import Panel from "../models/panel.model";
import Room from "../models/room.model";

export const createInterview = async (
    data: Partial<IInterview>
): Promise<IInterview> => {

    // 1. Check student
    const student = await Student.findOne({
        studentId: data.studentId
    });

    if (!student) {
        throw new Error("Student does not exist");
    }

    // 2. Check company
    const company = await Company.findOne({
        companyId: data.companyId
    });

    if (!company) {
        throw new Error("Company does not exist");
    }

    // 3. Check student eligibility
    const meetsCgpa = student.cgpa >= company.minimumCGPA;

    const branchEligible = company.eligibleBranches.includes(
        student.branch
    );

    if (!meetsCgpa || !branchEligible) {
        throw new Error("Student is not eligible for this company");
    }

    // 4. If interview is pending,
    // panel, room and timings will be decided by scheduler
    if (data.status === "pending") {

        const interview = await Interview.create(data);

        return interview;
    }

    // 5. For a scheduled interview,
    // panel and room must exist

    const panel = await Panel.findOne({
        panelId: data.panelId
    });

    if (!panel) {
        throw new Error("Panel does not exist");
    }

    const room = await Room.findOne({
        roomId: data.roomId
    });

    if (!room) {
        throw new Error("Room does not exist");
    }

    // 6. Check room availability

    if (room.status !== "AVAILABLE") {
        throw new Error("Room is not available");
    }

    // 7. Check panel belongs to company

    if (panel.companyId !== company.companyId) {
        throw new Error("Panel does not belong to this company");
    }

    // 8. Check panel availability

    if (panel.status !== "available") {
        throw new Error("Panel is not available");
    }

    // 9. Create interview

    const interview = await Interview.create(data);

    return interview;
};
export const getInterviews = async (): Promise<IInterview[]> => {
    return await Interview.find();
};
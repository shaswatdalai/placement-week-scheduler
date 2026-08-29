import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import mongoose from "mongoose";
import Student from "../models/student.model";
import Company from "../models/company.model";
import Panel from "../models/panel.model";
import Room from "../models/room.model";
import TimeSlot from "../models/timeslot.model";
import Interview from "../models/interview.model";

const BRANCHES = ["CSE", "ECE", "EEE", "ME", "CIVIL"];

// 09:00 IST base times for Day 1 and Day 2 (stored as UTC)
const DAY1_BASE = new Date("2025-11-03T03:30:00.000Z");
const DAY2_BASE = new Date("2025-11-04T03:30:00.000Z");
const SLOT_DURATION_MIN = 30;
const SLOTS_PER_DAY = 18;

const COMPANIES = [
    // Priority 1
    { id: "COMP-01", name: "Google",        priority: 1, cgpa: 8.5, branches: ["CSE"],                  duration: 60 },
    { id: "COMP-02", name: "Microsoft",     priority: 1, cgpa: 8.0, branches: ["CSE", "ECE"],            duration: 60 },
    { id: "COMP-03", name: "Amazon",        priority: 1, cgpa: 7.5, branches: ["CSE", "ECE", "EEE"],     duration: 45 },

    // Priority 2
    { id: "COMP-04", name: "Salesforce",    priority: 2, cgpa: 7.0, branches: ["CSE", "ECE"],            duration: 45 },
    { id: "COMP-05", name: "Adobe",         priority: 2, cgpa: 7.0, branches: ["CSE"],                   duration: 45 },
    { id: "COMP-06", name: "Flipkart",      priority: 2, cgpa: 7.0, branches: ["CSE", "ECE", "EEE"],     duration: 30 },
    { id: "COMP-07", name: "Samsung",       priority: 2, cgpa: 6.5, branches: ["ECE", "EEE"],            duration: 30 },

    // Priority 3
    { id: "COMP-08", name: "Infosys",       priority: 3, cgpa: 6.0, branches: ["CSE","ECE","EEE","ME","CIVIL"], duration: 30 },
    { id: "COMP-09", name: "TCS",           priority: 3, cgpa: 6.0, branches: ["CSE","ECE","EEE","ME","CIVIL"], duration: 30 },
    { id: "COMP-10", name: "Wipro",         priority: 3, cgpa: 6.0, branches: ["CSE","ECE","EEE","ME","CIVIL"], duration: 30 },
    { id: "COMP-11", name: "Cognizant",     priority: 3, cgpa: 6.0, branches: ["CSE","ECE","EEE","ME","CIVIL"], duration: 30 },
    { id: "COMP-12", name: "HCL Technologies", priority: 3, cgpa: 6.0, branches: ["CSE","ECE","ME","CIVIL"],   duration: 30 },
];

function makeCGPA(index: number): number {
    if (index < 30) {
        return Math.round((8.0 + (index % 10) * 0.18) * 10) / 10;
    } else if (index < 105) {
        return Math.round((7.0 + (index % 10) * 0.09) * 10) / 10;
    } else {
        return Math.round((6.0 + (index % 10) * 0.09) * 10) / 10;
    }
}

function generateStudents() {
    const students = [];
    for (let i = 0; i < 150; i++) {
        const branch = BRANCHES[i % BRANCHES.length];
        students.push({
            studentId: `STU-${String(i + 1).padStart(3, "0")}`,
            name: `Student ${i + 1}`,
            cgpa: makeCGPA(i),
            branch,
            status: "ACTIVE" as const
        });
    }
    return students;
}

function generatePanels() {
    const panels = [];
    const panelCounts = [4, 4, 4, 3, 3, 3, 2, 4, 4, 3, 3, 2];

    let panelNum = 1;
    for (let ci = 0; ci < COMPANIES.length; ci++) {
        const count = panelCounts[ci];
        for (let p = 0; p < count; p++) {
            panels.push({
                panelId: `PANEL-${String(panelNum).padStart(2, "0")}`,
                companyId: COMPANIES[ci].id,
                status: "available" as const
            });
            panelNum++;
        }
    }
    return panels;
}

function generateRooms() {
    const rooms = [];
    for (let i = 1; i <= 10; i++) {
        rooms.push({
            roomId: `ROOM-${String(i).padStart(3, "0")}`,
            status: "AVAILABLE" as const
        });
    }
    return rooms;
}

function generateTimeSlots() {
    const slots = [];
    let slotNum = 1;
    const days = [DAY1_BASE, DAY2_BASE];

    for (const dayBase of days) {
        for (let s = 0; s < SLOTS_PER_DAY; s++) {
            const startTime = new Date(
                dayBase.getTime() + s * SLOT_DURATION_MIN * 60 * 1000
            );
            const endTime = new Date(
                startTime.getTime() + SLOT_DURATION_MIN * 60 * 1000
            );
            slots.push({
                slotId: `SLOT-${String(slotNum).padStart(3, "0")}`,
                startTime,
                endTime,
                status: "AVAILABLE" as const
            });
            slotNum++;
        }
    }
    return slots;
}

function generateInterviews(
    students: ReturnType<typeof generateStudents>
) {
    const interviews: {
        interviewId: string;
        studentId: string;
        companyId: string;
        duration: number;
        status: "pending";
    }[] = [];

    let intNum = 1;

    for (const company of COMPANIES) {
        for (const student of students) {
            const cgpaOk = student.cgpa >= company.cgpa;
            const branchOk = company.branches.includes(student.branch);

            if (!cgpaOk || !branchOk) continue;

            const companyShortlists = interviews.filter(
                (i) => i.companyId === company.id
            ).length;

            const maxShortlists =
                company.priority === 1 ? 50 :
                company.priority === 2 ? 30 : 25;

            if (companyShortlists >= maxShortlists) continue;

            interviews.push({
                interviewId: `INT-${String(intNum).padStart(3, "0")}`,
                studentId: student.studentId,
                companyId: company.id,
                duration: company.duration,
                status: "pending"
            });
            intNum++;
        }
    }

    return interviews;
}

async function seed() {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.error("MONGO_URI is not set in .env");
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    await Promise.all([
        Student.deleteMany({}),
        Company.deleteMany({}),
        Panel.deleteMany({}),
        Room.deleteMany({}),
        TimeSlot.deleteMany({}),
        Interview.deleteMany({})
    ]);

    const studentsData  = generateStudents();
    const panelsData    = generatePanels();
    const roomsData     = generateRooms();
    const timeSlotsData = generateTimeSlots();
    const interviewsData = generateInterviews(studentsData);

    await Student.insertMany(studentsData);
    await Company.insertMany(
        COMPANIES.map((c) => ({
            companyId: c.id,
            name: c.name,
            priority: c.priority,
            minimumCGPA: c.cgpa,
            eligibleBranches: c.branches,
            interviewDuration: c.duration
        }))
    );
    await Panel.insertMany(panelsData);
    await Room.insertMany(roomsData);
    await TimeSlot.insertMany(timeSlotsData);
    await Interview.insertMany(interviewsData);

    console.log(`Seeded: ${studentsData.length} students, ${COMPANIES.length} companies, ${panelsData.length} panels, ${roomsData.length} rooms, ${timeSlotsData.length} slots, ${interviewsData.length} interviews`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});

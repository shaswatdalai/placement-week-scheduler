import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db";

import studentRoutes    from "./routes/student.routes";
import companyRoutes    from "./routes/company.routes";
import panelRoutes      from "./routes/panel.routes";
import interviewRoutes  from "./routes/interview.routes";
import roomRoutes       from "./routes/room.routes";
import timeSlotRoutes   from "./routes/timeslot.routes";
import schedulerRoutes  from "./routes/scheduler.routes";
import scheduleRoutes   from "./routes/schedule.routes";
import disruptionRoutes from "./routes/disruption.routes";

import { initWebSocket } from "./services/websocket.service";

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));
app.use(express.json());

app.use("/api/students",    studentRoutes);
app.use("/api/companies",   companyRoutes);
app.use("/api/panels",      panelRoutes);
app.use("/api/interviews",  interviewRoutes);
app.use("/api/rooms",       roomRoutes);
app.use("/api/timeslots",   timeSlotRoutes);
app.use("/api/scheduler",   schedulerRoutes);
app.use("/api/schedule",    scheduleRoutes);
app.use("/api/disruptions", disruptionRoutes);

app.get("/", (_req, res) => {
    res.json({ message: "Placement Week Scheduler API is running" });
});

const httpServer = http.createServer(app);
initWebSocket(httpServer);


const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
    await connectDB();
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`WebSocket ready on ws://localhost:${PORT}`);
    });
};

startServer();

export default app;
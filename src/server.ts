import express from "express";
import panelRoutes from "./routes/panel.routes";
import companyRoutes from "./routes/company.routes";
import studentRoutes from "./routes/student.routes";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import interviewRoutes from "./routes/interview.routes";
import roomRoutes from "./routes/room.routes";
import timeSlotRoutes from "./routes/timeslot.routes";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/panels", panelRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.get("/", (_req, res) => {
  res.json({
    message: "Placement Week Scheduler API is running"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
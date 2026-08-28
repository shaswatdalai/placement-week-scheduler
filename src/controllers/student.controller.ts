import { Request, Response } from "express";
import { createStudent,getStudents } from "../services/student.service";

export const createStudentController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const student = await createStudent(req.body);

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error("Error creating student:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create student"
    });
  }
};

export const getStudentsController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const students = await getStudents();

        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error("Error fetching students:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};
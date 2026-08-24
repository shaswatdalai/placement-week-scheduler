import Student, { IStudent } from "../models/student.model";

export const createStudent = async (
  studentData: Partial<IStudent>
): Promise<IStudent> => {
  const student = await Student.create(studentData);

  return student;
};
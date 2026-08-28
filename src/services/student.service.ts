import Student, { IStudent } from "../models/student.model";

export const createStudent = async (
  studentData: Partial<IStudent>//partial cuz we aint passing status and timestamps, mongoose will handle that//also this data should come from the request body, so we don't need to pass the entire IStudent object//this data shpould correspond to the student structure defined in the student.model.ts file. in regular js anyone could pass any data, but in typescript we can enforce the structure of the data being passed to the function. this is why we use Partial<IStudent> instead of IStudent. it allows us to pass only the fields that are required to create a student, while still enforcing the structure of the data being passed.
): Promise<IStudent> => {//eventually this function will you an iStudent object, so we specify the return type as Promise<IStudent>. this is important for type safety and to ensure that the function returns the expected data structure.
  const student = await Student.create(studentData);

  return student;
};

export const getStudents = async (): Promise<IStudent[]> => {
    return await Student.find();
};
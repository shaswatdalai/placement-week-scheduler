import Company, { ICompany } from "../models/company.model";

export const createCompany = async (
  data: Partial<ICompany>
): Promise<ICompany> => {
  const company = await Company.create(data);

  return company;
};
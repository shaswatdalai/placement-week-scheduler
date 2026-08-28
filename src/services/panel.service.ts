import Panel, { IPanel } from "../models/panel.model";
import Company from "../models/company.model";

export const createPanel = async (
  data: Partial<IPanel>
): Promise<IPanel> => {
  const company = await Company.findOne({
    companyId: data.companyId
  });

  if (!company) {
    throw new Error("Company does not exist");
  }

  const panel = await Panel.create(data);

  return panel;
};
export const getPanels = async (): Promise<IPanel[]> => {
    return await Panel.find();
};
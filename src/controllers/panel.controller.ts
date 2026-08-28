import { Request, Response } from "express";
import { createPanel,getPanels } from "../services/panel.service";

export const createPanelController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const panel = await createPanel(req.body);

    res.status(201).json({
      success: true,
      data: panel
    });
  } catch (error) {
    console.error("Error creating panel:", error);

    res.status(400).json({
      success: false,
      message: error instanceof Error
        ? error.message
        : "Failed to create panel"
    });
  }
};
export const getPanelsController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const panels = await getPanels();

        res.status(200).json({
            success: true,
            data: panels
        });
    } catch (error) {
        console.error("Error fetching panels:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch panels"
        });
    }
};
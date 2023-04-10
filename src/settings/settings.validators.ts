import { body, param } from "express-validator";

export const SettingsValidator = {
  validator: [
    body("settings").notEmpty().withMessage("Settings are required"),
    body("settings.appearance")
      .notEmpty()
      .withMessage("Appearance is required"),
    body("settings.appearance.theme")
      .notEmpty()
      .withMessage("Theme is required")
      .isIn(["light", "dark"])
      .withMessage("Theme must be either dark or light"),
    body("settings.appearance.scale")
      .notEmpty()
      .withMessage("Scale is required")
      .isInt({ min: 50, max: 200 })
      .withMessage("Scale must be between 50 and 200"),
    body("settings.notifications.doNotDisturb")
      .notEmpty()
      .withMessage("Do not disturb is required")
      .isBoolean()
      .withMessage("Do not disturb must be a boolean"),
  ],
};

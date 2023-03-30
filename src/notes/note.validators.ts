import { body, param } from "express-validator";

export const UpdateNoteValidator = {
  validator: [
    body("creatorID")
      .isMongoId()
      .withMessage("Not a valid creator id")
      .notEmpty()
      .withMessage("Creator id is required")
      .bail(),
    body("userID")
      .isMongoId()
      .withMessage("Not a valid user id")
      .notEmpty()
      .withMessage("User id is required")
      .bail(),
    body("note")
      .isLength({ min: 0, max: 250 })
      .withMessage("Note must be between 0 and 250 characters long")
      .bail(),
  ],
};

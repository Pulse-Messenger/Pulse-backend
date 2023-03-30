import { body, param } from "express-validator";

export const NewInviteValidator = {
  validator: [
    param("roomID")
      .isMongoId()
      .withMessage("Not a valid Room id")
      .notEmpty()
      .withMessage("Room id is required")
      .bail(),
  ],
};

export const RemoveInviteValidator = {
  validator: [
    param("inviteID")
      .isMongoId()
      .withMessage("Not a valid invite id")
      .notEmpty()
      .withMessage("Invite id is required")
      .bail(),
  ],
};

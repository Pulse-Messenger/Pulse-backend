import { body, param } from "express-validator";

export const NewRoomValidator = {
  validator: [
    body("name")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Room name is required")
      .isLength({ min: 5, max: 20 })
      .withMessage("Room name must be between 5 and 20 characters long")
      .bail(),
  ],
};

export const RoomIDValidator = {
  validator: [
    param("roomID")
      .isMongoId()
      .withMessage("Not a valid room ID")
      .notEmpty()
      .withMessage("Room ID is required")
      .bail(),
  ],
};

export const RoomInviteValidator = {
  validator: [
    param("inviteCode")
      .notEmpty()
      .withMessage("Invite code is required")
      .isLength({ min: 8, max: 8 })
      .withMessage("Not a valid invite code")
      .bail(),
  ],
};

export const UpdateRoomValidator = {
  validator: [
    param("roomID").isMongoId().withMessage("Room ID is required").bail(),
    body("name")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Room name is required")
      .isLength({ min: 5, max: 20 })
      .withMessage("Room name must be between 1 and 20 characters long")
      .bail(),
  ],
};

export const DMValidator = {
  validator: [
    body("friendID").isMongoId().withMessage("Friend ID is required").bail(),
  ],
};

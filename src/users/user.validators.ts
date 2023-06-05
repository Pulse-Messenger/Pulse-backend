import { body, param } from "express-validator";

export const UpdateValidator = {
  validator: [
    body("displayName")
      .isString()
      .trim()
      .notEmpty()
      .withMessage("Display name is required.")
      .bail()
      .isLength({ min: 5, max: 20 })
      .withMessage("Display name must be between 5 and 20 characters.")
      .bail(),
    body("about")
      .isString()
      .trim()
      .isLength({ min: 0, max: 200 })
      .withMessage("About name must be between 0 and 200 characters.")
      .bail(),
    body("password").custom((pwd) => {
      if (!pwd) return true;
      return pwd.length >= 6;
    }),
  ],
};

export const GetOneValidator = {
  validator: [
    param("userID").isMongoId().withMessage("Not a valid user ID").bail(),
  ],
};

export const ReorderRoomsValidator = {
  validator: [
    body("rooms").isArray().withMessage("Rooms must be an array").bail(),
  ],
};

export const GetManyValidator = {
  validator: [
    param("roomID").isMongoId().withMessage("Not a valid room ID").bail(),
  ],
};

export const FriendValidator = {
  validator: [
    param("friendID").isMongoId().withMessage("Not a valid friend ID").bail(),
  ],
};

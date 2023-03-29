import { body, param } from "express-validator";

export const NewChannelValidator = {
  validator: [
    body("name")
      .isString()
      .notEmpty()
      .withMessage("Name is required.")
      .bail()
      .isLength({ min: 1, max: 32 })
      .withMessage("Name must be between 1 and 32 characters.")
      .bail(),
    body("category")
      .isString()
      .withMessage("Category is required.")
      .bail()
      .isLength({ min: 0, max: 20 })
      .withMessage("Category must be between 0 and 20 characters.")
      .bail(),
    body("description")
      .isString()
      .notEmpty()
      .withMessage("Description is required.")
      .bail()
      .isLength({ min: 1, max: 50 })
      .withMessage("Description must be between 1 and 50 characters.")
      .bail(),
    body("roomID")
      .notEmpty()
      .withMessage("Room ID is required")
      .bail()
      .isMongoId()
      .withMessage("Not a valid room ID")
      .bail(),
  ],
};

export const RemoveChannelValidator = {
  validator: [
    param("channelID")
      .notEmpty()
      .withMessage("Room ID is required")
      .bail()
      .isMongoId()
      .withMessage("Not a valid room ID")
      .bail(),
  ],
};

export const UpdateChannelValidator = {
  validator: [
    param("channelID")
      .notEmpty()
      .withMessage("Room ID is required")
      .bail()
      .isMongoId()
      .withMessage("Not a valid room ID")
      .bail(),
    body("name")
      .isString()
      .notEmpty()
      .withMessage("Name is required.")
      .bail()
      .isLength({ min: 1, max: 32 })
      .withMessage("Username must be between 1 and 32 characters.")
      .bail(),
    body("description")
      .isString()
      .notEmpty()
      .withMessage("Description is required.")
      .bail()
      .isLength({ min: 1, max: 50 })
      .withMessage("Description must be between 1 and 50 characters.")
      .bail(),
    body("category")
      .isString()
      .withMessage("Category is required.")
      .bail()
      .isLength({ min: 0, max: 20 })
      .withMessage("Category must be between 0 and 20 characters.")
      .bail(),
  ],
};

export const GetManyValidator = {
  validator: [
    param("roomID").isMongoId().withMessage("Not a valid room ID").bail(),
  ],
};

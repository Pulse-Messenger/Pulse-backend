import { body, param } from "express-validator";

export const GetMessageValidator = {
  validator: [
    param("messageID").isMongoId().withMessage("Not a valid message ID").bail(),
  ],
};

export const GetChannelMessagesValidator = {
  validator: [
    param("channelID").isMongoId().withMessage("Not a valid channel ID").bail(),
    param("skipNum")
      .isInt({ min: 0 })
      .withMessage("skipNum must be a positive integer")
      .bail(),
  ],
};

export const EditMessageValidator = {
  validator: [
    param("messageID").isMongoId().withMessage("Not a valid message ID").bail(),
    body("content")
      .isString()
      .notEmpty()
      .withMessage("Message content is required")
      .bail()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Message content must be between 1 and 2000 characters.")
      .bail(),
  ],
};

export const PublishMessageValidator = {
  validator: [
    body("content")
      .isString()
      .notEmpty()
      .withMessage("Message content is required")
      .bail()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Message content must be between 1 and 2000 characters.")
      .bail(),
    body("channelID")
      .notEmpty()
      .isMongoId()
      .withMessage("Not a valid channel ID")
      .bail(),
  ],
};

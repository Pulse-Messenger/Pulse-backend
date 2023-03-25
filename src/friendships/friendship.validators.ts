import { param } from "express-validator";

export const FriendshipValidator = {
  validator: [
    param("friendID")
      .isMongoId()
      .withMessage("FriendID ID is required.")
      .bail(),
  ],
};

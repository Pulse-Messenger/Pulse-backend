import { param } from "express-validator";

export const FriendshipValidator = {
  validator: [
    param("friendID")
      .isMongoId()
      .withMessage("FriendID ID is required.")
      .bail(),
  ],
};

export const NewFriendValidator = {
  validator: [
    param("username")
      .isLength({ max: 20, min: 1 })
      .withMessage("Username is required.")
      .bail(),
  ],
};

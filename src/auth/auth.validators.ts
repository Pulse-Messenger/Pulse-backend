import { body, param } from "express-validator";

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export const RegisterValidator = {
  validator: [
    body("username")
      .isString()
      .notEmpty()
      .withMessage("Username is required.")
      .bail()
      .isLength({ min: 5, max: 20 })
      .withMessage("Username must be between 5 and 20 characters.")
      .bail()
      .custom((value) => /^[A-Z0-9\_\-]*$/i.test(value))
      .withMessage(
        "Username can only contain letters, numbers, underscores, and dashes."
      ),
    body("email").isEmail().withMessage("Email is required.").bail(),
    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required.")
      .bail(),
  ],
};

export interface LoginData {
  username: string;
  password: string;
}

export const LoginValidator = {
  validator: [
    body("username")
      .isString()
      .notEmpty()
      .withMessage("Username is required")
      .bail(),
    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required")
      .bail(),
  ],
};

export const PasswordValidator = {
  validator: [
    body("password")
      .isString()
      .notEmpty()
      .withMessage("Password is required.")
      .bail(),
  ],
};

export const DeleteSessionValidator = {
  validator: [
    param("sessionID")
      .isMongoId()
      .withMessage("Session ID is required.")
      .bail(),
  ],
};

export const VerifyEmailValidator = {
  validator: [
    param("emailToken")
      .notEmpty()
      .withMessage("Email token is required.")
      .bail(),
  ],
};

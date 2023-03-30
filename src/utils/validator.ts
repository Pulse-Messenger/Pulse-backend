import { ValidationChain } from "express-validator";

export interface Validator<OutType> {
  validator: ValidationChain[];
}

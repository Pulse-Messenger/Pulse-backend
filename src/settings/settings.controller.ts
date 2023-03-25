import { SettingsValidator } from "./settings.validators";
import {
  Api,
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import { ICategories } from "../schemas/settings.schema.ts";
import { settignsService } from "./settings.service";
import { Request, Response } from "express";

@Controller("/settings")
class UserController {
  @Api("get", "/get")
  @Middleware(authenticatedOnly())
  async get(req: Request, res: Response) {
    try {
      const settings = await settignsService.get(getUserId(req));
      res.status(200).send(settings);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/update", SettingsValidator)
  @Middleware(authenticatedOnly())
  async updateSettings(
    data: { settings: ICategories },
    req: Request,
    res: Response
  ) {
    try {
      await settignsService.update(getUserId(req), data.settings);
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

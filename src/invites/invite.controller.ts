import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import {
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { inviteService } from "./invite.service";
import { NewInviteValidator, RemoveInviteValidator } from "./invite.validators";
import { Request, Response } from "express";

@Controller("/invites")
class InviteController {
  @ValidatedApi("post", "/create/:roomID", NewInviteValidator)
  @Middleware(authenticatedOnly())
  async create(
    data: {
      roomID: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      const invite = await inviteService.createInvite(
        data.roomID,
        getUserId(req)
      );

      res.status(200).send(invite);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/remove/:inviteID", RemoveInviteValidator)
  @Middleware(authenticatedOnly())
  async remove(
    data: {
      inviteID: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      await inviteService.removeInvite(data.inviteID, getUserId(req));

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

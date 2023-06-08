import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import {
  Api,
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { Request, Response } from "express";
import { UpdateNoteValidator } from "./note.validators";
import { noteService } from "./note.service";
import { rateLimit } from "express-rate-limit";

const noteLimiter = rateLimit({
  windowMs: 10000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

@Controller("/notes", noteLimiter)
class InviteController {
  @ValidatedApi("post", "/update/", UpdateNoteValidator)
  @Middleware(authenticatedOnly())
  async create(
    data: {
      creatorID: string;
      userID: string;
      note: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      await noteService.updateInvite(data.userID, data.creatorID, data.note);

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @Api("get", "/getUserNotes/")
  @Middleware(authenticatedOnly())
  async getUserNotes(req: Request, res: Response) {
    try {
      const notes = await noteService.getUserNotes(getUserId(req));

      res.status(200).send({ notes });
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

import { Request, Response } from "express";
import rateLimit from "express-rate-limit";

import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import {
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { messageService } from "./message.service";
import {
  EditMessageValidator,
  GetChannelMessagesValidator,
  GetMessageValidator,
  PublishMessageValidator,
} from "./message.validators";

const messageLimiter = rateLimit({
  windowMs: 10000, // 10 seconds
  max: 50, // Limit each IP to 50 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

@Controller("/messages", messageLimiter)
export class MessageController {
  @ValidatedApi("get", "/getOne/:messageID", GetMessageValidator)
  @Middleware(authenticatedOnly())
  async getOne(data: { messageID: string }, req: Request, res: Response) {
    try {
      const message = await messageService.getOne(
        data.messageID,
        getUserId(req)
      );
      res.status(200).send(message);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/publish", PublishMessageValidator)
  @Middleware(authenticatedOnly())
  async publish(
    data: { content: string; channelID: string },
    req: Request,
    res: Response
  ) {
    try {
      const { messageId } = await messageService.publish(
        data.content,
        data.channelID,
        getUserId(req)
      );

      res.status(201).send({ messageId });
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("delete", "/removeOne/:messageID", GetMessageValidator)
  @Middleware(authenticatedOnly())
  async removeOne(data: { messageID: string }, req: Request, res: Response) {
    try {
      const { messageId } = await messageService.removeOne(
        data.messageID,
        getUserId(req)
      );
      res.status(200).send({ messageId });
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/editOne/:messageID", EditMessageValidator)
  @Middleware(authenticatedOnly())
  async editOne(
    data: { messageID: string; content: string },
    req: Request,
    res: Response
  ) {
    try {
      const { messageId } = await messageService.editOne(
        data.messageID,
        data.content,
        getUserId(req)
      );
      res.status(200).send({ messageId });
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi(
    "get",
    "/getChannelMessages/:channelID/:skipNum",
    GetChannelMessagesValidator
  )
  @Middleware(authenticatedOnly())
  async getChannelMessages(
    data: { channelID: string; skipNum: number },
    req: Request,
    res: Response
  ) {
    try {
      const messages =
        (await messageService.getChannelMessages(
          data.channelID,
          50,
          data.skipNum,
          getUserId(req)
        )) ?? [];

      res.status(200).send(messages);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

import { Request, Response } from "express";
import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import {
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { channelService } from "./channel.service";
import {
  GetManyValidator,
  NewChannelValidator,
  RemoveChannelValidator,
  UpdateChannelValidator,
} from "./channel.validators";
import { rateLimit } from "express-rate-limit";

const channelLimiter = rateLimit({
  windowMs: 5000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

@Controller("/channels", channelLimiter)
class ChannelController {
  @ValidatedApi("post", "/create", NewChannelValidator)
  @Middleware(authenticatedOnly())
  async create(
    data: {
      name: string;
      category: string;
      roomID: string;
      description: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      const channel = await channelService.createChannel(data, getUserId(req));
      res.status(201).send(channel);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("delete", "/remove/:channelID", RemoveChannelValidator)
  @Middleware(authenticatedOnly())
  async remove(data: { channelID: string }, req: Request, res: Response) {
    try {
      await channelService.removeChannel(data.channelID, getUserId(req));
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("get", "/getOne/:channelID", RemoveChannelValidator)
  @Middleware(authenticatedOnly())
  async getOne(data: { channelID: string }, req: Request, res: Response) {
    try {
      const channel = await channelService.getOne(
        data.channelID,
        getUserId(req)
      );
      res.status(200).send(channel);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("get", "/getRoomChannels/:roomID", GetManyValidator)
  @Middleware(authenticatedOnly())
  async getRoomChannels(data: { roomID: string }, req: Request, res: Response) {
    try {
      const channels = await channelService.getRoomChannels(
        data.roomID,
        getUserId(req)
      );
      res.status(200).send(channels);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/updateOne/:channelID", UpdateChannelValidator)
  @Middleware(authenticatedOnly())
  async updateOne(
    data: {
      channelID: string;
      name: string;
      category: string;
      description: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      await channelService.updateOne(
        {
          name: data.name,
          category: data.category,
          description: data.description,
        },
        data.channelID,
        getUserId(req)
      );
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

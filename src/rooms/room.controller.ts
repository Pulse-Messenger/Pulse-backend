import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import {
  Api,
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { Request, Response } from "express";
import {
  RoomIDValidator,
  NewRoomValidator,
  RoomInviteValidator,
  DMValidator,
  UpdateRoomValidator,
} from "./room.validators";
import { roomService } from "./room.service";
import { rateLimit } from "express-rate-limit";

const roomsLimiter = rateLimit({
  windowMs: 5000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

@Controller("/rooms", roomsLimiter)
class RoomController {
  @ValidatedApi("post", "/create", NewRoomValidator)
  @Middleware(authenticatedOnly())
  async create(
    data: {
      name: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      const uid = getUserId(req);

      const roomData = {
        ...data,
        creatorID: uid,
        profilePic: `${process.env.S3_BASE_URL}/misc/Room.png`,
      };

      const r = await roomService.addRoom(roomData);

      res.status(201).send({ roomID: r.roomID });
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/updateOne/:roomID", UpdateRoomValidator)
  @Middleware(authenticatedOnly())
  async update(
    data: {
      roomID: string;
      name: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      await roomService.updateRoom(getUserId(req), data);

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @Api("get", "/get")
  @Middleware(authenticatedOnly())
  async get(req: Request, res: Response) {
    const rooms = await roomService.getUserRooms(getUserId(req));
    res.status(200).send(rooms);
  }

  @Api("get", "/getDMs")
  @Middleware(authenticatedOnly())
  async getDMs(req: Request, res: Response) {
    const rooms = await roomService.getUserDMs(getUserId(req));
    res.status(200).send(rooms);
  }

  @ValidatedApi("get", "/getOne/:roomID", RoomIDValidator)
  @Middleware(authenticatedOnly())
  async getOne(data: { roomID: string }, req: Request, res: Response) {
    try {
      const room = await roomService.getOne(data.roomID, getUserId(req));
      res.status(200).send(room);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/join/:inviteCode", RoomInviteValidator)
  @Middleware(authenticatedOnly())
  async join(data: { inviteCode: string }, req: Request, res: Response) {
    try {
      await roomService.joinRoom(data.inviteCode, getUserId(req));
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/leave/:roomID", RoomIDValidator)
  @Middleware(authenticatedOnly())
  async leave(data: { roomID: string }, req: Request, res: Response) {
    try {
      await roomService.leaveRoom(data.roomID, getUserId(req));
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("delete", "/remove/:roomID", RoomIDValidator)
  @Middleware(authenticatedOnly())
  async remove(data: { roomID: string }, req: Request, res: Response) {
    try {
      await roomService.removeRoom(data.roomID, getUserId(req));
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/createDM", DMValidator)
  @Middleware(authenticatedOnly())
  async createDM(data: { friendID: string }, req: Request, res: Response) {
    try {
      await roomService.createDM(getUserId(req), data.friendID);
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

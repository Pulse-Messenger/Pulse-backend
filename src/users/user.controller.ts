import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import {
  Api,
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { Request, Response } from "express";
import { userService } from "./user.service";
import {
  FriendValidator,
  GetManyValidator,
  GetOneValidator,
  ReorderRoomsValidator,
  UpdateValidator,
} from "./user.validators";

@Controller("/users")
class UserController {
  @Api("get", "/get")
  @Middleware(authenticatedOnly())
  async get(req: Request, res: Response) {
    const user = await userService.getSelf(getUserId(req));
    if (user) {
      res.status(200).send(user);
      return;
    }

    res.status(404).send({ errors: ["User does not exist!"] });
  }

  @ValidatedApi("get", "/getOne/:userID", GetOneValidator)
  @Middleware(authenticatedOnly())
  async getOne(data: { userID: string }, req: Request, res: Response) {
    const user = await userService.getOne(data.userID);
    if (data) {
      res.status(200).send(user);
      return;
    }

    res.status(404).send({ errors: ["User does not exist!"] });
  }

  @ValidatedApi("get", "/getRoomMembers/:roomID", GetManyValidator)
  @Middleware(authenticatedOnly())
  async getRoomMembers(data: { roomID: string }, req: Request, res: Response) {
    try {
      const users = await userService.getRoomMembers(
        data.roomID,
        getUserId(req)
      );
      res.status(200).send(users);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @Api("delete", "/removeOne")
  @Middleware(authenticatedOnly())
  async remove(req: Request, res: Response) {
    try {
      await userService.removeOne(getUserId(req));
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/updateOne", UpdateValidator)
  @Middleware(authenticatedOnly())
  async updateOne(
    data: {
      profilePic: string;
      displayName: string;
      about: string;
      password?: string;
    },
    req: Request,
    res: Response
  ) {
    try {
      await userService.updateOne(getUserId(req), data);
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/reorderRooms", ReorderRoomsValidator)
  @Middleware(authenticatedOnly())
  async reorderRooms(data: { rooms: string[] }, req: Request, res: Response) {
    try {
      await userService.reorderRooms(getUserId(req), data.rooms);
      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

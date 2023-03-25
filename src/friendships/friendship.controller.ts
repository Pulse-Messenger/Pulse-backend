import { Request, Response } from "express";
import { authenticatedOnly, getUserId } from "../auth/auth.middleware";
import {
  Api,
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import { friendshipService } from "./friendship.service";
import { FriendshipValidator } from "./friendship.validators";

@Controller("/friendships")
class FriendshipController {
  @Api("get", "/get")
  @Middleware(authenticatedOnly())
  async getFriendships(req: Request, res: Response) {
    try {
      const friendships = await friendshipService.getFriendships(
        getUserId(req)
      );

      res.status(200).send({
        friendships,
      });
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/create/:friendID", FriendshipValidator)
  @Middleware(authenticatedOnly())
  async createFriendship(
    data: { friendID: string },
    req: Request,
    res: Response
  ) {
    try {
      await friendshipService.createFriendship(getUserId(req), data.friendID);

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("delete", "/remove/:friendID", FriendshipValidator)
  @Middleware(authenticatedOnly())
  async removeFriendship(
    data: { friendID: string },
    req: Request,
    res: Response
  ) {
    try {
      await friendshipService.removeFriendship(getUserId(req), data.friendID);

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("delete", "/cancel/:friendID", FriendshipValidator)
  @Middleware(authenticatedOnly())
  async cancelFriendship(
    data: { friendID: string },
    req: Request,
    res: Response
  ) {
    try {
      await friendshipService.removeFriendship(getUserId(req), data.friendID);

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/accept/:friendID", FriendshipValidator)
  @Middleware(authenticatedOnly())
  async acceptFriendship(
    data: { friendID: string },
    req: Request,
    res: Response
  ) {
    try {
      await friendshipService.acceptFriendship(getUserId(req), data.friendID);

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("delete", "/reject/:friendID", FriendshipValidator)
  @Middleware(authenticatedOnly())
  async rejectFriendship(
    data: { friendID: string },
    req: Request,
    res: Response
  ) {
    try {
      await friendshipService.rejectFriendship(getUserId(req), data.friendID);

      res.sendStatus(200);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

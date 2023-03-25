import { Friendship } from "../schemas/friendship.schema";
import { io } from "../utils/websocket.server";

class FriendshipService {
  async getFriendships(userID: string) {
    const friendships =
      (await Friendship.find({
        $or: [{ creator: userID }, { friend: userID }],
      })) ?? [];

    return friendships;
  }

  async createFriendship(userID: string, friendID: string) {
    if (userID === friendID)
      throw {
        code: 400,
        message: "Friendship can only exist between different users",
      };

    const existingFriendship = await Friendship.findOne({
      $or: [
        { creator: userID, friend: friendID },
        { creator: friendID, friend: userID },
      ],
    });

    if (existingFriendship)
      throw { code: 400, message: "Friendship already exists" };

    const newFriendship = new Friendship({
      creator: userID,
      friend: friendID,
      accepted: false,
    });

    await newFriendship.save();

    const { _id, ...dt } = newFriendship.toObject();

    io.to([userID, friendID]).emit("friendship:new", {
      friendship: {
        id: _id,
        ...dt,
      },
    });
  }

  async removeFriendship(userID: string, friendID: string) {
    if (userID === friendID)
      throw {
        code: 400,
        message: "Friendship can only exist between different users",
      };

    const existingFriendship = await Friendship.findOne({
      $or: [
        { creator: userID, friend: friendID },
        { creator: friendID, friend: userID },
      ],
    });

    if (!existingFriendship)
      throw { code: 404, message: "Friendship doesn't exists" };

    await existingFriendship.remove();

    const { _id, ...dt } = existingFriendship.toObject();

    io.to([userID, friendID]).emit("friendship:remove", {
      friendship: {
        id: _id,
        ...dt,
      },
    });
  }

  async acceptFriendship(userID: string, friendID: string) {
    if (userID === friendID)
      throw {
        code: 400,
        message: "Friendship can only exist between different users",
      };

    const existingFriendship = await Friendship.findOne({
      $or: [{ creator: friendID, friend: userID }],
    });

    if (!existingFriendship)
      throw { code: 404, message: "Friendship doesn't exists" };

    existingFriendship.accepted = true;

    await existingFriendship.save();

    const { _id, ...dt } = existingFriendship.toObject();

    io.to([userID, friendID]).emit("friendship:accept", {
      friendship: {
        id: _id,
        ...dt,
      },
    });
  }

  async rejectFriendship(userID: string, friendID: string) {
    if (userID === friendID)
      throw {
        code: 400,
        message: "Friendship can only exist between different users",
      };

    const existingFriendship = await Friendship.findOne({
      $or: [{ creator: friendID, friend: userID }],
    });

    if (!existingFriendship)
      throw { code: 404, message: "Friendship doesn't exists" };

    await existingFriendship.remove();

    const { _id, ...dt } = existingFriendship.toObject();

    io.to([userID, friendID]).emit("friendship:reject", {
      friendship: {
        id: _id,
        ...dt,
      },
    });
  }
}

export const friendshipService = new FriendshipService();

import { Friendship } from "../schemas/friendship.schema";
import { User } from "../schemas/user.schema";
import { io } from "../utils/websocket.server";

class FriendshipService {
  async getFriendships(userID: string) {
    const friendships =
      (await Friendship.find({
        $or: [{ creator: userID }, { friend: userID }],
      })
        .lean(true)
        .select("-__v")) ?? [];

    return friendships;
  }

  async createFriendship(userID: string, username: string) {
    const friend = await User.findOne({ username });
    if (!friend)
      throw {
        code: 404,
        message: "This user does not exist",
      };

    if (userID === friend.id)
      throw {
        code: 400,
        message: "Friendship can only exist between different users",
      };

    const existingFriendship = await Friendship.findOne({
      $or: [
        { creator: userID, friend: friend.id },
        { creator: friend.id, friend: userID },
      ],
    });

    if (existingFriendship)
      throw { code: 400, message: "Friendship already exists" };

    const newFriendship = new Friendship({
      creator: userID,
      friend: friend.id,
      accepted: false,
    });

    await newFriendship.save();

    const { _id, __v, ...dt } = newFriendship.toObject();

    io.to([userID, friend.id]).emit("friendship:new", {
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

    const { _id, __v, ...dt } = existingFriendship.toObject();

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
      $or: [
        { creator: userID, friend: friendID },
        { creator: friendID, friend: userID },
      ],
    });

    if (!existingFriendship)
      throw { code: 404, message: "Friendship doesn't exists" };

    existingFriendship.accepted = true;

    await existingFriendship.save();

    const { _id, __v, ...dt } = existingFriendship.toObject();

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
      $or: [
        { creator: userID, friend: friendID },
        { creator: friendID, friend: userID },
      ],
    });

    if (!existingFriendship)
      throw { code: 404, message: "Friendship doesn't exists" };

    await existingFriendship.remove();

    const { _id, __v, ...dt } = existingFriendship.toObject();

    io.to([userID, friendID]).emit("friendship:reject", {
      friendship: {
        id: _id,
        ...dt,
      },
    });
  }
}

export const friendshipService = new FriendshipService();

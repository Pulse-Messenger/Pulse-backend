import { randomBytes, createHash } from "crypto";
import { Schema } from "mongoose";

import { User, IUserSchema } from "../schemas/user.schema";
import { ascrypt } from "../utils/crypto";
import { Room } from "../schemas/room.schema";
import { io } from "../utils/websocket.server";
import { settignsService } from "../settings/settings.service";
import { Friendship } from "../schemas/friendship.schema";

export class UserService {
  async UserExists(username: string, email: string) {
    const user = await User.findOne({ $or: [{ username }, { email }] }, null, {
      lean: true,
    }).select("_id");
    return !!user;
  }

  async UserVerified(username: string, email: string) {
    const user = await User.findOne({ $or: [{ username }, { email }] }).select(
      "verified"
    );
    return user?.verified;
  }

  async CreateUser(data: {
    username: string;
    email: string;
    password: string;
  }) {
    const salt = randomBytes(128).toString("base64");
    const hash = await ascrypt(data.password, salt, 64);

    let userData: IUserSchema = {
      username: data.username,
      email: data.email,
      displayName: data.username,
      profilePic: `${process.env.S3_BASE_URL}/misc/User.png`,
      rooms: [],
      DMs: [],
      verified: false,
      createdAt: Date.now(),
      about: "",
      messageNotifications: [],
      globalRoles: [],
      passwordHash: hash,
      passwordSalt: salt,
      sessions: [],
    };

    const user = new User(userData);
    await user.save();

    await settignsService.create(user.id);

    return user.toObject();
  }

  async getSelf(userID: string) {
    const user = await User.findById(userID)
      .select(
        "-passwordHash -passwordSalt -sessions.token -messageNotifications -__v"
      )
      .lean(true);

    return user;
  }

  async getOne(userID: string) {
    const user = await User.findById(userID)
      .select(
        "-email -passwordHash -passwordSalt -sessions -rooms -messageNotifications -__v"
      )
      .lean(true);

    return user;
  }

  async getRoomMembers(roomID: string, userID: string) {
    const room = await Room.findById(roomID);

    if (!room) throw { code: 404, message: "Room does not exist" };

    if (
      !room.members
        .map((member) => {
          return member.toString();
        })
        .includes(userID)
    )
      throw { code: 403, message: "Only members can view room info" };

    return (
      await room.populate({
        path: "members",
        select:
          "-email -passwordHash -passwordSalt -sessions -rooms -messageNotifications -__v",
      })
    ).members;
  }

  async updateOne(
    userID: string,
    data: {
      displayName: string;
      about: string;
      password?: string;
    }
  ) {
    const user = await User.findById(userID);
    if (!user) throw { code: 404, message: "User does not exist" };

    if (data.password) {
      console.log(data.password);
      const salt = randomBytes(128).toString("base64");
      const hash = await ascrypt(data.password, salt, 64);
      user.passwordSalt = salt;
      user.passwordHash = hash;
    }

    user.displayName = data.displayName;
    user.about = data.about;

    await user.save();

    io.to(userID).emit("activeUser:update", {
      user: {
        displayName: user.displayName,
        about: user.about,
        email: user.email,
      },
    });

    let members: string[] = [];
    const rooms = user.rooms;
    rooms.forEach(async (el: Schema.Types.ObjectId) => {
      const room = await Room.findById(el.toString());
      if (room) members = members.concat(room.members.map((m) => m.toString()));
    });
    const friends = await Friendship.find({
      $or: [{ creator: userID }, { friend: userID }],
    });
    members = members.concat(
      friends.map((fr) => {
        const friend =
          fr.creator.toString() === userID
            ? fr.friend.toString()
            : fr.creator.toString();
        return friend;
      })
    );

    io.to([...new Set(members)]).emit("users:update", {
      user: {
        userID,
        displayName: user.displayName,
        about: user.about,
      },
    });
  }

  async removeOne(userID: string) {
    const user = await User.findById(userID);

    if (!user) throw { code: 404, message: "User does not exist" };

    await user.remove();
  }

  async reorderRooms(userID: string, rooms: string[]) {
    const user = await User.findById(userID);

    if (!user) throw { code: 404, message: "User does not exist" };

    const areArraysEqual = (array1: string[], array2: string[]) => {
      return array1.sort().join(",") === array2.sort().join(",");
    };

    if (
      !areArraysEqual(
        user.rooms.map((room) => {
          return room.toString();
        }),
        rooms
      )
    )
      throw { code: 400, message: "Requested rooms do not match user rooms" };

    user.rooms = rooms;

    await user.save();
  }
}

export const userService = new UserService();

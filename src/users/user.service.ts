import { randomBytes, createHash } from "crypto";
import { Schema } from "mongoose";

import { User, IUserSchema } from "../schemas/user.schema";
import { ascrypt } from "../utils/crypto";
import { Room } from "../schemas/room.schema";
import { io } from "../utils/websocket.server";
import { settignsService } from "../settings/settings.service";

export class UserService {
  async UserExists(username: string, email: string) {
    let user = await User.findOne({ $or: [{ username }, { email }] });
    return !!user;
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
      about: "",
      globalRoles: [],
      passwordHash: hash,
      passwordSalt: salt,
      sessions: [],
    };

    const user = new User(userData);
    await user.save();

    await settignsService.create(user.id);

    return user.id;
  }

  async getSelf(userID: string) {
    const user = await User.findById(userID).select(
      "-passwordHash -passwordSalt -sessions.token"
    );

    return user;
  }

  async getOne(userID: string) {
    const user = await User.findById(userID).select(
      "-email -passwordHash -passwordSalt -sessions -rooms"
    );

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
        select: "-email -passwordHash -passwordSalt -sessions -rooms",
      })
    ).members;
  }

  async updateOne(
    userID: string,
    data: {
      displayName: string;
      about: string;
      email: string;
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
    user.email = data.email;

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
      if (room) members = members.concat(room.members);
    });

    io.to(members).emit("users:update", {
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

import { Schema, model } from "mongoose";

export const userSchema = new Schema({
  username: { type: String, index: true },
  email: String,
  displayName: String,
  profilePic: String,
  about: String,
  verified: Boolean,
  createdAt: Number,
  rooms: [{ type: Schema.Types.ObjectId, ref: "room", index: true }],
  DMs: [{ type: Schema.Types.ObjectId, ref: "room", index: true }],
  messageNotifications: [
    {
      type: {
        poster: { type: Schema.Types.ObjectId, ref: "user" },
        room: { type: Schema.Types.ObjectId, ref: "room" },
        channel: { type: Schema.Types.ObjectId, ref: "channel" },
        content: { type: String },
      },
    },
  ],
  globalRoles: [{ type: String }],
  passwordHash: String,
  passwordSalt: String,
  sessions: [
    {
      id: { type: Schema.Types.ObjectId },
      ip: String,
      useragent: String,
      token: { type: String, index: true },
    },
  ],
});

userSchema.post("remove", async function (this: IUserDocument) {
  try {
    const user = this;

    await model("settings").deleteOne({ userID: user.id });

    const rooms = await model("room").find({ _id: { $in: user.rooms } });
    for (const room of rooms) {
      if (room.creatorID.toString() === user.id) {
        await room.remove();
      }
    }

    await model("room").updateMany(
      { members: user.id },
      { $pull: { members: user.id } }
    );

    const friendships = await model("friendship").find({
      $or: [{ creator: user.id }, { friend: user.id }],
    });

    friendships.forEach((fr) => fr.remove());
  } catch (error: any) {
    return;
  }
});

export interface IUserSession {
  _id?: string;
  ip: string;
  useragent: string;
  token: string;
}

export interface IUserSchema {
  id?: string;
  username: string;
  email: string;
  displayName: string;
  profilePic: string;
  verified: boolean;
  createdAt: number;
  rooms: string[] | any[];
  DMs: string[] | any[];
  about: string;
  messageNotifications: [
    {
      poster: string | any;
      room: string | any;
      channel: string | any;
      content: string;
    }?
  ];
  globalRoles: string[];
  passwordHash: string;
  passwordSalt: string;
  sessions: IUserSession[];
  __v?: number;
}

export interface IUserDocument extends IUserSchema, Document {}
export const User = model<IUserDocument>("user", userSchema);

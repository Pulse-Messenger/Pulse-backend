import { Schema, model } from "mongoose";

export const friendshipSchema = new Schema({
  accepted: Boolean,
  creator: { type: String, ref: "user", index: true },
  friend: { type: String, ref: "user", index: true },
});

friendshipSchema.post("remove", async function (this: IFriendshipDocument) {});

export interface IFriendshipSchema {
  id?: string;
  accepted: boolean;
  creator: string;
  friend: string;
}

export interface IFriendshipDocument extends IFriendshipSchema, Document {}
export const Friendship = model<IFriendshipDocument>(
  "friendship",
  friendshipSchema
);

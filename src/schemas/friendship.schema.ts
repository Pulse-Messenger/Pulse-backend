import { Schema, model } from "mongoose";

export const friendshipSchema = new Schema({
  accepted: Boolean,
  creator: { type: Schema.Types.ObjectId, ref: "user", index: true },
  friend: { type: Schema.Types.ObjectId, ref: "user", index: true },
});

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

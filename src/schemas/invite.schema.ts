import { Schema, model } from "mongoose";

export const inviteSchema = new Schema({
  code: { type: String, index: true },
  timeCreated: { type: Number, expires: 60*60*24, default: Date.now() },
  roomID: { type: Schema.Types.ObjectId, ref: "room", index: true },
});

export interface IInviteSchema {
  id?: string;
  code: string;
  timeCreated: number;
  roomID: string | any;
  __v?: number;
}

export interface IInviteDocument extends IInviteSchema, Document {}
export const Invite = model<IInviteDocument>("invite", inviteSchema);

import { Schema, model } from "mongoose";

export const messageSchema = new Schema({
  content: String,
  sender: { type: Schema.Types.ObjectId, ref: "user" },
  channel: { type: Schema.Types.ObjectId, ref: "channel", index: true },
  timestamp: { type: Number, default: Date.now() },
});

export interface IMessageSchema {
  id?: string;
  content: string;
  sender: string | any;
  channel: string | any;
  timestamp: number;
  __v?: number;
}

export interface IMessageDocument extends IMessageSchema, Document {}
export const Message = model<IMessageDocument>("message", messageSchema);

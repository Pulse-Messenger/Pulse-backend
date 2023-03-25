import { Schema, model } from "mongoose";

export const noteSchema = new Schema({
  creatorID: { type: Schema.Types.ObjectId, ref: "user", index: true },
  userID: { type: Schema.Types.ObjectId, ref: "user", index: true },
  note: String,
});

export interface INoteSchema {
  id?: string;
  creatorID: string;
  userID: string;
  note: string;
}

export interface INoteDocument extends INoteSchema, Document {}
export const Note = model<INoteDocument>("note", noteSchema);

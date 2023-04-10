import { Schema, model, CallbackError } from "mongoose";

export const channelSchema = new Schema({
  name: String,
  category: String,
  description: String,
  room: { type: Schema.Types.ObjectId, ref: "room", index: true },
});

channelSchema.post("remove", async function (this: IChannelDocument) {
  try {
    const channel = this;

    await model("room").updateMany(
      { channels: channel.id },
      { $pull: { channels: channel.id } }
    );

    await model("message").deleteMany({ channel: this.id });
  } catch (error: any) {
    return;
  }
});

export interface IChannelSchema {
  id?: string;
  name: string;
  category: string;
  description: string;
  room: string | any;
  __v?: number;
}

export interface IChannelDocument extends IChannelSchema, Document {}
export const Channel = model<IChannelDocument>("channel", channelSchema);

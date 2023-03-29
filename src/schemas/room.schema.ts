import { Schema, model } from "mongoose";

export const roomSchema = new Schema({
  name: String,
  profilePic: String,
  timeCreated: { type: Number, default: Date.now() },
  creatorID: { type: Schema.Types.ObjectId, ref: "user", index: true },
  members: [{ type: Schema.Types.ObjectId, ref: "user", index: true }],
  channels: [{ type: Schema.Types.ObjectId, ref: "channel", index: true }],
  friendship: {
    type: {
      friendA: { type: Schema.Types.ObjectId, ref: "user", index: true },
      friendB: { type: Schema.Types.ObjectId, ref: "user", index: true },
    },
    default: null,
  },
});

roomSchema.post("remove", async function (this: IRoomDocument) {
  try {
    const room = this;

    await model("user").updateMany(
      {
        $or: [
          {
            rooms: room.id,
          },
          {
            DMs: room.id,
          },
        ],
      },
      {
        $pull: {
          rooms: room.id,
          DMs: room.id,
        },
      }
    );

    // cringe requires to trigger the remove hooks on channels manually
    const channels = await model("channel").find({
      _id: { $in: room.channels },
    });
    await model("channel").deleteMany({ _id: { $in: room.channels } });
    for (const channel of channels) {
      await channel.remove();
    }

    await model("invite").deleteMany({ roomID: room.id });
  } catch (error: any) {
    console.log(error);
    return;
  }
});

export interface IRoomSchema {
  id?: string;
  name: string;
  profilePic: string;
  timeCreated: number;
  creatorID: string | any;
  members: string[] | any[];
  channels: string[] | any[];
  friendship?: {
    friendA: string;
    friendB: string;
  };
}

export interface IRoomDocument extends IRoomSchema, Document {}
export const Room = model<IRoomDocument>("room", roomSchema);

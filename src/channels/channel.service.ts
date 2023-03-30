import mongoose from "mongoose";
import { roomService } from "../rooms/room.service";
import { Channel, IChannelSchema } from "../schemas/channel.schema";
import { Room } from "../schemas/room.schema";
import { io } from "../utils/websocket.server";

export class ChannelService {
  async createChannel(
    channelData: {
      name: string;
      category: string;
      description: string;
      roomID: string;
    },
    userID: string,
    dm?: boolean
  ) {
    const room = await Room.findById(channelData.roomID);

    if (!room) throw { code: 404, message: "Room not found" };

    if (room.friendship && dm)
      throw { code: 400, message: "Can't create channels in DM" };

    if (userID !== room.creatorID.toString())
      throw { code: 403, message: "Only room owners can add channels" };

    if (room.channels.length >= 50)
      throw { code: 400, message: "Max number of channels (50) reached" };

    const data: IChannelSchema = {
      name: channelData.name,
      category: channelData.category,
      description: channelData.description,
      room: channelData.roomID,
    };

    const channel = new Channel(data);
    room.channels.push(channel.id);

    await channel.save();
    await room.save();

    const { _id, ...dt } = channel.toObject();

    const members =
      room.members.map((mem) => {
        return mem.toString();
      }) ?? [];

    io.to(members).emit("channels:new", {
      channel: {
        id: _id,
        ...dt,
        messages: {},
      },
    });

    return { channelID: channel.id };
  }

  async removeChannel(channelID: string, userID: string, dm?: boolean) {
    const channel = await Channel.findById(channelID);

    if (!channel) throw { code: 404, message: "Channel not found" };

    const room = await Room.findById(channel.room);

    if (userID !== room?.creatorID.toString())
      throw { code: 403, message: "Only room owners can remove channels" };

    if (room.friendship && dm)
      throw { code: 400, message: "Can't remove channels in DM" };

    await channel.delete();

    const members =
      room.members.map((mem) => {
        return mem.toString();
      }) ?? [];

    io.to(members).emit("channels:remove", {
      channelID,
    });
  }

  async getOne(channelID: string, userID: string) {
    const channel = await Channel.findById(channelID).select("-messages");

    if (!channel) throw { code: 404, message: "Channel not found" };

    const room = await Room.findById(channel.room);

    if (!room) throw { code: 404, message: "Channel not in any room" };

    if (
      !room.members
        .map((member) => {
          return member.toString();
        })
        .includes(userID)
    )
      throw { code: 403, message: "Only room member can fetch channels" };

    return channel;
  }

  async getRoomChannels(roomID: string, userID: string) {
    const room = await Room.findById(roomID).populate({
      path: "channels",
    });

    if (!room) throw { code: 404, message: "Room does not exist" };

    if (
      !room.members
        .map((member) => {
          return member.toString();
        })
        .includes(userID)
    )
      throw { code: 403, message: "Only room member can fetch channels" };

    return room.channels;
  }

  async updateOne(
    data: { name: string; category: string; description: string },
    channelID: string,
    userID: string
  ) {
    const channel = await Channel.findById(channelID);

    if (!channel) throw { code: 404, message: "Channel not found" };

    const room = await Room.findById(channel.room);

    if (!room) throw { code: 404, message: "Channel not in any room" };

    if (userID !== room.creatorID.toString())
      throw { code: 403, message: "Only room owners can edit channels" };

    channel.name = data.name;
    channel.category = data.category;
    channel.description = data.description;

    await channel.save();

    const members =
      room.members.map((mem) => {
        return mem.toString();
      }) ?? [];

    const { _id, ...dt } = channel.toObject();

    io.to(members).emit("channels:update", {
      channel: {
        id: _id,
        ...dt,
        messages: {},
      },
    });
  }
}

export const channelService = new ChannelService();

import DOMPurify from "isomorphic-dompurify";
import mongoose from "mongoose";

import { Channel } from "../schemas/channel.schema";
import { Room } from "../schemas/room.schema";
import { IMessageSchema, Message } from "../schemas/message.schema";
import { io } from "../utils/websocket.server";
import { Friendship } from "../schemas/friendship.schema";

export class MessageService {
  async getOne(messageID: string, userID: string) {
    const message = await Message.findById(messageID).select("-__v");

    if (!message) throw { code: 404, message: "Message does not exist" };

    const channel = await Channel.findById(message.channel);

    if (!channel)
      throw { code: 404, message: "Message does not exist in any channel" };

    const room = await Room.findById(channel.room);

    if (
      !room?.members
        .map((member) => {
          return member.toString();
        })
        .includes(userID)
    )
      throw {
        code: 403,
        message: "Only room members can view room messages",
      };

    return message.toObject();
  }

  async publish(content: string, channelID: string, userID: string) {
    const data: IMessageSchema = {
      sender: new mongoose.Types.ObjectId(userID),
      content: await this.parseMessage(content.trim()),
      channel: channelID,
      timestamp: Date.now(),
    };

    if (!data.content || data.content.length === 0)
      throw {
        code: 400,
        message: "Message cannot be empty",
      };

    const channel = await Channel.findById(channelID);
    if (!channel)
      throw {
        code: 404,
        message: "Channel does not exist",
      };

    const room = await Room.findById(channel.room);
    const members =
      room?.members.map((member) => {
        return member.toString();
      }) ?? [];

    if (!members.includes(userID))
      throw {
        code: 403,
        message: "Only room members can publish room messages",
      };

    if (room?.friendship) {
      const friendship = await Friendship.findOne({
        $or: [
          { creator: room.friendship.friendA, friend: room.friendship.friendB },
          { creator: room.friendship.friendB, friend: room.friendship.friendA },
        ],
      });
      if (!friendship || !friendship.accepted)
        throw {
          code: 403,
          message: "You can only message friends",
        };
    }

    const newMessage = new Message(data);

    await channel.save();
    await newMessage.save();

    io.to(members).emit("messages:new", {
      message: {
        channel: newMessage.channel,
        content: newMessage.content,
        id: newMessage.id,
        sender: newMessage.sender,
        timestamp: newMessage.timestamp,
      } as IMessageSchema,
    });

    return { messageId: newMessage.id };
  }

  async removeOne(messageID: string, userID: string) {
    const message = await Message.findById(messageID);

    if (!message) throw { code: 404, message: "Message does not exist" };

    const channel = await Channel.findById(message.channel);

    if (!channel)
      throw { code: 404, message: "Message does not exist in any channel" };

    const room = await Room.findById(channel.room);
    const members =
      room?.members.map((member) => {
        return member.toString();
      }) ?? [];

    if (message.sender.toString() !== userID && room?.friendship)
      throw {
        code: 403,
        message: "Only mesage creators can remove messages in a DM",
      };

    if (
      message.sender.toString() !== userID &&
      room?.creatorID.toString() !== userID
    )
      throw {
        code: 403,
        message: "Only mesage creators and room owners can remove messages",
      };

    await message.remove();

    io.to(members).emit("messages:deleteOne", {
      messageID: message.id,
      channelID: message.channel,
    });

    return { messageId: message.id };
  }

  async editOne(messageID: string, content: string, userID: string) {
    const message = await Message.findById(messageID);
    if (!message) throw { code: 404, message: "Message does not exist" };

    if (message.sender.toString() === new mongoose.Types.ObjectId(messageID))
      throw {
        code: 403,
        message: "Only message sender can edit messages",
      };

    const room = await Room.findOne({ channels: message.channel });
    const members =
      room?.members.map((member) => {
        return member.toString();
      }) ?? [];

    message.content = await this.parseMessage(content.trim());

    if (!message.content || message.content.length === 0)
      throw {
        code: 400,
        message: "Message cannot be empty",
      };

    await message.save();

    const { _id, __v, ...dt } = message.toObject();

    io.to(members).emit("messages:update", {
      message: {
        id: _id,
        ...dt,
      },
    });

    return { messageId: message.id };
  }

  async getChannelMessages(
    channelID: string,
    limit: number,
    skip: number,
    userID: string
  ) {
    const room = await Room.findOne({
      channels: new mongoose.Types.ObjectId(channelID),
    });

    if (
      !room?.members
        .map((member) => {
          return member.toString();
        })
        .includes(userID)
    )
      throw {
        code: 403,
        message: "Only room members can view room messages",
      };

    const messages =
      (await Message.find({ channel: channelID }, null, {
        sort: { timestamp: -1 },
        limit,
        skip,
        lean: true,
      }).select("-__v")) ?? [];

    return messages;
  }

  async parseMessage(msg: string) {
    // return DOMPurify.sanitize(msg);
    return msg;
  }
}

export const messageService = new MessageService();

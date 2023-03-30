import DOMPurify from "isomorphic-dompurify";
import mongoose, { mongo } from "mongoose";

import { marked } from "marked";
import { JSDOM } from "jsdom";

import { Channel } from "../schemas/channel.schema";
import { Room } from "../schemas/room.schema";
import { IMessageSchema, Message } from "../schemas/message.schema";
import { io } from "../utils/websocket.server";
import { Friendship } from "../schemas/friendship.schema";

export class MessageService {
  async getOne(messageID: string, userID: string) {
    const message = await Message.findById(messageID);

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

    return message;
  }

  async publish(content: string, channelID: string, userID: string) {
    const data: IMessageSchema = {
      sender: new mongoose.Types.ObjectId(userID),
      content: await this.parseMessage(content.trim()),
      channel: channelID,
      timestamp: Date.now(),
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
        $or: [{ creator: userID }, { friend: userID }],
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

    if (
      message.sender.toString() !==
        new mongoose.Types.ObjectId(userID).toString() &&
      !room?.friendship
    )
      throw {
        code: 403,
        message: "Only mesage creators can remove messages in a DM",
      };

    if (
      message.sender.toString() !==
        new mongoose.Types.ObjectId(userID).toString() &&
      room?.creatorID.toString() !==
        new mongoose.Types.ObjectId(userID).toString()
    )
      throw {
        code: 403,
        message: "Only mesage creators and room owners can remove messages",
      };

    await message.remove();

    io.to(members).emit("messages:deleteOne", { messageID: message.id });

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
    await message.save();

    const { _id, ...dt } = message.toObject();

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
      })) ?? [];

    return messages;
  }

  // scuffed
  async parseMessage(msg: string) {
    let output = "";
    let inCodeBlock = false;

    for (let i = 0; i < msg.length; i++) {
      let char = msg[i];

      if (char === "`" && (i === 0 || msg[i - 1] !== "\\")) {
        inCodeBlock = !inCodeBlock;
      }

      if (!inCodeBlock) {
        char = char.replace(/[&<>"']/g, (tag) => {
          return (
            {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              "'": "&apos;",
              '"': "&quot;",
            }[tag] || tag
          );
        });
      }

      output += char;
    }

    const DOM = new JSDOM(await marked(output)).window.document;

    const imgTags = DOM.querySelectorAll("img");

    imgTags.forEach((imgTag) => {
      imgTag.parentNode?.removeChild(imgTag);
      DOM.body.insertBefore(imgTag, DOM.body.firstChild);
    });

    return DOMPurify.sanitize(DOM.documentElement.outerHTML);
  }
}

export const messageService = new MessageService();

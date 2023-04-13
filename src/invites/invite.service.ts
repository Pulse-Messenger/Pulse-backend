import { Room } from "../schemas/room.schema";
import { Invite } from "../schemas/invite.schema";

import { v4 as uuidv4 } from "uuid";
import { model } from "mongoose";

export class InviteService {
  async createInvite(roomID: string, userID: string) {
    const room = await Room.findById(roomID);
    if (!room) throw { code: 404, message: "Room not found" };

    if (room.friendship) {
      console.log(room.friendship);
      throw { code: 400, message: "Can't invite users to DM" };
    }

    if (room.creatorID.toString() != userID)
      throw { code: 403, message: "Only room owners can create invites" };

    let code;

    do {
      code = uuidv4().substring(0, 8);
    } while (await Invite.exists({ code }));

    const invite = new Invite({
      code,
      roomID,
    });

    await invite.save();

    return {
      invite: {
        _id: invite.id,
        code: invite.code,
        timeCreated: invite.timeCreated,
        roomID: invite.roomID,
      },
    };
  }

  async removeInvite(inviteID: string, userID: string) {
    const invite = await Invite.findById(inviteID);
    if (!invite) throw { code: 404, message: "Invite not found" };

    const room = await Room.findById(invite?.roomID);
    if (!room) throw { code: 404, message: "Room not found" };

    if (room.creatorID.toString() != userID)
      throw { code: 403, message: "Only room owners can remove invites" };

    await invite.remove();
  }
}

export const inviteService = new InviteService();

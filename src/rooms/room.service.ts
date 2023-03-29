import { channelService } from "../channels/channel.service";
import { Room, IRoomSchema } from "../schemas/room.schema";
import { Invite } from "../schemas/invite.schema";
import { User, userSchema } from "../schemas/user.schema";
import { io } from "../utils/websocket.server";
import { Friendship } from "../schemas/friendship.schema";

export class RoomService {
  async addRoom(roomData: {
    name: string;
    profilePic: string;
    creatorID: string;
  }) {
    const data: IRoomSchema = {
      name: roomData.name,
      profilePic: roomData.profilePic,
      timeCreated: Date.now(),
      creatorID: roomData.creatorID,
      members: [roomData.creatorID],
      channels: [],
      friendship: undefined,
    };

    const newRoom = new Room(data);
    await newRoom.save();

    const newChanel = await channelService.createChannel(
      {
        roomID: newRoom.id,
        name: "Welcome",
        category: "",
        description: `Welcome to ${newRoom.name}`,
      },
      roomData.creatorID
    );
    if (!newChanel) throw { code: 400, message: "Failed to create channel" };

    const user = await User.findById(roomData.creatorID);
    if (!user) throw { code: 404, message: "Room creator not found" };

    user.rooms.push(newRoom.id);

    await user.save();

    const { _id, ...dt } = newRoom.toObject();

    io.to(user.id).emit("rooms:create", {
      room: {
        id: _id,
        ...dt,
      },
    });

    return { roomID: newRoom.id };
  }

  async removeRoom(roomID: string, userID: string) {
    const room = await Room.findById(roomID);

    if (!room) throw { code: 404, message: "Room not found" };

    const members =
      room.members.map((mem) => {
        return mem.toString();
      }) ?? [];

    if (!room.friendship && userID !== room.creatorID.toString())
      throw { code: 403, message: "Only room owner can delete the room" };
    else if (room.friendship && !room.members.includes(userID))
      throw { code: 403, message: "Only DM members can delete the DM" };

    await room.remove();

    io.to(members).emit(room.friendship ? "DMs:deleteOne" : "rooms:deleteOne", {
      roomID,
      userID,
    });
  }

  async joinRoom(inviteCode: string, userID: string) {
    const invite = await Invite.findOne({ code: inviteCode });
    if (!invite) throw { code: 404, message: "Invite not found" };

    const room = await Room.findById(invite?.roomID);
    if (!room) throw { code: 404, message: "Room not found" };

    if (room.friendship) throw { code: 400, message: "Can't join a DM" };

    const members =
      room.members.map((mem) => {
        return mem.toString();
      }) ?? [];

    if (members.includes(userID))
      throw { code: 400, message: "User already member in room" };

    const user = await User.findById(userID);
    if (!user || user.rooms.length > 100)
      throw { code: 400, message: "User can be in maximum of 100 rooms" };

    user.rooms.push(room.id);
    room.members.push(userID);

    await room.save();
    await user.save();

    members.push(userID);

    io.to(members).emit("rooms:join", {
      roomID: invite.roomID,
      user: {
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        profilePic: user.profilePic,
        about: user.about,
      },
    });
  }

  async leaveRoom(roomID: string, userID: string) {
    const room = await Room.findById(roomID);
    if (!room) throw { code: 404, message: "Room not found" };

    if (room.creatorID === userID)
      throw { code: 400, message: "Room creator can't leave room" };

    if (room.friendship) throw { code: 400, message: "Can't leave a DM" };

    const members =
      room.members.map((mem) => {
        return mem.toString();
      }) ?? [];

    const user = await User.findById(userID);
    if (!user || !members.includes(userID))
      throw { code: 400, message: "User is not a member in room" };

    await user.updateOne({ $pull: { rooms: roomID } });
    await room.updateOne({ $pull: { members: userID } });

    io.to(members).emit("rooms:leave", {
      roomID,
      userID,
    });
  }

  async getUserRooms(userID: string) {
    const rooms = (await User.findById(userID).select("rooms"))?.rooms ?? [];
    return rooms;
  }

  async getUserDMs(userID: string) {
    const DMs = (await User.findById(userID).select("DMs"))?.DMs ?? [];
    return DMs;
  }

  async getOne(roomID: string, userID: string) {
    const room = await Room.findById(roomID);

    if (!room) throw { code: 404, message: "Room not found" };

    if (
      !room.members
        .map((member) => {
          return member.toString();
        })
        .includes(userID)
    )
      throw { code: 403, message: "Only members can view room info" };

    return room;
  }

  async createDM(userID: string, friendID: string) {
    const user = await User.findById(userID);
    if (!user) throw { code: 404, message: "User does not exist" };

    const friend = await User.findById(friendID);
    if (!friend) throw { code: 404, message: "Friend does not exist" };

    const friendship = await Friendship.findOne({
      $or: [
        { creator: userID, friend: friendID },
        { creator: friendID, friend: userID },
      ],
    });

    if (!friendship || !friendship.accepted)
      throw { code: 400, message: "You can only DM a friend" };

    const dm = await Room.findOne({
      $or: [
        { "friendship.friendA": userID, "friendship.friendB": friendID },
        { "friendship.friendA": friendID, "friendship.friendB": userID },
      ],
    });

    if (dm) throw { code: 400, message: "DM already exists" };

    const data: IRoomSchema = {
      name: user.username + "+" + friend.username,
      profilePic: "",
      timeCreated: Date.now(),
      creatorID: userID,
      members: [userID, friendID],
      channels: [],
      friendship: {
        friendA: user.id,
        friendB: friend.id,
      },
    };

    const newRoom = new Room(data);
    await newRoom.save();

    const newChanel = await channelService.createChannel(
      {
        roomID: newRoom.id,
        name: "",
        category: "",
        description: "",
      },
      userID
    );
    if (!newChanel) throw { code: 400, message: "Failed to create channel" };

    user.DMs.push(newRoom.id);
    friend.DMs.push(newRoom.id);

    await user.save();
    await friend.save();

    const { _id, ...dt } = newRoom.toObject();

    io.to([user.id, friend.id]).emit("DMs:create", {
      room: {
        id: _id,
        ...dt,
      },
    });

    return { roomID: newRoom.id };
  }
}

export const roomService = new RoomService();

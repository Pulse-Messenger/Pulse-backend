import { v4 as uuidv4 } from "uuid";

import { Note } from "../schemas/note.schema";
import { User } from "../schemas/user.schema";
import { io } from "../utils/websocket.server";

export class NoteService {
  async updateInvite(userID: string, creatorID: string, noteValue: string) {
    const creator = await User.findById(creatorID);
    if (!creator) throw { code: 404, message: "Creator not found" };

    const user = await User.findById(userID);
    if (!user) throw { code: 404, message: "User not found" };

    const note = await Note.findOne({ creatorID, userID });
    if (note) {
      note.note = noteValue;
      await note.save();
    } else {
      const newNote = new Note({
        creatorID,
        userID,
        note: noteValue,
      });
      await newNote.save();
    }

    io.to(creatorID).emit("notes:update", {
      note: {
        userID,
        note: noteValue,
      },
    });
  }

  async getUserNotes(userID: string) {
    const notes =
      (await Note.find({ creatorID: userID }, null, {
        lean: true,
      }).select("-__v")) ?? [];

    return notes;
  }
}

export const noteService = new NoteService();

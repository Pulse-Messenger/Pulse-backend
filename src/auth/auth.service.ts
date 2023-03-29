import { User, IUserSchema, IUserSession } from "../schemas/user.schema";
import { ascrypt } from "../utils/crypto";
import { io } from "../utils/websocket.server";

import * as jwt from "jsonwebtoken";
import { CronJob } from "cron";

export class AuthService {
  async checkPassword(username: string, password: string, userID?: string) {
    let user;
    if (!userID)
      user = await User.findOne({ $or: [{ username }, { email: username }] });
    else user = await User.findById(userID);

    if (!user) {
      throw { code: 404, message: "User not found" };
    }
    const salt = user.passwordSalt;
    const loginHash = await ascrypt(password, salt, 64);

    return loginHash === user.passwordHash;
  }

  async createSession(uname: string, ip: string, useragent: string) {
    const user = await User.findOne({
      $or: [{ username: uname }, { email: uname }],
    });

    if (!user) {
      throw { code: 404, message: "User not found" };
    }

    const session = user.sessions.find((ses) => {
      return ses.ip == ip && ses.useragent == useragent;
    });
    const { username, id } = user;
    let token;

    if (!session) {
      token = jwt.sign(
        { username, userID: id },
        process.env.JWT_SECRET as string,
        {
          issuer: "Pulse",
          subject: username,
        }
      );

      user.sessions.push({
        ip,
        useragent,
        token,
      });
      await user.save();

      io.to(id).emit("session:update", {
        sessions: user.sessions,
      });
    } else {
      token = session.token;
    }

    return {
      token,
    };
  }

  async checkSession(token: string) {
    try {
      const user = await User.findOne({
        "sessions.token": token,
      });
      if (!user) throw "Err";

      const res = jwt.verify(token, process.env.JWT_SECRET as string);

      const sessionID = user.sessions
        .find((ses) => ses.token == token)
        ?._id?.toString();

      //@ts-ignore
      if (res) res.sessionID = sessionID;

      return res;
    } catch {
      return false;
    }
  }

  async deleteCurrentSession(token: string) {
    const user = await User.findOne({
      "sessions.token": token,
    });

    if (!user) {
      throw { code: 404, message: "Session not found" };
    }

    user.sessions = user.sessions.filter((s: any) => !(s.token === token));
    await user.save();

    io.to(user.id).emit("session:update", {
      sessions: user.sessions,
    });
  }

  async deleteSession(userID: string, sessionID: string) {
    const user = await User.findOne({
      "sessions._id": sessionID,
    });

    if (!user) {
      throw { code: 404, message: "Session not found" };
    }

    if (user.id !== userID)
      throw { code: 403, message: "Users can only delete their own sessions" };

    user.sessions = user.sessions.filter(
      (s: any) => !(s._id.toString() === sessionID)
    );

    await user.save();

    io.to(sessionID).emit("session:delete");
    io.to(userID).emit("session:update", {
      sessions: user.sessions,
    });
  }

  async deleteAllSessions(uid: string) {
    const user = await User.findById(uid);

    if (!user) {
      throw { code: 404, message: "User not found" };
    }

    user.sessions = [];
    await user.save();

    io.to(uid).emit("session:delete");
  }

  async getSessions(uid: string) {
    const user = await User.findOne({ id: uid });

    if (!user) {
      throw { code: 404, message: "User not found" };
    }

    return user.sessions.map((s: any) => ({
      ip: s.ip,
      useragent: s.useragent,
    }));
  }

  async getSession(uid: string) {
    const user = await User.findOne({ id: uid });

    if (!user) {
      throw { code: 404, message: "User not found" };
    }

    return user.sessions.map((s: any) => ({
      ip: s.ip,
      useragent: s.useragent,
    }));
  }

  async verifyEmail(userID: string) {
    const user = await User.findById(userID);
    if (!user) throw { code: 404, message: "User does not exist" };

    if (!user.verified) {
      user.verified = true;

      await user.save();
    }
  }
}

// everyday at noon
const emailJob = new CronJob("0 */6 * * *	", async () => {
  const unverifiedUsers = await User.find({ verified: false });
  unverifiedUsers.forEach(async (usr) => {
    const now = Date.now();
    if (now - usr.createdAt >= 86400000) await usr.remove();
  });
});
emailJob.start();

export const authService = new AuthService();

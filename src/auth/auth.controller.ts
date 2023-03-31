import {
  Api,
  Controller,
  Middleware,
  ValidatedApi,
} from "../utils/controller.decorators";
import express from "express";
import {
  DeleteSessionValidator,
  LoginData,
  LoginValidator,
  PasswordValidator,
  RegisterData,
  RegisterValidator,
  VerifyEmailValidator,
} from "./auth.validators";
import { authService } from "./auth.service";
import { userService } from "../users/user.service";
import {
  authenticatedOnly,
  getUserId,
  notAuthenticatedOnly,
  getToken,
} from "./auth.middleware";
import { email } from "../utils/email";
import * as jwt from "jsonwebtoken";
import { JWT } from "google-auth-library";

@Controller("/auth")
class AuthController {
  @Api()
  @Middleware(authenticatedOnly())
  getAuthState(req: express.Request, res: express.Response) {
    res.send({ uid: getUserId(req) });
  }

  @ValidatedApi("post", "/register", RegisterValidator)
  @Middleware(notAuthenticatedOnly())
  async register(
    data: RegisterData,
    req: express.Request,
    res: express.Response
  ) {
    if (await userService.UserExists(data.username, data.email)) {
      res
        .status(400)
        .send({ errors: ["User with this username/email already exists"] });
      return;
    }

    const user = await userService.CreateUser(data);

    const emailToken = jwt.sign(
      { userID: user.id },
      process.env.JWT_SECRET as string,
      {
        issuer: "Pulse",
        subject: "Email",
      }
    );

    const tokenURL = `${
      req.protocol + "://" + req.get("host") + "/api/auth/verify/" + emailToken
    }`;

    email.sendEmail({
      to: data.email,
      subject: "Click to verify email",
      html: `
      <h3>Welcome To Pulse Messenger</h3>
      <a href="${tokenURL}">Click here to verify email</a>
      <p>Link doesn't work?</p>
      ${tokenURL}

      <p>Account will be automatically deleted after 1 day if you dont verify your email</p>
      `,
    });

    res.sendStatus(201);
  }

  @ValidatedApi("post", "/login", LoginValidator)
  @Middleware(notAuthenticatedOnly())
  async login(data: LoginData, req: express.Request, res: express.Response) {
    try {
      if (!(await userService.UserExists(data.username, data.username))) {
        res.status(404).send({ errors: ["User not found"] });
        return;
      }
      if (!(await userService.UserVerified(data.username, data.username))) {
        res.status(400).send({ errors: ["User is not verified"] });
        return;
      }

      if (!(await authService.checkPassword(data.username, data.password))) {
        res.status(400).send({ errors: ["Invalid password"] });
        return;
      }

      const tokens = await authService.createSession(
        data.username,
        req.headers["x-forwarded-for"]?.toString() ??
          req.socket.remoteAddress ??
          "???",
        req.headers["user-agent"] ?? "???"
      );

      res.send(tokens);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @Api("delete", "/logout")
  @Middleware(authenticatedOnly())
  async logout(req: express.Request, res: express.Response) {
    const token = getToken(req);
    try {
      await authService.deleteCurrentSession(token as string);
      res.sendStatus(204);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("delete", "/logoutOne/:sessionID", DeleteSessionValidator)
  @Middleware(authenticatedOnly())
  async delete(
    data: { sessionID: string },
    req: express.Request,
    res: express.Response
  ) {
    try {
      await authService.deleteSession(getUserId(req), data.sessionID);
      res.sendStatus(204);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @Api("delete", "/logoutAll")
  @Middleware(authenticatedOnly())
  async logoutAll(req: express.Request, res: express.Response) {
    const id = getUserId(req);
    try {
      await authService.deleteAllSessions(id);
      res.sendStatus(204);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @Api("get", "/sessions")
  @Middleware(authenticatedOnly())
  async getSessions(req: express.Request, res: express.Response) {
    try {
      const id = getUserId(req);

      const sessions = await authService.getSessions(id);
      res.send(sessions);
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @Api("get", "/checkSession")
  @Middleware(authenticatedOnly())
  async checkSession(req: express.Request, res: express.Response) {
    try {
      const token = getToken(req);
      if (!token) throw { code: 400, message: "Token missing" };

      const valid = await authService.checkSession(token);
      if (valid) {
        res.sendStatus(200);
      } else {
        throw { code: 400, message: "Session is invalid" };
      }
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("post", "/checkPassword", PasswordValidator)
  @Middleware(authenticatedOnly())
  async checkPassword(
    data: { password: string },
    req: express.Request,
    res: express.Response
  ) {
    try {
      const id = getUserId(req);

      const passwordMatch = await authService.checkPassword(
        "",
        data.password,
        id
      );
      res.send({ valid: passwordMatch });
    } catch (err: any) {
      res.status(err.code).send({ errors: [err.message] });
    }
  }

  @ValidatedApi("get", "/verify/:emailToken", VerifyEmailValidator)
  async verify(
    data: { emailToken: string },
    req: express.Request,
    res: express.Response
  ) {
    try {
      let dt;
      try {
        dt = jwt.verify(data.emailToken, process.env.JWT_SECRET!);
      } catch (_) {
        throw { code: 401, message: "Invalid email token" };
      }

      if (!dt) throw { code: 401, message: "Invalid email token" };

      //@ts-ignore
      await authService.verifyEmail(dt.userID);

      res.send("User is now verified");
    } catch (err: any) {
      console.error(err);
      res.status(err.code).send({ errors: [err.message] });
    }
  }
}

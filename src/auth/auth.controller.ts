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
import {
  verificationEmail,
  email,
  emailVerified,
  emailFailed,
} from "../utils/email";
import * as jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 10000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

@Controller("/auth", authLimiter)
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
      { userID: user._id },
      process.env.JWT_SECRET as string,
      {
        issuer: "Pulse",
        subject: "Email",
        expiresIn: "1d",
      }
    );

    const tokenURL = `${
      req.protocol + "://" + req.get("host") + "/api/auth/verify/" + emailToken
    }`;

    email.sendEmail({
      to: data.email,
      subject: "Click to verify email",
      html: verificationEmail(tokenURL),
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
        req.socket.remoteAddress?.split(",")[0] ??
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
      const exp = await authService.verifyEmail(dt.userID);

      res.send(emailVerified);
    } catch (err: any) {
      res.status(err.code).send(emailFailed);
    }
  }
}

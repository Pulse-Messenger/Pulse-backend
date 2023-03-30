import { NextFunction, Request, Response } from "express";
import { authService } from "./auth.service";

export const getToken = (req: Request) => {
  const token = req.headers.authorization;
  if (token?.startsWith("Bearer ")) return token.substring(7);
  return null;
};

export const notAuthenticatedOnly = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = getToken(req);

    if (!token) return next();

    if (!(await authService.checkSession(token))) {
      return next();
    }

    res.status(403).send({ errors: ["Already logged in!"] });
    return;
  };
};

export const authenticatedOnly = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = getToken(req);

    if (token) {
      const payload = await authService.checkSession(token);

      if (payload) {
        //@ts-ignore
        if (!req.verify) req.verify = {};

        //@ts-ignore
        req.verify.userID = payload.userID;
        //@ts-ignore
        req.verify.sessionID = payload.sessionID;
        return next();
      }
    }

    res.status(401).send({ errors: ["You need to be logged in."] });
    return;
  };
};

export const getUserId = (req: Request): string => {
  //@ts-ignore
  const uid: string | null = req.verify.userID;
  if (!uid) throw "No UID";
  return uid;
};

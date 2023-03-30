import express, { NextFunction, Request, Response } from "express";
import { config } from "dotenv";
import cors from "cors";
import http from "http";

import { mongoInit } from "./utils/mongoose";
import { routerInstance } from "./utils/app.router";
import { io, setupIOServer } from "./utils/websocket.server";
import { authenticatedOnly } from "./utils/websockets/websocket.middleware";

config();
import "./utils/logger";
import "./utils/marked";

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: "*",
  })
);
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    (err.message.includes("JSON") || err.message.includes("syntax"))
  ) {
    res.status(400).json({ error: "Bad Request - Invalid JSON" });
  } else {
    next();
  }
});

import "./auth/auth.controller";
import "./users/user.controller";
import "./rooms/room.controller";
import "./channels/channel.controller";
import "./messages/message.controller";
import "./invites/invite.controller";
import "./notes/note.controller";
import "./settings/settings.controller";
import "./friendships/friendship.controller";

app.use("/api", routerInstance);
console.log("Controllers loaded");

const server = http.createServer(app);
setupIOServer(server);

io.use(authenticatedOnly);

import "./utils/websockets/main.websocket";

server.listen(port, async () => {
  await mongoInit();

  console.log(`App listening on port`, port);
});

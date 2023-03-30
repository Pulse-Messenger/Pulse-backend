import { Server } from "socket.io";
import http from "http";

export const setupIOServer = (httpServer: http.Server) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_PATH!,
    },
  });
};

export let io: Server;

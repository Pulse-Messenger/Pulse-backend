import { Server } from "socket.io";
import http from "http";

export const setupIOServer = (httpServer: http.Server) => {
  io = new Server(httpServer, {
    cors: {
      origin: "https://app.pulse-messenger.com",
    },
  });
};

export let io: Server;

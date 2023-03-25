import { Server } from "socket.io";
import http from "http";

export const setupIOServer = (httpServer: http.Server) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
    },
  });
};

export let io: Server;

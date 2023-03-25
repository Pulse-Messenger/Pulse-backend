import { Socket } from "socket.io";
import { authService } from "../../auth/auth.service";

export const getToken = (socket: Socket) => {
  const token = socket.handshake.auth.token;
  if (token?.startsWith("Bearer ")) return token.substring(7);
  return null;
};

export const authenticatedOnly = async (socket: Socket, next: Function) => {
  const token = getToken(socket);
  if (token) {
    const payload = await authService.checkSession(token);
    if (payload) return next();
  }
  next(new Error("Not authenticated"));
};

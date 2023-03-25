import { authService } from "../../auth/auth.service";
import { io } from "../../utils/websocket.server";

io.on("connection", async (socket) => {
  const token = socket.handshake.auth.token?.startsWith("Bearer ")
    ? socket.handshake.auth.token.substring(7)
    : "";

  // @ts-ignore
  const { userID, sessionID } = await authService.checkSession(token);

  if (!userID) return;

  socket.join(userID);
  socket.join(sessionID);
  // console.debug("New connection: ", socket.rooms);
});

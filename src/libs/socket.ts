import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ConversationType } from "@prisma/client";
import { prisma } from "./prisma";
import { conversationService } from "../services/conversation.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthPayload {
  userId: string;
  role: string; // "USER" | "ADMIN"
}

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
  username: string;
}

// ─── Module-level io instance (dùng lại ở nơi khác nếu cần) ──────────────────

let io: SocketIOServer;

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO chưa được khởi tạo");
  return io;
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const RAW_CORS_ORIGIN = process.env.CORS_ORIGIN ?? "";
  const ALLOWED_ORIGINS = RAW_CORS_ORIGIN.split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Ping mỗi 25s, timeout 60s — tránh disconnect trên môi trường cloud
    pingInterval: 25_000,
    pingTimeout: 60_000,
  });

  // ─── Middleware: xác thực JWT ───────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        socket.handshake.headers?.authorization?.replace("Bearer ", "") ??
        "";

      if (!token) return next(new Error("UNAUTHORIZED"));

      const secret = process.env.JWT_SECRET;
      if (!secret) return next(new Error("SERVER_ERROR: missing JWT_SECRET"));

      const payload = jwt.verify(token, secret) as AuthPayload;

      // Lấy thêm username để hiển thị phía admin
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, username: true, role: true },
      });
      if (!user) return next(new Error("UNAUTHORIZED: user not found"));

      const authSocket = socket as AuthenticatedSocket;
      authSocket.userId = user.id;
      authSocket.userRole = user.role; // vẫn giữ để guard phía socket
      authSocket.username = user.username;

      next();
    } catch {
      next(new Error("UNAUTHORIZED: invalid token"));
    }
  });

  // ─── Connection handler ─────────────────────────────────────────────────────
  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;

    console.log(
      `[WS] connected  userId=${socket.userId}  role=${socket.userRole}  socketId=${socket.id}`,
    );

    // Mỗi user join room riêng theo userId → admin có thể emit trực tiếp
    socket.join(`user:${socket.userId}`);

    // Admin join room "admins" để nhận broadcast khi có tin nhắn mới từ user
    if (socket.userRole === "ADMIN") {
      socket.join("admins");
      console.log(`[WS] Admin ${socket.userId} joined room "admins"`);
    }

    // ── USER gửi tin nhắn cho admin ──────────────────────────────────────────
    socket.on(
      "user:send_to_admin",
      async (
        payload: { content: string },
        ack?: (res: { ok: boolean; data?: unknown; error?: string }) => void,
      ) => {
        try {
          if (!payload?.content?.trim()) {
            ack?.({ ok: false, error: "empty_content" });
            return;
          }

          const message = await conversationService.sendMessageToAdminService(
            socket.userId,
            { content: payload.content.trim() },
          );

          // Gửi lại cho chính user (confirm)
          socket.emit("conversation:new_message", { message });

          // Broadcast cho tất cả admin
          io.to("admins").emit("admin:new_user_message", {
            userId: socket.userId,
            username: socket.username,
            message,
          });

          ack?.({ ok: true, data: message });
        } catch (err) {
          console.error("[WS] user:send_to_admin error", err);
          ack?.({ ok: false, error: "server_error" });
        }
      },
    );

    // ── ADMIN gửi tin nhắn cho user cụ thể ───────────────────────────────────
    socket.on(
      "admin:send_to_user",
      async (
        payload: { targetUserId: string; content: string },
        ack?: (res: { ok: boolean; data?: unknown; error?: string }) => void,
      ) => {
        try {
          if (socket.userRole !== "ADMIN") {
            ack?.({ ok: false, error: "forbidden" });
            return;
          }
          if (!payload?.content?.trim() || !payload?.targetUserId) {
            ack?.({ ok: false, error: "invalid_payload" });
            return;
          }

          const message = await conversationService.adminReplyService(
            socket.userId,
            payload.targetUserId,
            { content: payload.content.trim() },
          );

          // Emit cho user nhận tin
          io.to(`user:${payload.targetUserId}`).emit(
            "conversation:new_message",
            { message },
          );

          // Emit lại cho admin đang gửi (confirm)
          socket.emit("admin:message_sent", {
            targetUserId: payload.targetUserId,
            message,
          });

          ack?.({ ok: true, data: message });
        } catch (err) {
          console.error("[WS] admin:send_to_user error", err);
          ack?.({ ok: false, error: "server_error" });
        }
      },
    );

    // ── ADMIN mở conversation của user → lấy messages (REST vẫn là primary) ──
    // Chỉ cần thông báo admin đang "xem" conversation của user (optional typing/read)
    socket.on(
      "admin:open_conversation",
      (payload: { targetUserId: string }) => {
        if (socket.userRole !== "ADMIN") return;
        // Có thể emit "typing" indicator hoặc "read" về sau
        console.log(
          `[WS] Admin ${socket.userId} opened conversation of user ${payload.targetUserId}`,
        );
      },
    );

    // ── Typing indicators (optional, tuỳ FE dùng) ────────────────────────────
    socket.on("user:typing", () => {
      io.to("admins").emit("admin:user_typing", { userId: socket.userId });
    });

    socket.on("admin:typing", (payload: { targetUserId: string }) => {
      if (socket.userRole !== "ADMIN") return;
      io.to(`user:${payload.targetUserId}`).emit("conversation:admin_typing");
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(
        `[WS] disconnected  userId=${socket.userId}  reason=${reason}`,
      );
    });
  });

  console.log("[WS] Socket.IO initialised");
  return io;
}

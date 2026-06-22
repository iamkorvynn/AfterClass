import { Server } from "socket.io";
import { redis } from "./lib/redis";
import { logger } from "./lib/logger";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret_key_123456";

export function initSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket JWT authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const payload = jwt.verify(token, JWT_ACCESS_SECRET) as any;
      socket.data = {
        userId: payload.sub,
        email: payload.email,
        campusDomain: payload.domain
      };
      next();
    } catch (err) {
      next(new Error("Invalid session token"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, campusDomain } = socket.data;
    logger.info({ userId, socketId: socket.id }, "User connected to WebSockets");

    // Track active connection and online presence
    await redis.set(`socket:user:${userId}`, socket.id);
    await redis.sadd("presence:online", userId);
    
    socket.broadcast.emit("user_online", { userId });

    // Join matchmaking roulette queue
    socket.on("join_queue", async () => {
      logger.info({ userId }, "User joined blind chat queue");
      
      const queueKey = `chat:queue:${campusDomain}`;
      
      // Enqueue user
      await redis.lpush(queueKey, userId);

      // Check if matching candidates are available
      const queueLen = await redis.llen(queueKey);
      if (queueLen >= 2) {
        const userA = await redis.rpop(queueKey);
        const userB = await redis.rpop(queueKey);

        if (userA && userB) {
          if (userA === userB) {
            // Re-enqueue if double-trigger pop
            await redis.lpush(queueKey, userA);
            return;
          }

          const roomId = crypto.randomUUID();
          
          // Save roulette room session details (24-hour expiration)
          const roomKey = `chat:room:${roomId}`;
          await redis.hset(roomKey, {
            userA,
            userB,
            createdAt: new Date().toISOString()
          });
          await redis.expire(roomKey, 86400);

          const socketAId = await redis.get(`socket:user:${userA}`);
          const socketBId = await redis.get(`socket:user:${userB}`);

          // Emit match results to both clients
          if (socketAId) {
            io.to(socketAId).emit("match_found", { roomId, partnerId: userB });
          }
          if (socketBId) {
            io.to(socketBId).emit("match_found", { roomId, partnerId: userA });
          }

          logger.info({ roomId, userA, userB }, "Match found and chat room provisioned");
        }
      }
    });

    // Quit matchmaking roulette queue
    socket.on("leave_queue", async () => {
      const queueKey = `chat:queue:${campusDomain}`;
      await redis.lrem(queueKey, 0, userId);
      logger.info({ userId }, "User left blind chat queue");
    });

    // Send chat message in active room
    socket.on("send_message", async (data: { roomId: string, content: string }) => {
      const { roomId, content } = data;
      const roomKey = `chat:room:${roomId}`;

      // Verify room existence and membership
      const room = await redis.hgetall(roomKey);
      if (!room || (room.userA !== userId && room.userB !== userId)) {
        socket.emit("error", { message: "Invalid chat room session" });
        return;
      }

      const partnerId = room.userA === userId ? room.userB : room.userA;
      const partnerSocketId = await redis.get(`socket:user:${partnerId}`);

      const messagePayload = {
        senderId: userId,
        content,
        timestamp: new Date().toISOString()
      };

      // Push history and cap list at 100 messages (24h TTL)
      const historyKey = `chat:room:${roomId}:messages`;
      await redis.lpush(historyKey, JSON.stringify(messagePayload));
      await redis.ltrim(historyKey, 0, 99);
      await redis.expire(historyKey, 86400);

      // Deliver message to partner socket
      if (partnerSocketId) {
        io.to(partnerSocketId).emit("receive_message", { roomId, ...messagePayload });
      }

      // Echo back to sender
      socket.emit("receive_message", { roomId, ...messagePayload });
    });

    // Handle typing state broadcasts
    socket.on("typing", async (data: { roomId: string, isTyping: boolean }) => {
      const { roomId, isTyping } = data;
      const roomKey = `chat:room:${roomId}`;
      
      const room = await redis.hgetall(roomKey);
      if (!room) return;

      const partnerId = room.userA === userId ? room.userB : room.userA;
      const partnerSocketId = await redis.get(`socket:user:${partnerId}`);

      if (partnerSocketId) {
        io.to(partnerSocketId).emit("typing", { roomId, userId, isTyping });
      }
    });

    // Handle chat reporting and termination
    socket.on("report_chat", async (data: { roomId: string }) => {
      const { roomId } = data;
      const roomKey = `chat:room:${roomId}`;
      
      const room = await redis.hgetall(roomKey);
      if (!room) return;

      const partnerId = room.userA === userId ? room.userB : room.userA;
      const partnerSocketId = await redis.get(`socket:user:${partnerId}`);

      // Delete room data instantly
      await redis.del(roomKey);
      await redis.del(`chat:room:${roomId}:messages`);

      if (partnerSocketId) {
        io.to(partnerSocketId).emit("partner_disconnected", { roomId });
      }
      
      logger.info({ roomId }, "Chat room terminated due to report");
    });

    // Connection termination
    socket.on("disconnect", async () => {
      logger.info({ userId, socketId: socket.id }, "User disconnected from WebSockets");
      
      await redis.del(`socket:user:${userId}`);
      await redis.srem("presence:online", userId);
      
      const queueKey = `chat:queue:${campusDomain}`;
      await redis.lrem(queueKey, 0, userId);

      socket.broadcast.emit("user_offline", { userId });
    });
  });

  return io;
}

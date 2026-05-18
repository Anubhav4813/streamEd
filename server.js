import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import helmet from "helmet";
import { z } from "zod";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routers
import { authRouter } from "./routes/auth.js";
import { liveRouter } from "./routes/live.js";
import { healthRouter } from "./routes/health.js";
import { peersRouter } from "./routes/peers.js";
import { schedulesRouter } from "./routes/schedules.js";
import { dashboardSessionsRouter } from "./routes/dashboard-sessions.js";
import { communityRouter } from "./routes/community.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = new Set(
    [
        process.env.CLIENT_ORIGIN,
        process.env.RENDER_EXTERNAL_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ].filter(Boolean)
);

const hasExplicitProductionOrigin = Boolean(process.env.CLIENT_ORIGIN || process.env.RENDER_EXTERNAL_URL);

function isAllowedOrigin(origin) {
    if (!origin) {
        return true;
    }

    if (ALLOWED_ORIGINS.has(origin)) {
        return true;
    }

    // If deployment origin was not configured, keep the app usable instead of failing all browser requests.
    if (process.env.NODE_ENV === "production" && !hasExplicitProductionOrigin) {
        return true;
    }

    return false;
}

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https://ui-avatars.com", "https://*.livekit.cloud", "https://picsum.photos", "https://i.pravatar.cc", "https://fastly.picsum.photos"],
            mediaSrc: ["'self'", "blob:", "mediastream:", "https://*.livekit.cloud"],
            connectSrc: ["'self'", "wss://*.livekit.cloud", "https://*.livekit.cloud", "wss://", "https://ui-avatars.com"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"],
            frameSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
}));

app.use(
    cors({
        origin: function (origin, callback) {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/live", liveRouter);
app.use("/health", healthRouter);
app.use("/api/peers", peersRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/dashboard-sessions", dashboardSessionsRouter);
app.use("/api/community", communityRouter);

// Serve Vite frontend build in production
const distPath = path.join(__dirname, "frontend", "dist");
app.use(express.static(distPath));

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: function (origin, callback) {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    },
    transports: ["websocket", "polling"],
});

const roomMessages = new Map();
const perUserRate = new Map();

function socketAuth(socket, next) {
    try {
        const token =
            socket.handshake.auth?.token ||
            (socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const user = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = user;
        next();
    } catch {
        next(new Error("Unauthorized"));
    }
}

io.use(socketAuth);

const joinSchema = z.object({
    roomName: z.string().min(1).max(120),
    isHost: z.boolean().optional(),
});

const sendSchema = z.object({
    roomName: z.string().min(1).max(120),
    text: z.string().trim().min(1).max(500),
    clientMessageId: z.string().optional(),
});

function isRateLimited(userKey) {
    const now = Date.now();
    const bucket = perUserRate.get(userKey) || [];
    const recent = bucket.filter((t) => now - t < 10_000);
    if (recent.length >= 20) return true;
    recent.push(now);
    perUserRate.set(userKey, recent);
    return false;
}

io.on("connection", (socket) => {
    socket.on("chat:join", async (payload, ack) => {
        const parsed = joinSchema.safeParse(payload);
        if (!parsed.success) {
            return ack?.({ ok: false, error: "Invalid roomName" });
        }

        const { roomName, isHost } = parsed.data;
        socket.join(roomName);

        let history = [];
        try {
            if (db) {
                if (isHost) {
                    // Host joining means a new session: wipe previous stream's messages
                    await db.run('DELETE FROM messages WHERE "roomName" = ?', [roomName]);
                    socket.to(roomName).emit("chat:cleared");
                } else {
                    history = await db.all(
                        'SELECT * FROM messages WHERE "roomName" = ? ORDER BY ts ASC LIMIT 100',
                        [roomName]
                    );
                }
            }
        } catch (e) {
            console.error("DB error fetching history:", e);
        }

        ack?.({ ok: true, history });

        if (!isHost) {
            const joinMessage = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                roomName,
                text: `${socket.user.username || socket.user.email || "A new viewer"} has joined the chat.`,
                senderId: "system",
                senderName: "System",
                ts: Date.now(),
                clientMessageId: null,
            };

            try {
                if (db) {
                    await db.run(
                        'INSERT INTO messages (id, "roomName", text, "senderId", "senderName", ts, "clientMessageId") VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [joinMessage.id, joinMessage.roomName, joinMessage.text, joinMessage.senderId, joinMessage.senderName, joinMessage.ts, joinMessage.clientMessageId]
                    );
                }
            } catch (e) {
                console.error("DB error saving join message:", e);
            }

            io.to(roomName).emit("chat:new", joinMessage);
        }
    });

    socket.on("chat:send", async (payload, ack) => {
        const parsed = sendSchema.safeParse(payload);
        if (!parsed.success) {
            return ack?.({ ok: false, error: "Invalid message payload" });
        }

        const { roomName, text, clientMessageId } = parsed.data;

        if (!socket.rooms.has(roomName)) {
            return ack?.({ ok: false, error: "Join room first" });
        }

        const userId = String(socket.user.id || socket.user.sub || "unknown-user");
        const limiterKey = `${roomName}:${userId}`;

        if (isRateLimited(limiterKey)) {
            return ack?.({ ok: false, error: "Too many messages, slow down" });
        }

        const message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            roomName,
            text,
            senderId: userId,
            senderName: socket.user.username || socket.user.email || userId,
            ts: Date.now(),
            clientMessageId: clientMessageId || null,
        };

        try {
            if (db) {
                await db.run(
                    'INSERT INTO messages (id, "roomName", text, "senderId", "senderName", ts, "clientMessageId") VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [message.id, message.roomName, message.text, message.senderId, message.senderName, message.ts, message.clientMessageId]
                );
            }
        } catch (e) {
            console.error("DB error saving chat message:", e);
        }

        io.to(roomName).emit("chat:new", message);
        ack?.({ ok: true, message });
    });

    socket.on("room:raise_hand", (payload) => {
        const { roomName, identity } = payload;
        const userId = socket.user.id || socket.user.sub || "unknown";
        const username = socket.user.username || socket.user.email || userId;

        io.to(roomName).emit("room:hand_raised", { userId, username, identity });
    });

    socket.on("disconnecting", () => { });
})

const PORT = Number(process.env.PORT || 3000);

let db;

async function startServer() {
    db = await initDb();

    app.locals.db = db;

    app.get("/{*path}", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
    });

    httpServer.listen(PORT, () => {
        console.log(`API + Socket.IO listening on: ${PORT}`);
    });
}

startServer();
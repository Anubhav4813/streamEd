import express from "express";
import { z } from "zod";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { auth } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

export const liveRouter = express.Router();

liveRouter.use(
    "/token",
    rateLimit({
        windowMs: 60 * 1000,
        max: 60,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

const liveTokenSchema = z.object({
    roomName: z.string().min(1).max(120),
    role: z.enum(["host", "viewer"]),
});

liveRouter.post("/token", auth, async (req, res) => {
    const parsed = liveTokenSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body" });
    }

    const { roomName, role } = parsed.data;
    const isHost = role === "host";
    const baseId = String(req.user.id || req.user.sub);

    const identity = 
        role === "host"
        ? `host:${baseId}`
        : `viewer:${baseId}:${Date.now()}`;

    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        { identity, ttl: "1h" }
    );

    at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: isHost,
        canSubscribe: true,
        canPublishData: true,
    });

    const token = await at.toJwt();

    return res.json({
        token,
        livekitUrl: process.env.LIVEKIT_URL,
    });
});

let roomService = null;
function getRoomService() {
    if (!roomService) {
        roomService = new RoomServiceClient(
            process.env.LIVEKIT_URL,
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET
        );
    }
    return roomService;
}

liveRouter.post("/grant-speaker", auth, async (req, res) => {
    try {
        const { roomName, identity } = req.body;
        
        await getRoomService().updateParticipant(
            roomName,
            identity,
            undefined,
            { canPublish: true, canSubscribe: true, canPublishData: true }
        );

        return res.json({ ok: true });
    } catch (err) {
        console.error("Failed to grant speaker:", err);
        return res.status(500).json({ error: "Failed to grant speaker" });
    }
});

liveRouter.get("/rooms", auth, async (req, res) => {
    try {
        const rooms = await getRoomService().listRooms();
        
        // Transform the LiveKit Room objects into standard objects for the frontend
        const mapped = rooms.map((room) => {
            let hostName = 'Host';
            if (room.name.startsWith('stream-')) {
                const parts = room.name.split('-');
                if (parts.length > 1) hostName = parts[1];
            } else if (room.name.includes('-')) {
                hostName = room.name.split('-')[0];
            }

            return {
                id: room.name,
                title: `${hostName}'s Live Session`,
                host: hostName,
                viewers: room.numParticipants || 0,
                rating: 5.0,
                subject: 'General'
            };
        });

        return res.json(mapped);
    } catch (err) {
        console.error("Failed to fetch rooms:", err);
        return res.status(500).json({ error: "Failed to fetch live rooms" });
    }
});

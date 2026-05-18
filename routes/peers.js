import express from "express";
import jwt from "jsonwebtoken";
import { RoomServiceClient } from "livekit-server-sdk";

export const peersRouter = express.Router();

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

// Optional auth middleware – doesn't block, just populates req.user if token present
function optionalAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.replace(/^Bearer\s+/i, "");
        if (token) {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        }
    } catch {
        // ignore bad tokens for read endpoints
    }
    next();
}

// Required auth middleware
function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.replace(/^Bearer\s+/i, "");
        if (!token) return res.status(401).json({ error: "Unauthorized" });
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

// GET /api/peers — list all peers (with optional search/filter)
peersRouter.get("/", optionalAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { q, category, sort } = req.query;

        let peers = await db.all('SELECT * FROM peers');
        
        let activeRooms = [];
        try {
            activeRooms = await getRoomService().listRooms();
        } catch (err) {
            console.error("Failed to fetch live rooms for peers:", err);
        }

        const mapped = peers.map(p => {
            // Check if this peer is hosting a room. Room names look like: stream-UserName-id
            // We can match it simply by seeing if a room name contains the peer's id (first 6 chars)
            const shortId = p.id.substring(0, 6);
            const liveRoom = activeRooms.find(r => r.name.includes(`-${shortId}`));

            return {
                ...p,
                strongIn: p.strongIn ? p.strongIn.split(',').map(s => s.trim()).filter(Boolean) : [],
                needsHelpWith: p.needsHelpWith ? p.needsHelpWith.split(',').map(s => s.trim()).filter(Boolean) : [],
                isOnline: Boolean(p.isOnline) || !!liveRoom, // Force online if they are streaming
                badges: p.badges ? p.badges.split(',').map(s => s.trim()).filter(Boolean) : [],
                liveRoomId: liveRoom ? liveRoom.name : null
            };
        });

        // Filter by category
        let result = mapped;
        if (category && category !== 'All') {
            result = result.filter(p => p.category === category);
        }

        // Filter by search query
        if (q) {
            const lower = q.toLowerCase();
            result = result.filter(p =>
                (p.name || '').toLowerCase().includes(lower) ||
                (p.bio || '').toLowerCase().includes(lower) ||
                (p.major || '').toLowerCase().includes(lower) ||
                p.strongIn.some(s => s.toLowerCase().includes(lower)) ||
                p.needsHelpWith.some(s => s.toLowerCase().includes(lower))
            );
        }

        // Sort
        if (sort === 'rating') {
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sort === 'online') {
            result.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
        } else {
            // Default: online first, then by rating
            result.sort((a, b) => {
                if (a.isOnline !== b.isOnline) return b.isOnline ? 1 : -1;
                return (b.rating || 0) - (a.rating || 0);
            });
        }

        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/peers/:id — get a single peer
peersRouter.get("/:id", optionalAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const p = await db.get('SELECT * FROM peers WHERE id = ?', [req.params.id]);
        if (!p) return res.status(404).json({ error: "Peer not found" });
        res.json({
            ...p,
            strongIn: p.strongIn ? p.strongIn.split(',').map(s => s.trim()).filter(Boolean) : [],
            needsHelpWith: p.needsHelpWith ? p.needsHelpWith.split(',').map(s => s.trim()).filter(Boolean) : [],
            isOnline: Boolean(p.isOnline),
            badges: p.badges ? p.badges.split(',').map(s => s.trim()).filter(Boolean) : []
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/peers/:id/connect — send a connection request
peersRouter.post("/:id/connect", requireAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id: toPeerId } = req.params;
        const { message } = req.body;

        const fromUserId = String(req.user.id || req.user.sub || 'unknown');
        const fromUsername = req.user.username || req.user.email || 'Anonymous';

        // Check peer exists
        const peer = await db.get('SELECT id FROM peers WHERE id = ?', [toPeerId]);
        if (!peer) return res.status(404).json({ error: "Peer not found" });

        // Check for existing pending request
        const existing = await db.get(
            'SELECT id FROM peer_requests WHERE "fromUserId" = ? AND "toPeerId" = ? AND status = ?',
            [fromUserId, toPeerId, 'pending']
        );
        if (existing) return res.status(409).json({ error: "Request already sent" });

        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        await db.run(
            'INSERT INTO peer_requests (id, "fromUserId", "fromUsername", "toPeerId", status, message, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?)',
            [requestId, fromUserId, fromUsername, toPeerId, 'pending', message || '', Date.now()]
        );

        res.status(201).json({ ok: true, requestId });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/peers/requests/mine — get my sent requests
peersRouter.get("/requests/mine", requireAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const fromUserId = String(req.user.id || req.user.sub);
        const requests = await db.all(
            'SELECT * FROM peer_requests WHERE "fromUserId" = ? ORDER BY "createdAt" DESC',
            [fromUserId]
        );
        res.json(requests);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/peers — create peer
peersRouter.post("/", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { name, avatar, major, category, rating, reviews, distance, bio, strongIn, needsHelpWith, isOnline, badges } = req.body;
        const id = 'p' + Date.now();
        await db.run(
            'INSERT INTO peers (id, name, avatar, major, category, rating, reviews, distance, bio, "strongIn", "needsHelpWith", "isOnline", badges) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, avatar || '', major || '', category || '', rating || 5.0, reviews || 0, distance || '0 km', bio || '', (strongIn || []).join(','), (needsHelpWith || []).join(','), isOnline ? true : false, (badges || []).join(',')]
        );
        res.status(201).json({ id, ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

peersRouter.put("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const { name, avatar, major, category, rating, reviews, distance, bio, strongIn, needsHelpWith, isOnline, badges } = req.body;
        const result = await db.run(
            'UPDATE peers SET name = ?, avatar = ?, major = ?, category = ?, rating = ?, reviews = ?, distance = ?, bio = ?, "strongIn" = ?, "needsHelpWith" = ?, "isOnline" = ?, badges = ? WHERE id = ?',
            [name, avatar || '', major || '', category || '', rating || 5.0, reviews || 0, distance || '0 km', bio || '', (strongIn || []).join(','), (needsHelpWith || []).join(','), isOnline ? true : false, (badges || []).join(','), id]
        );
        if (result.changes === 0) return res.status(404).json({ error: "Peer not found" });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

peersRouter.delete("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const result = await db.run('DELETE FROM peers WHERE id = ?', [id]);
        if (result.changes === 0) return res.status(404).json({ error: "Peer not found" });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

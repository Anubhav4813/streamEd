import express from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export const communityRouter = express.Router();

function optionalAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.replace(/^Bearer\s+/i, "");
        if (token) {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        }
    } catch {
    }
    next();
}

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

// GET /api/community
communityRouter.get("/", optionalAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const threads = await db.all('SELECT * FROM community_threads ORDER BY "createdAt" DESC');
        
        // Fetch reply counts for each thread
        const threadsWithReplies = await Promise.all(threads.map(async (t) => {
            const countRow = await db.get('SELECT COUNT(*) as count FROM community_replies WHERE "threadId" = ?', [t.id]);
            return {
                ...t,
                tags: t.tags ? t.tags.split(',').filter(Boolean) : [],
                replyCount: parseInt(countRow.count) || 0
            };
        }));

        res.json(threadsWithReplies);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/community/:id
communityRouter.get("/:id", optionalAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const thread = await db.get('SELECT * FROM community_threads WHERE id = ?', [req.params.id]);
        if (!thread) return res.status(404).json({ error: "Thread not found" });

        const replies = await db.all('SELECT * FROM community_replies WHERE "threadId" = ? ORDER BY "createdAt" ASC', [thread.id]);
        
        res.json({
            ...thread,
            tags: thread.tags ? thread.tags.split(',').filter(Boolean) : [],
            replies
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/community
communityRouter.post("/", requireAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { title, content, tags } = req.body;
        if (!title || !content) return res.status(400).json({ error: "Missing required fields" });

        const id = randomUUID();
        const authorId = String(req.user.id || req.user.sub || 'unknown');
        const authorName = req.user.username || req.user.email || 'Anonymous';
        const tagsString = Array.isArray(tags) ? tags.join(',') : '';

        await db.run(
            'INSERT INTO community_threads (id, title, content, "authorId", "authorName", "createdAt", likes, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, content, authorId, authorName, Date.now(), 0, tagsString]
        );

        res.status(201).json({ id, ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/community/:id/reply
communityRouter.post("/:id/reply", requireAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { content } = req.body;
        const threadId = req.params.id;

        if (!content) return res.status(400).json({ error: "Missing content" });

        const thread = await db.get('SELECT id FROM community_threads WHERE id = ?', [threadId]);
        if (!thread) return res.status(404).json({ error: "Thread not found" });

        const id = randomUUID();
        const authorId = String(req.user.id || req.user.sub || 'unknown');
        const authorName = req.user.username || req.user.email || 'Anonymous';

        await db.run(
            'INSERT INTO community_replies (id, "threadId", content, "authorId", "authorName", "createdAt") VALUES (?, ?, ?, ?, ?, ?)',
            [id, threadId, content, authorId, authorName, Date.now()]
        );

        res.status(201).json({ id, ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/community/:id/like
communityRouter.post("/:id/like", requireAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const threadId = req.params.id;

        const thread = await db.get('SELECT id, likes FROM community_threads WHERE id = ?', [threadId]);
        if (!thread) return res.status(404).json({ error: "Thread not found" });

        await db.run('UPDATE community_threads SET likes = likes + 1 WHERE id = ?', [threadId]);

        res.json({ ok: true, likes: thread.likes + 1 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

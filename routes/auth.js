import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { auth } from "../middleware/auth.js";

export const authRouter = express.Router();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

const registerSchema = z.object({
    username: z.string().min(2).max(40),
    email: z.string().email(),
    password: z.string().min(8),
});

authRouter.post("/register", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

        const { username, email, password } = parsed.data;
        const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) return res.status(409).json({ error: "Email exists " });

        const passwordHash = await bcrypt.hash(password, 12);
        const id = randomUUID();
        
        await db.run(
            'INSERT INTO users (id, username, email, "passwordHash") VALUES (?, ?, ?, ?)',
            [id, username, email, passwordHash]
        );

        // Auto-create a peer profile so they appear in the Find a Peer page
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
        await db.run(
            'INSERT INTO peers (id, name, avatar, major, category, rating, reviews, distance, bio, "strongIn", "needsHelpWith", "isOnline", badges) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                id, 
                username, 
                avatarUrl, 
                'Undeclared', 
                'All', 
                5.0, 
                0, 
                'Just joined', 
                `Hi, I'm ${username}! I just joined StreamEd and I'm looking for study buddies.`, 
                '', 
                '', 
                true, 
                'New Member'
            ]
        );

        return res.status(201).json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

authRouter.post("/login", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

        const { email, password } = parsed.data;
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, sub: user.id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, karma: user.karma, rating: user.rating, bio: user.bio || '' } });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

authRouter.get("/me", auth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const user = await db.get('SELECT id, username, email, role, karma, rating, bio FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ user });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

authRouter.post("/karma", auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const db = req.app.locals.db;
        await db.run('UPDATE users SET karma = karma + ? WHERE id = ?', [amount || 10, req.user.id]);
        const user = await db.get('SELECT karma FROM users WHERE id = ?', [req.user.id]);
        res.json({ karma: user.karma });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

authRouter.post("/rating", auth, async (req, res) => {
    try {
        const { rating } = req.body;
        const db = req.app.locals.db;
        await db.run('UPDATE users SET rating = ? WHERE id = ?', [rating, req.user.id]);
        res.json({ ok: true });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

authRouter.patch("/profile", auth, async (req, res) => {
    try {
        const { bio, username } = req.body;
        const db = req.app.locals.db;
        if (bio !== undefined) {
            await db.run('UPDATE users SET bio = ? WHERE id = ?', [bio, req.user.id]);
            await db.run('UPDATE peers SET bio = ? WHERE id = ?', [bio, req.user.id]);
        }
        if (username !== undefined && username.trim().length >= 2) {
            const cleanName = username.trim();
            await db.run('UPDATE users SET username = ? WHERE id = ?', [cleanName, req.user.id]);
            await db.run('UPDATE peers SET name = ? WHERE id = ?', [cleanName, req.user.id]);
        }
        const user = await db.get('SELECT id, username, email, role, karma, rating, bio FROM users WHERE id = ?', [req.user.id]);
        res.json({ user });
    } catch(e) {
        res.status(500).json({ error: e.message });
    }
});

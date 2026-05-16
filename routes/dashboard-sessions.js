import express from "express";

export const dashboardSessionsRouter = express.Router();

dashboardSessionsRouter.get("/", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const sessions = await db.all('SELECT * FROM dashboard_sessions');
        res.json(sessions);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

dashboardSessionsRouter.post("/", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { title, host, viewers, rating, subject } = req.body;
        await db.run(
            'INSERT INTO dashboard_sessions (title, host, viewers, rating, subject) VALUES (?, ?, ?, ?, ?)',
            [title, host, viewers || 0, rating || 5.0, subject || '']
        );
        res.status(201).json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

dashboardSessionsRouter.put("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const { title, host, viewers, rating, subject } = req.body;
        
        const result = await db.run(
            'UPDATE dashboard_sessions SET title = ?, host = ?, viewers = ?, rating = ?, subject = ? WHERE id = ?',
            [title, host, viewers || 0, rating || 5.0, subject || '', id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

dashboardSessionsRouter.delete("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        
        const result = await db.run('DELETE FROM dashboard_sessions WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Session not found" });
        }
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

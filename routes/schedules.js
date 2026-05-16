import express from "express";

export const schedulesRouter = express.Router();

schedulesRouter.get("/", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const schedules = await db.all('SELECT * FROM schedules');
        const mapped = schedules.map(s => ({
            ...s,
            isStartingSoon: Boolean(s.isStartingSoon)
        }));
        res.json(mapped);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

schedulesRouter.post("/", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { title, type, participant, date, time, duration, subject, status, isStartingSoon, color } = req.body;
        const id = 'e' + Date.now();
        await db.run(
            'INSERT INTO schedules (id, title, type, participant, date, time, duration, subject, status, "isStartingSoon", color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, type, participant, date, time, duration, subject, status || 'Upcoming', isStartingSoon ? true : false, color || 'brand']
        );
        res.status(201).json({ id, ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

schedulesRouter.put("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const { title, type, participant, date, time, duration, subject, status, isStartingSoon, color } = req.body;
        
        const result = await db.run(
            'UPDATE schedules SET title = ?, type = ?, participant = ?, date = ?, time = ?, duration = ?, subject = ?, status = ?, "isStartingSoon" = ?, color = ? WHERE id = ?',
            [title, type, participant, date, time, duration, subject, status, isStartingSoon ? true : false, color, id]
        );
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

schedulesRouter.delete("/:id", async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        
        const result = await db.run('DELETE FROM schedules WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: "Schedule not found" });
        }
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

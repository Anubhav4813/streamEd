import jwt from "jsonwebtoken";

export function auth(req, res, next) {
    const bearer = req.headers.authorization || "";
    const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : null;
    if (!token) {
        // DEV Fallback so frontend can test without logging in
        req.user = { id: "dev-user-123", username: "Alex M.", email: "alex@example.com" };
        return next();
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

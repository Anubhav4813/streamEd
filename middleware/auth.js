import jwt from "jsonwebtoken";

export function auth(req, res, next) {
    const bearer = req.headers.authorization || "";
    const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

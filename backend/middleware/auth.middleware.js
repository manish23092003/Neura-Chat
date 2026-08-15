import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers?.authorization;
        const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        const token = req.cookies?.token || bearerToken;

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No authentication token provided' });
        }

        // Check token blacklist in Redis with fail-safe error handling
        try {
            if (redisClient && typeof redisClient.get === 'function') {
                const isBlackListed = await redisClient.get(token);
                if (isBlackListed) {
                    res.cookie('token', '', { expires: new Date(0) });
                    return res.status(401).json({ error: 'Unauthorized: Token has been revoked' });
                }
            }
        } catch (redisErr) {
            console.warn('[Auth Middleware] Redis blacklist check unavailable, proceeding with JWT verification:', redisErr.message);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.email) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};
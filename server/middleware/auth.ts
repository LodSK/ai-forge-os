import { Request, Response, NextFunction } from "express";
import { authService } from "../services/AuthService";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: "user" | "admin";
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access token is missing. Sign-in required." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid authorization header format. Use 'Bearer <Token>'." });
  }

  const token = parts[1];

  try {
    const decoded = authService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Session has expired. Please log in again." });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Administrator privileges required." });
  }
  next();
}

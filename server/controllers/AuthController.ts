import { Request, Response, NextFunction } from "express";
import { authService } from "../services/AuthService";
import { userRepository } from "../repositories/UserRepository";
import { auditLogRepository } from "../repositories/AuditLogRepository";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ error: "Please provide email, password, first name, and last name." });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long." });
      }

      const result = await authService.register(email, password, firstName, lastName, role);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Registration failed." });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Please provide both email and password." });
      }

      const result = await authService.login(email, password);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Login failed." });
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required." });
      }

      const result = await authService.refreshToken(refreshToken);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || "Refresh token invalid." });
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userPayload = (req as any).user;
      if (!userPayload) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const user = await userRepository.findById(userPayload.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const { passwordHash: _, ...userSafe } = user;
      res.status(200).json({ user: userSafe });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to retrieve user session." });
    }
  }

  async myLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userPayload = (req as any).user;
      if (!userPayload) {
        return res.status(401).json({ error: "Unauthorized access." });
      }

      const logs = await auditLogRepository.findAll();
      const filtered = logs.filter((log) => log.userId === userPayload.userId);
      res.status(200).json({ logs: filtered });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to retrieve user activity logs." });
    }
  }
}

export const authController = new AuthController();

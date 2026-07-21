import { Request, Response, NextFunction } from "express";
import { userRepository } from "../repositories/UserRepository";
import { projectRepository } from "../repositories/ProjectRepository";
import { auditLogRepository } from "../repositories/AuditLogRepository";

export class AdminController {
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Administrator privileges required." });
      }

      const totalUsers = await userRepository.count();
      const totalProjects = await projectRepository.count();
      const totalLaunches = await projectRepository.count((p) => p.status === "launched");
      const recentLogs = await auditLogRepository.getRecent(15);

      // Aggregate categories
      const projects = await projectRepository.findAll();
      const categoriesCount: Record<string, number> = {};
      projects.forEach((p) => {
        categoriesCount[p.category] = (categoriesCount[p.category] || 0) + 1;
      });

      res.status(200).json({
        totalUsers,
        totalProjects,
        totalLaunches,
        recentAuditLogs: recentLogs,
        categoriesDistribution: categoriesCount,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate system metrics." });
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Administrator privileges required." });
      }

      const users = await userRepository.findAll();
      const safeUsers = users.map(({ passwordHash, ...safe }) => safe);
      res.status(200).json(safeUsers);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load user directory." });
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = (req as any).user;
      if (requester.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Administrator privileges required." });
      }

      const { id } = req.params;
      if (id === requester.userId) {
        return res.status(400).json({ error: "You cannot delete your own administrator account." });
      }

      const deleted = await userRepository.delete(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found." });
      }

      // Log action
      await auditLogRepository.create(requester.userId, requester.email, "admin_user_delete", `Deleted user ID "${id}"`);

      res.status(200).json({ success: true, message: "User account deleted successfully." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete user account." });
    }
  }
}

export const adminController = new AdminController();

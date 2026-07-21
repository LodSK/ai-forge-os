import { db } from "../db/db";
import { AuditLog } from "../../src/types";

const auditColl = db.getCollection<AuditLog>("audit_logs");

export class AuditLogRepository {
  async create(userId: string, userEmail: string, action: string, details: string): Promise<AuditLog> {
    return auditColl.insertOne({
      userId,
      userEmail,
      action,
      details,
    });
  }

  async findAll(): Promise<AuditLog[]> {
    const logs = await auditColl.find();
    // Sort newest first
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getRecent(limit = 20): Promise<AuditLog[]> {
    const all = await this.findAll();
    return all.slice(0, limit);
  }
}

export const auditLogRepository = new AuditLogRepository();

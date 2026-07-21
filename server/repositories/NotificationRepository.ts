import { db } from "../db/db";
import { Notification } from "../../src/types";

const notifsColl = db.getCollection<Notification>("notifications");

export class NotificationRepository {
  async findByUserId(userId: string): Promise<Notification[]> {
    // Sort notifications with newest first
    const items = await notifsColl.find((n) => n.userId === userId);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(userId: string, title: string, description: string, type: Notification["type"]): Promise<Notification> {
    return notifsColl.insertOne({
      userId,
      title,
      description,
      type,
      read: false,
    });
  }

  async markAsRead(id: string): Promise<Notification | null> {
    return notifsColl.updateOne(id, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const unread = await notifsColl.find((n) => n.userId === userId && !n.read);
    for (const notif of unread) {
      await notifsColl.updateOne(notif.id, { read: true });
    }
  }

  async delete(id: string): Promise<boolean> {
    return notifsColl.deleteOne(id);
  }
}

export const notificationRepository = new NotificationRepository();

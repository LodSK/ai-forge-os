import { db } from "../db/db";
import { User } from "../../src/types";

const usersColl = db.getCollection<User>("users");

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const emailLower = email.toLowerCase().trim();
    return usersColl.findOne((user) => user.email.toLowerCase() === emailLower);
  }

  async findById(id: string): Promise<User | null> {
    return usersColl.findById(id);
  }

  async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const emailLower = user.email.toLowerCase().trim();
    return usersColl.insertOne({
      ...user,
      email: emailLower,
    });
  }

  async update(id: string, update: Partial<Omit<User, "id" | "createdAt" | "passwordHash">>): Promise<User | null> {
    return usersColl.updateOne(id, update);
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<User | null> {
    return usersColl.updateOne(id, { passwordHash });
  }

  async delete(id: string): Promise<boolean> {
    return usersColl.deleteOne(id);
  }

  async findAll(): Promise<User[]> {
    return usersColl.find();
  }

  async count(filter?: (user: User) => boolean): Promise<number> {
    return usersColl.count(filter);
  }
}

export const userRepository = new UserRepository();

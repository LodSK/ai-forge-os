import { db } from "../db/db";
import { Project } from "../../src/types";

const projectsColl = db.getCollection<Project>("projects");

export class ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    return projectsColl.findById(id);
  }

  async findByUserId(userId: string): Promise<Project[]> {
    return projectsColl.find((proj) => proj.userId === userId);
  }

  async create(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> {
    return projectsColl.insertOne(project);
  }

  async update(id: string, update: Partial<Omit<Project, "id" | "createdAt" | "userId">>): Promise<Project | null> {
    return projectsColl.updateOne(id, update);
  }

  async delete(id: string): Promise<boolean> {
    return projectsColl.deleteOne(id);
  }

  async findAll(): Promise<Project[]> {
    return projectsColl.find();
  }

  async count(filter?: (proj: Project) => boolean): Promise<number> {
    return projectsColl.count(filter);
  }

  async incrementViews(id: string): Promise<Project | null> {
    const project = await this.findById(id);
    if (!project) return null;
    return projectsColl.updateOne(id, { views: (project.views || 0) + 1 });
  }

  async search(query: string): Promise<Project[]> {
    const q = query.toLowerCase();
    return projectsColl.find(
      (proj) =>
        proj.name.toLowerCase().includes(q) ||
        proj.description.toLowerCase().includes(q) ||
        proj.category.toLowerCase().includes(q)
    );
  }
}

export const projectRepository = new ProjectRepository();

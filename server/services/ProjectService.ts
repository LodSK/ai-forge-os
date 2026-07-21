import { projectRepository } from "../repositories/ProjectRepository";
import { geminiService } from "./GeminiService";
import { auditLogRepository } from "../repositories/AuditLogRepository";
import { notificationRepository } from "../repositories/NotificationRepository";
import { Project, ChecklistItem } from "../../src/types";

export class ProjectService {
  async createProject(
    userId: string,
    userEmail: string,
    name: string,
    description: string,
    category: string,
    targetLaunchDate: string
  ): Promise<Project> {
    // Generate AI recommendations, checklist and roadmap
    const aiStrategy = await geminiService.generateLaunchStrategy(name, description, category);

    const project = await projectRepository.create({
      userId,
      name,
      description,
      category,
      targetLaunchDate,
      status: "building",
      checklist: aiStrategy.checklist,
      roadmap: aiStrategy.roadmap,
      fileUrls: [],
      views: 0,
      signups: 0,
      score: aiStrategy.score,
      aiSuggestions: aiStrategy.aiSuggestions,
    });

    // Audit Log & Notification
    await auditLogRepository.create(userId, userEmail, "project_create", `Created project "${name}"`);
    await notificationRepository.create(
      userId,
      `Project "${name}" Initialized!`,
      "Your AI-powered launch strategy, complete checklist, and technical roadmap have been generated.",
      "success"
    );

    return project;
  }

  async getProjectById(id: string, requesterUserId?: string, requesterEmail?: string): Promise<Project | null> {
    const project = await projectRepository.findById(id);
    if (!project) return null;

    // Increment view count if viewed by another person or as simulated public traffic
    if (requesterUserId !== project.userId) {
      await projectRepository.incrementViews(id);
    }

    return projectRepository.findById(id);
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return projectRepository.findByUserId(userId);
  }

  async updateChecklistItem(
    userId: string,
    userEmail: string,
    projectId: string,
    itemId: string,
    completed: boolean
  ): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized to access this project");

    const updatedChecklist = project.checklist.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    // Re-calculate readiness score dynamically.
    // Base score is what Gemini gave, then we scale the remaining distance based on completed items percentage
    const completedCount = updatedChecklist.filter((c) => c.completed).length;
    const totalCount = updatedChecklist.length;
    const completionPercentage = totalCount > 0 ? completedCount / totalCount : 0;

    // Score can go from the AI baseline (e.g. 45) to 100 based on completion
    const baselineScore = 45;
    const score = Math.min(100, Math.round(baselineScore + (100 - baselineScore) * completionPercentage));

    const updatedProject = await projectRepository.update(projectId, {
      checklist: updatedChecklist,
      score,
    });

    if (!updatedProject) throw new Error("Failed to update project item");

    // Logging & Notification
    const task = project.checklist.find((i) => i.id === itemId);
    if (task) {
      const actionText = completed ? "completed" : "uncompleted";
      await auditLogRepository.create(
        userId,
        userEmail,
        "task_update",
        `Marked task "${task.title}" as ${actionText} in "${project.name}"`
      );

      // Send milestone notification if 50% or 100% completed
      if (completedCount === totalCount && completed) {
        await notificationRepository.create(
          userId,
          "🎉 100% Launch Readiness Reached!",
          `Congratulations! All tasks in "${project.name}" are marked complete. You are ready to launch!`,
          "success"
        );
      } else if (completedCount === Math.floor(totalCount / 2) && completed) {
        await notificationRepository.create(
          userId,
          "Halfway Launch Milestone!",
          `You've completed 50% of your launch launchpad tasks for "${project.name}". Keep it up!`,
          "info"
        );
      }
    }

    return updatedProject;
  }

  async launchProject(userId: string, userEmail: string, projectId: string): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized to access this project");

    const updatedProject = await projectRepository.update(projectId, {
      status: "launched",
      // Set some initial views/signups to simulate launch-day excitement
      views: project.views + Math.floor(Math.random() * 250) + 120,
      signups: project.signups + Math.floor(Math.random() * 45) + 15,
    });

    if (!updatedProject) throw new Error("Failed to launch project");

    await auditLogRepository.create(userId, userEmail, "project_launch", `Launched project "${project.name}" to the public`);
    await notificationRepository.create(
      userId,
      `🚀 "${project.name}" is LIVE!`,
      "Your project status is updated to Launched. Traffic simulation has begun! View your live analytics dashboard.",
      "success"
    );

    return updatedProject;
  }

  async uploadFile(userId: string, projectId: string, fileUrl: string): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized");

    const fileUrls = [...(project.fileUrls || []), fileUrl];
    const updated = await projectRepository.update(projectId, { fileUrls });
    if (!updated) throw new Error("Update failed");
    return updated;
  }

  async deleteProject(userId: string, userEmail: string, projectId: string): Promise<boolean> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized");

    const deleted = await projectRepository.delete(projectId);
    if (deleted) {
      await auditLogRepository.create(userId, userEmail, "project_delete", `Deleted project "${project.name}"`);
    }
    return deleted;
  }

  async saveProjectBlueprint(
    userId: string,
    userEmail: string,
    projectId: string,
    blueprint: any
  ): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized");

    const updated = await projectRepository.update(projectId, { blueprint });
    if (!updated) throw new Error("Failed to save blueprint");

    await auditLogRepository.create(
      userId,
      userEmail,
      "project_blueprint_generate",
      `Generated and saved Forge Brain blueprint for "${project.name}"`
    );

    await notificationRepository.create(
      userId,
      `Forge Brain Blueprint Saved!`,
      `A new intelligent architectural blueprint has been compiled and saved for "${project.name}".`,
      "success"
    );

    return updated;
  }

  async saveProjectWorkspace(
    userId: string,
    userEmail: string,
    projectId: string,
    workspace: any
  ): Promise<Project> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized");

    const updated = await projectRepository.update(projectId, { workspace });
    if (!updated) throw new Error("Failed to save workspace state");

    return updated;
  }
}

export const projectService = new ProjectService();

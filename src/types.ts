// Global TypeScript Types for DevLaunch AI

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: "tech" | "marketing" | "legal" | "operations" | "general";
  completed: boolean;
  completedAt?: string;
}

export interface RoadmapPhase {
  id: string;
  title: string; // e.g., "Pre-Launch Prep", "Beta Release", "V1.0 Public Launch"
  description: string;
  status: "pending" | "current" | "completed";
  items: string[]; // List of task titles
}

export interface ProjectAnalytics {
  views: number;
  signups: number;
  conversionRate: number; // calculated
  dailyViews: { date: string; count: number }[];
  dailySignups: { date: string; count: number }[];
}

export interface ForgeBlueprint {
  executiveSummary: string;
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    authentication: string;
    aiProvider: string;
    cloudHosting: string;
    devops: string;
    testingFramework: string;
    deployment: string;
  };
  featureRoadmap: {
    mvp: string[];
    v2: string[];
    future: string[];
  };
  databaseDesign: {
    entities: {
      name: string;
      fields: string[];
      relationships: string[];
    }[];
  };
  restApiPlan: {
    method: string;
    endpoint: string;
    description: string;
  }[];
  folderStructure: string;
  sprintPlan: {
    name: string;
    duration: string;
    objectives: string[];
  }[];
  uiSuggestions: string[];
  riskAnalysis: {
    technical: string;
    security: string;
    performance: string;
    scalability: string;
    complexity: string;
  };
  deploymentStrategy: {
    hosting: string;
    cicd: string;
    envVars: string[];
    monitoring: string;
    logging: string;
    backup: string;
  };
  inputParams?: {
    industry?: string;
    targetAudience?: string;
    platform?: string;
    preferredTechStack?: string;
    timeline?: string;
    budget?: string;
    teamSize?: string;
    aiLevel?: string;
  };
}

export interface WorkspaceState {
  workspaceHistory?: { action: string; timestamp: string }[];
  aiConversations?: { role: "user" | "assistant"; content: string; timestamp: string }[];
  recentActions?: { title: string; desc: string; type: string; timestamp: string }[];
  openFiles?: string[];
  activeFile?: string;
  currentSprint?: string;
  taskStatuses?: Record<string, "Todo" | "In Progress" | "Blocked" | "Complete">;
  codeFiles?: Record<string, string>; // Mapping of filepath to content
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  targetLaunchDate: string;
  status: "draft" | "building" | "launched";
  checklist: ChecklistItem[];
  roadmap: RoadmapPhase[];
  fileUrls: string[]; // Mock or real uploaded files
  views: number;
  signups: number;
  score: number; // DevLaunch AI readiness score out of 100
  aiSuggestions: string[]; // Generated AI growth hacks
  blueprint?: ForgeBlueprint; // Forge Brain blueprint
  workspace?: WorkspaceState; // AI Workspace persistent memory
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemMetrics {
  totalUsers: number;
  totalProjects: number;
  totalLaunches: number;
  aiGenerationsCount: number;
  recentAuditLogs: AuditLog[];
}

import { Router, Request, Response } from "express";
import { authController } from "../controllers/AuthController";
import { projectController } from "../controllers/ProjectController";
import { adminController } from "../controllers/AdminController";
import { authenticateJWT, requireAdmin } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// ----------------------------------------------------
// PUBLIC API STATUS
// ----------------------------------------------------
router.get("/status", (req: Request, res: Response) => {
  res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    service: "DevLaunch AI API Engine",
    version: "1.0.0",
    docs: "/api/docs",
  });
});

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/refresh", authController.refresh);
router.get("/auth/me", authenticateJWT as any, authController.me as any);
router.get("/auth/me/logs", authenticateJWT as any, authController.myLogs as any);

// ----------------------------------------------------
// PROJECTS & LAUNCHPAD API
// ----------------------------------------------------
router.post("/projects", authenticateJWT as any, projectController.create as any);
router.get("/projects", authenticateJWT as any, projectController.list as any);
router.get("/projects/:id", authenticateJWT as any, projectController.getDetails as any);
router.put("/projects/:projectId/items/:itemId", authenticateJWT as any, projectController.updateItem as any);
router.post("/projects/:id/launch", authenticateJWT as any, projectController.launch as any);
router.put("/projects/:id/blueprint", authenticateJWT as any, projectController.saveBlueprint as any);
router.post("/projects/:id/generate-blueprint", authenticateJWT as any, projectController.generateBlueprint as any);
router.put("/projects/:id/workspace", authenticateJWT as any, projectController.saveWorkspace as any);
router.post("/projects/:id/workspace-chat", authenticateJWT as any, projectController.workspaceChat as any);
router.delete("/projects/:id", authenticateJWT as any, projectController.delete as any);
router.post(
  "/projects/:id/upload",
  authenticateJWT as any,
  upload.single("file"),
  projectController.uploadFile as any
);
router.get("/projects/:id/analytics", authenticateJWT as any, projectController.getAnalytics as any);

// ----------------------------------------------------
// NOTIFICATIONS API
// ----------------------------------------------------
router.get("/notifications", authenticateJWT as any, projectController.getNotifications as any);
router.post("/notifications/read", authenticateJWT as any, projectController.markNotificationsRead as any);

// ----------------------------------------------------
// ADMIN OPERATIONS API
// ----------------------------------------------------
router.get("/admin/metrics", authenticateJWT as any, requireAdmin as any, adminController.getMetrics as any);
router.get("/admin/users", authenticateJWT as any, requireAdmin as any, adminController.listUsers as any);
router.delete("/admin/users/:id", authenticateJWT as any, requireAdmin as any, adminController.deleteUser as any);

// ----------------------------------------------------
// SWAGGER / OPENAPI 3.0 SYSTEM DOCUMENTATION
// ----------------------------------------------------
router.get("/docs", (req: Request, res: Response) => {
  res.status(200).json({
    openapi: "3.0.0",
    info: {
      title: "DevLaunch AI SaaS Backend API",
      description: "High-performance API endpoints for launch automation, readiness tracking, and AI startup suggestions.",
      version: "1.0.0",
    },
    servers: [
      {
        url: "/api",
        description: "Local development gateway",
      },
    ],
    paths: {
      "/auth/register": {
        post: {
          summary: "Create a new user account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    role: { type: "string", enum: ["user", "admin"] },
                  },
                  required: ["email", "password", "firstName", "lastName"],
                },
              },
            },
          },
          responses: {
            "201": { description: "User registered successfully with Auth tokens" },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "Sign into user profile",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    email: { type: "string" },
                    password: { type: "string" },
                  },
                  required: ["email", "password"],
                },
              },
            },
          },
          responses: {
            "200": { description: "Session authorized. Bearer tokens returned." },
          },
        },
      },
      "/projects": {
        get: {
          summary: "List user projects",
          security: [{ BearerAuth: [] }],
          responses: {
            "200": { description: "Array of projects user is building" },
          },
        },
        post: {
          summary: "Create a project launchpad and generate AI checklist",
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    targetLaunchDate: { type: "string", format: "date" },
                  },
                  required: ["name", "description", "category", "targetLaunchDate"],
                },
              },
            },
          },
          responses: {
            "201": { description: "Project with checklists generated successfully" },
          },
        },
      },
      "/projects/{id}/launch": {
        post: {
          summary: "Mark project state as launched & activate simulated analytics funnel",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Project launched status updated" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  });
});

export default router;

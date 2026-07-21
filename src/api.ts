// React API Wrapper Service for DevLaunch AI SaaS

const API_BASE = "/api";

export class ApiService {
  private static getHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  static async request(path: string, options: RequestInit, token?: string): Promise<any> {
    const url = `${API_BASE}${path}`;
    const headers = { ...this.getHeaders(token), ...options.headers };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errorMsg = errJson.error || `HTTP request failed with status ${response.status}`;
      
      if (
        response.status === 401 ||
        errorMsg.includes("Session has expired") ||
        errorMsg.includes("Sign-in required") ||
        errorMsg.includes("Access token is missing")
      ) {
        window.dispatchEvent(new CustomEvent("unauthorized-session", { detail: { error: errorMsg } }));
      }
      
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // Auth
  static async register(payload: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async login(payload: any) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  static async me(token: string) {
    return this.request("/auth/me", { method: "GET" }, token);
  }

  static async getMyLogs(token: string) {
    return this.request("/auth/me/logs", { method: "GET" }, token);
  }

  // Projects
  static async listProjects(token: string) {
    return this.request("/projects", { method: "GET" }, token);
  }

  static async createProject(payload: any, token: string) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token);
  }

  static async getProjectDetails(id: string, token: string) {
    return this.request(`/projects/${id}`, { method: "GET" }, token);
  }

  static async updateChecklistItem(projectId: string, itemId: string, completed: boolean, token: string) {
    return this.request(`/projects/${projectId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ completed }),
    }, token);
  }

  static async launchProject(id: string, token: string) {
    return this.request(`/projects/${id}/launch`, { method: "POST" }, token);
  }

  static async deleteProject(id: string, token: string) {
    return this.request(`/projects/${id}`, { method: "DELETE" }, token);
  }

  static async saveBlueprint(projectId: string, blueprint: any, token: string) {
    return this.request(`/projects/${projectId}/blueprint`, {
      method: "PUT",
      body: JSON.stringify({ blueprint }),
    }, token);
  }

  static async generateBlueprint(projectId: string, params: any, token: string) {
    return this.request(`/projects/${projectId}/generate-blueprint`, {
      method: "POST",
      body: JSON.stringify({ params }),
    }, token);
  }

  static async getProjectAnalytics(id: string, token: string) {
    return this.request(`/projects/${id}/analytics`, { method: "GET" }, token);
  }

  // File Upload (uses MultiPart instead of JSON headers)
  static async uploadFile(projectId: string, file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/projects/${projectId}/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || "File upload failed.");
    }

    return response.json();
  }

  // Notifications
  static async listNotifications(token: string) {
    return this.request("/notifications", { method: "GET" }, token);
  }

  static async markNotificationsRead(token: string) {
    return this.request("/notifications/read", { method: "POST" }, token);
  }

  // Admin
  static async getAdminMetrics(token: string) {
    return this.request("/admin/metrics", { method: "GET" }, token);
  }

  static async listUsers(token: string) {
    return this.request("/admin/users", { method: "GET" }, token);
  }

  static async deleteUser(id: string, token: string) {
    return this.request(`/admin/users/${id}`, { method: "DELETE" }, token);
  }

  // Workspace
  static async saveWorkspace(projectId: string, workspace: any, token: string) {
    return this.request(`/projects/${projectId}/workspace`, {
      method: "PUT",
      body: JSON.stringify({ workspace }),
    }, token);
  }

  static async workspaceChat(projectId: string, payload: { message: string; history: any[]; quickAction?: string }, token: string) {
    return this.request(`/projects/${projectId}/workspace-chat`, {
      method: "POST",
      body: JSON.stringify(payload),
    }, token);
  }
}

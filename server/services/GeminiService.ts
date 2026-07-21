import { GoogleGenAI, Type } from "@google/genai";
import { ChecklistItem, RoadmapPhase } from "../../src/types";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY environment variable is not configured. Falling back to dynamic rule generator.");
    return null;
  }
  try {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    return aiInstance;
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
    return null;
  }
}

export class GeminiService {
  async generateLaunchStrategy(
    name: string,
    description: string,
    category: string
  ): Promise<{
    checklist: ChecklistItem[];
    roadmap: RoadmapPhase[];
    score: number;
    aiSuggestions: string[];
  }> {
    const ai = getAI();

    if (!ai) {
      // Fallback generator when Gemini key is not loaded or in case of initial sandbox start
      return this.generateDeterministicFallback(name, description, category);
    }

    try {
      const prompt = `You are the lead architect and startup growth hacker of "DevLaunch AI".
Analyze this project:
- Name: "${name}"
- Description: "${description}"
- Category: "${category}"

Provide a comprehensive, highly customized launch strategy.
You must return your output exactly matching the following JSON schema:
{
  "score": number (an integer between 35 and 65 representing current launch readiness score, depending on description completeness),
  "checklist": [
    {
      "title": string,
      "description": string,
      "category": "tech" | "marketing" | "legal" | "operations" | "general"
    }
  ] (exactly 8 high-quality items),
  "roadmap": [
    {
      "title": string,
      "description": string,
      "status": "pending" | "current" | "completed",
      "items": [string] (at least 3 items per phase)
    }
  ] (exactly 3 phases: Pre-Launch, Launch Week, Post-Launch Expansion),
  "aiSuggestions": [string] (exactly 4 specific, actionable marketing or technical growth hacks for this specific product)
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: "Launch readiness score between 35 and 65" },
              checklist: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                  },
                  required: ["title", "description", "category"],
                },
              },
              roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    status: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["title", "description", "status", "items"],
                },
              },
              aiSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["score", "checklist", "roadmap", "aiSuggestions"],
          },
        },
      });

      const responseText = response.text?.trim() || "";
      const result = JSON.parse(responseText);

      // Add unique IDs to the checklist items
      const checklist: ChecklistItem[] = (result.checklist || []).map((item: any) => ({
        id: "task_" + Math.random().toString(36).substring(2, 9),
        title: item.title,
        description: item.description,
        category: ["tech", "marketing", "legal", "operations", "general"].includes(item.category)
          ? item.category
          : "general",
        completed: false,
      }));

      // Map roadmap phases
      const roadmap: RoadmapPhase[] = (result.roadmap || []).map((phase: any, index: number) => ({
        id: "phase_" + index,
        title: phase.title,
        description: phase.description,
        status: index === 0 ? "current" : "pending",
        items: phase.items || [],
      }));

      return {
        checklist,
        roadmap,
        score: typeof result.score === "number" ? result.score : 45,
        aiSuggestions: result.aiSuggestions || [],
      };
    } catch (e) {
      console.error("Failed to generate launch strategy via Gemini. Falling back to deterministic output.", e);
      return this.generateDeterministicFallback(name, description, category);
    }
  }

  private generateDeterministicFallback(
    name: string,
    description: string,
    category: string
  ): {
    checklist: ChecklistItem[];
    roadmap: RoadmapPhase[];
    score: number;
    aiSuggestions: string[];
  } {
    // Elegant heuristic fallback based on project characteristics
    const score = Math.floor(Math.random() * 20) + 40; // between 40 and 60

    const categoryLower = category.toLowerCase();

    // Default high-quality tailored tasks
    const tasks: Omit<ChecklistItem, "id" | "completed">[] = [
      {
        title: "Define Core Value Proposition & Pitch",
        description: "Draft a clear, compelling one-sentence explanation of how your product solves user pain points.",
        category: "general",
      },
      {
        title: "Build Landing Page & Lead Capture",
        description: "Set up a clean responsive landing page with an email subscription form to build an initial waitlist.",
        category: "marketing",
      },
      {
        title: "Configure Database & Storage Backups",
        description: `Ensure secure and highly available database configurations suitable for ${name}.`,
        category: "tech",
      },
      {
        title: "Set Up Secure JWT & Refresh Authentication",
        description: "Implement robust security practices to handle sign-in, signup, and session renewals safely.",
        category: "tech",
      },
      {
        title: "Draft Privacy Policy & Terms of Service",
        description: "Ensure legal compliance by explaining to users how data is processed, used, and stored.",
        category: "legal",
      },
      {
        title: "Integrate Analytical Trackers",
        description: "Set up dashboard telemetry, view tracking, and conversion analytics to monitor user interaction.",
        category: "operations",
      },
      {
        title: "Establish Product Hunt & Social Teasers",
        description: "Create teaser media, graphics, and schedules for online communities to drum up initial interest.",
        category: "marketing",
      },
      {
        title: "Conduct End-to-End Penetration Test",
        description: "Run vulnerability scans and manual checks against auth boundaries to block exploitation.",
        category: "tech",
      },
    ];

    const checklist: ChecklistItem[] = tasks.map((t) => ({
      ...t,
      id: "task_" + Math.random().toString(36).substring(2, 9),
      completed: false,
    }));

    const roadmap: RoadmapPhase[] = [
      {
        id: "phase_0",
        title: "Pre-Launch Foundation",
        description: "Establish product architecture, legal structures, and initial marketing landing pages.",
        status: "current",
        items: [
          "Complete core security audit and JWT mechanisms",
          "Publish visual landing page & configure mailing list",
          "Conduct focus group testing of primary user interface",
        ],
      },
      {
        id: "phase_1",
        title: "Private Beta Launch",
        description: "Deploy MVP to initial waitlisted group and aggregate feedback on performance and features.",
        status: "pending",
        items: [
          "Invite first 100 developers to explore the dashboard",
          "Track analytics and check conversion funnel metrics",
          "Implement high-priority bug fixes and usability tweaks",
        ],
      },
      {
        id: "phase_2",
        title: "General Public Release",
        description: "Launch public facing platform with aggressive community marketing and social engagement.",
        status: "pending",
        items: [
          "Submit platform to Product Hunt, Hacker News, and IndieHackers",
          "Deploy server scaling optimizations to handle traffic surges",
          "Initiate user-retention email campaign",
        ],
      },
    ];

    // Customized growth suggestions based on category
    let aiSuggestions: string[] = [];
    if (categoryLower.includes("tech") || categoryLower.includes("saas")) {
      aiSuggestions = [
        "Create an open-source utility or repository on GitHub relevant to this domain to drive developer traffic.",
        "Write detailed technical blog posts detailing the architecture decisions and share on Dev.to / Medium.",
        "Offer a generous 'free tier' for indie hackers to build initial traction and create viral branding in footers.",
        "Configure automated Twitter/X notification bots showing real-time platform metrics and milestones.",
      ];
    } else if (categoryLower.includes("marketing") || categoryLower.includes("social")) {
      aiSuggestions = [
        "Launch an interactive free mini-tool on your site (e.g., 'Launch Ready Estimator') to capture warm leads.",
        "Partner with micro-influencers in the entrepreneur space for video walk-throughs and reviews.",
        "Create high-energy short-form video teasers on TikTok/YouTube Shorts outlining launch milestones.",
        "Design a 2-tier referral reward campaign, providing early-access perks to users who share with 3 friends.",
      ];
    } else {
      aiSuggestions = [
        "Publish highly-detailed case-studies illustrating how the product saves developers 10+ hours.",
        "Initiate a targeted direct-outreach campaign on LinkedIn to managers encountering this specific pain point.",
        "Host a live launch day Q&A on Twitter Spaces or Discord to demonstrate core features and interact.",
        "Create a curated directory of resources in your niche to establish organic SEO dominance.",
      ];
    }

    return {
      checklist,
      roadmap,
      score,
      aiSuggestions,
    };
  }

  async generateBlueprint(
    name: string,
    description: string,
    params: {
      industry?: string;
      targetAudience?: string;
      platform?: string;
      preferredTechStack?: string;
      timeline?: string;
      budget?: string;
      teamSize?: string;
      aiLevel?: string;
    }
  ): Promise<any> {
    const ai = getAI();

    const industry = params.industry || "General Software";
    const targetAudience = params.targetAudience || "General Public";
    const platform = params.platform || "Web";
    const preferredTechStack = params.preferredTechStack || "React, TypeScript, Node.js";
    const timeline = params.timeline || "3 Months";
    const budget = params.budget || "$50k";
    const teamSize = params.teamSize || "3 Developers";
    const aiLevel = params.aiLevel || "Medium";

    if (!ai) {
      return this.generateBlueprintFallback(name, description, params);
    }

    try {
      const prompt = `You are a legendary Principal Solutions Architect, CTO, and systems designer.
Analyze these project specifications:
- Name: "${name}"
- Description: "${description}"
- Industry: "${industry}"
- Target Audience: "${targetAudience}"
- Platform: "${platform}"
- Preferred Tech Stack: "${preferredTechStack}"
- Timeline: "${timeline}"
- Budget: "${budget}"
- Team Size: "${teamSize}"
- AI Assistance Level: "${aiLevel}"

Generate a complete, professional, and detailed software architecture blueprint.
You MUST return the output matching the requested schema. Provide deep, specific technical suggestions tailored to this project rather than generic placeholders.
In folderStructure, provide a multi-line directory tree.
Under sprintPlan, generate exactly 5 sprints (Sprint 1 to Sprint 5) with objective and timeline.
Under databaseDesign, define standard tables such as Users, Teams, and specialized tables for "${name}".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              techStack: {
                type: Type.OBJECT,
                properties: {
                  frontend: { type: Type.STRING },
                  backend: { type: Type.STRING },
                  database: { type: Type.STRING },
                  authentication: { type: Type.STRING },
                  aiProvider: { type: Type.STRING },
                  cloudHosting: { type: Type.STRING },
                  devops: { type: Type.STRING },
                  testingFramework: { type: Type.STRING },
                  deployment: { type: Type.STRING },
                },
                required: ["frontend", "backend", "database", "authentication", "aiProvider", "cloudHosting", "devops", "testingFramework", "deployment"],
              },
              featureRoadmap: {
                type: Type.OBJECT,
                properties: {
                  mvp: { type: Type.ARRAY, items: { type: Type.STRING } },
                  v2: { type: Type.ARRAY, items: { type: Type.STRING } },
                  future: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["mvp", "v2", "future"],
              },
              databaseDesign: {
                type: Type.OBJECT,
                properties: {
                  entities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        fields: { type: Type.ARRAY, items: { type: Type.STRING } },
                        relationships: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ["name", "fields", "relationships"],
                    },
                  },
                },
                required: ["entities"],
              },
              restApiPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    method: { type: Type.STRING },
                    endpoint: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["method", "endpoint", "description"],
                },
              },
              folderStructure: { type: Type.STRING },
              sprintPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["name", "duration", "objectives"],
                },
              },
              uiSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              riskAnalysis: {
                type: Type.OBJECT,
                properties: {
                  technical: { type: Type.STRING },
                  security: { type: Type.STRING },
                  performance: { type: Type.STRING },
                  scalability: { type: Type.STRING },
                  complexity: { type: Type.STRING },
                },
                required: ["technical", "security", "performance", "scalability", "complexity"],
              },
              deploymentStrategy: {
                type: Type.OBJECT,
                properties: {
                  hosting: { type: Type.STRING },
                  cicd: { type: Type.STRING },
                  envVars: { type: Type.ARRAY, items: { type: Type.STRING } },
                  monitoring: { type: Type.STRING },
                  logging: { type: Type.STRING },
                  backup: { type: Type.STRING },
                },
                required: ["hosting", "cicd", "envVars", "monitoring", "logging", "backup"],
              },
            },
            required: [
              "executiveSummary",
              "techStack",
              "featureRoadmap",
              "databaseDesign",
              "restApiPlan",
              "folderStructure",
              "sprintPlan",
              "uiSuggestions",
              "riskAnalysis",
              "deploymentStrategy",
            ],
          },
        },
      });

      const responseText = response.text?.trim() || "";
      const result = JSON.parse(responseText);
      return {
        ...result,
        inputParams: params,
      };
    } catch (e) {
      console.error("Gemini blueprint generation failed. Falling back to deterministic mockup.", e);
      return this.generateBlueprintFallback(name, description, params);
    }
  }

  generateBlueprintFallback(
    name: string,
    description: string,
    params: {
      industry?: string;
      targetAudience?: string;
      platform?: string;
      preferredTechStack?: string;
      timeline?: string;
      budget?: string;
      teamSize?: string;
      aiLevel?: string;
    }
  ): any {
    const industry = params.industry || "General Software";
    const targetAudience = params.targetAudience || "General Public";
    const platform = params.platform || "Web";
    const preferredTechStack = params.preferredTechStack || "React, TypeScript, Node.js";
    const timeline = params.timeline || "3 Months";
    const budget = params.budget || "$50k";
    const teamSize = params.teamSize || "3 Developers";
    const aiLevel = params.aiLevel || "Medium";

    // Tech stack customization heuristics
    const isMobile = platform.toLowerCase().includes("mobile");
    const isDesktop = platform.toLowerCase().includes("desktop");
    const isSaaS = platform.toLowerCase().includes("saas");
    const isAPI = platform.toLowerCase().includes("api");

    const frontendTech = isMobile ? "React Native / Expo (TypeScript) & Tailwind CSS" : isDesktop ? "Electron & React / TypeScript with Tailwind CSS" : isAPI ? "Not applicable (Headless API service)" : "React 19, Vite, Tailwind CSS, & Radix UI";
    const backendTech = isAPI ? "Fastify & Node.js (TypeScript) with Swagger" : "Express.js / Node.js with TypeScript & tsx executor";
    const dbTech = preferredTechStack.toLowerCase().includes("mongo") ? "MongoDB Atlas (NoSQL Document Store)" : preferredTechStack.toLowerCase().includes("postgre") || preferredTechStack.toLowerCase().includes("sql") ? "PostgreSQL (Cloud SQL with Drizzle ORM)" : "PostgreSQL hosted on Supabase DB with Knex/Drizzle";
    const authTech = "JWT (JsonWebToken) with HTTP-only Cookies and Cryptographical Salt";
    const aiProviderTech = aiLevel === "None" ? "No direct AI integrations" : "Google Gemini 3.5 Flash via @google/genai Node SDK";
    const hostingTech = isAPI ? "Google Cloud Run container orchestration" : "Google Cloud Run / Vercel (Front-end static assets)";
    const devopsTech = "GitHub Actions CI/CD with Docker Container Registry";
    const testingTech = "Jest & Supertest for Unit/Integration, Playwright for E2E";
    const deploymentTech = "Automated blue-green deployments via Google Cloud Run with minimal cold starts";

    return {
      executiveSummary: `Project blueprint for "${name}", a robust application designed within the "${industry}" sector, serving the "${targetAudience}" audience. Tailored for the ${platform} platform using a ${preferredTechStack} codebase, this blueprint represents a production-ready, security-audited architecture built for rapid iteration and scalable growth. Estimated timeline is ${timeline} with an allocated budget of ${budget} managed by a highly collaborative team of ${teamSize}.`,
      techStack: {
        frontend: frontendTech,
        backend: backendTech,
        database: dbTech,
        authentication: authTech,
        aiProvider: aiProviderTech,
        cloudHosting: hostingTech,
        devops: devopsTech,
        testingFramework: testingTech,
        deployment: deploymentTech,
      },
      featureRoadmap: {
        mvp: [
          "Secure Registration, Login, and JWT Token Refresh Mechanism",
          `Core logical dashboard and landing presentation matching "${name}" primary goals`,
          "Persistent CRUD resource management and list filtering",
          "File upload and assets storage system linked to records",
        ],
        v2: [
          "Interactive analytics telemetry charts showing real-time event counters",
          "Automated PDF export controls and email summary broadcast notifications",
          "Workspace multi-tenant collaboration with custom role-based invitation flow",
        ],
        future: [
          "Advanced natural language intelligence parsing with automated auto-categorization",
          "Offline-first client-side state synchronization with robust conflict resolution",
          "Full marketplace integration for third-party widgets and extension hooks",
        ],
      },
      databaseDesign: {
        entities: [
          {
            name: "Users",
            fields: ["id (UUID, PK)", "email (VARCHAR, UNIQUE)", "password_hash (VARCHAR)", "role (ENUM: user, admin)", "first_name (VARCHAR)", "last_name (VARCHAR)", "created_at (TIMESTAMP)"],
            relationships: ["1-to-Many with Projects", "1-to-Many with Notifications", "1-to-Many with AuditLogs"],
          },
          {
            name: "Projects",
            fields: ["id (UUID, PK)", "user_id (UUID, FK)", "name (VARCHAR)", "description (TEXT)", "category (VARCHAR)", "target_launch_date (DATE)", "status (ENUM: draft, building, launched)", "views (INTEGER)", "signups (INTEGER)", "score (INTEGER)", "blueprint (JSONB)", "created_at (TIMESTAMP)"],
            relationships: ["Many-to-1 with Users", "1-to-Many with ChecklistItems", "1-to-Many with ProjectAssets"],
          },
          {
            name: "ChecklistItems",
            fields: ["id (UUID, PK)", "project_id (UUID, FK)", "title (VARCHAR)", "description (TEXT)", "category (ENUM)", "completed (BOOLEAN)", "completed_at (TIMESTAMP)"],
            relationships: ["Many-to-1 with Projects"],
          },
          {
            name: "ProjectAssets",
            fields: ["id (UUID, PK)", "project_id (UUID, FK)", "file_url (VARCHAR)", "file_name (VARCHAR)", "file_size (INTEGER)", "created_at (TIMESTAMP)"],
            relationships: ["Many-to-1 with Projects"],
          },
        ],
      },
      restApiPlan: [
        {
          method: "POST",
          endpoint: "/api/auth/register",
          description: "Register a new user account with cryptographic validation.",
        },
        {
          method: "POST",
          endpoint: "/api/auth/login",
          description: "Authenticate user and issue HTTP-only JWT access/refresh cookies.",
        },
        {
          method: "GET",
          endpoint: "/api/projects",
          description: "List all projects and readiness scores for the authenticated user.",
        },
        {
          method: "GET",
          endpoint: "/api/projects/:id",
          description: "Fetch comprehensive project configuration, checklists, and saved Forge Brain blueprints.",
        },
        {
          method: "POST",
          endpoint: "/api/projects",
          description: "Create a new project launchpad and generate default AI checklists.",
        },
        {
          method: "PUT",
          endpoint: "/api/projects/:id/blueprint",
          description: "Save or update a persistent Forge Brain architectural blueprint.",
        },
        {
          method: "DELETE",
          endpoint: "/api/projects/:id",
          description: "Irreversibly delete a project launchpad and associated blueprints.",
        },
      ],
      folderStructure: `client/
  public/
    favicon.ico
    icon.png
  src/
    components/
      Navbar.tsx
      DashboardView.tsx
      ForgeBrainView.tsx
    App.tsx
    main.tsx
    index.css
    types.ts
    api.ts
server/
  controllers/
    AuthController.ts
    ProjectController.ts
  db/
    db.ts
  middleware/
    auth.ts
    upload.ts
  repositories/
    ProjectRepository.ts
  services/
    AuthService.ts
    GeminiService.ts
  server.ts
package.json
tsconfig.json
vite.config.ts`,
      sprintPlan: [
        {
          name: "Sprint 1: Architecture & Auth",
          duration: "2 Weeks",
          objectives: [
            "Configure Node.js TypeScript environment, Express server, and database connection pools.",
            "Implement secure JWT validation middleware with HttpOnly session storage.",
            "Publish responsive responsive front-end routing framework, landing card states, and global dark theme context.",
          ],
        },
        {
          name: "Sprint 2: Core Blueprinting Engine",
          duration: "2 Weeks",
          objectives: [
            "Build core Project Launchpad creation APIs and connect schema repositories.",
            "Establish the clean service abstraction layers for AI integration (Forge Brain logic).",
            "Connect local state management to store progress metrics and checklist item completed checks.",
          ],
        },
        {
          name: "Sprint 3: Advanced UI & Asset Management",
          duration: "2 Weeks",
          objectives: [
            "Design responsive two-column Forge Brain layout, utilizing glassmorphism cards and collapsible sections.",
            "Integrate Multi-Part form middleware to allow safe image and PDF drag-and-drop file uploads.",
            "Build robust export triggers for PDF, Markdown, and JSON schema structures.",
          ],
        },
        {
          name: "Sprint 4: Analytics Telemetry & Polish",
          duration: "2 Weeks",
          objectives: [
            "Configure real-time event simulation models for public-facing product launches.",
            "Create interactive Recharts dashboards depicting launch day traffic, signup charts, and funnel conversion.",
            "Draft full integration test coverage checking auth boundaries and database updates.",
          ],
        },
        {
          name: "Sprint 5: Production Deployment Prep",
          duration: "2 Weeks",
          objectives: [
            "Package application into clean, self-contained Docker containers optimized for Cloud Run.",
            "Configure GitHub Actions pipeline for automated linter reviews and automated staging pushes.",
            "Conduct end-to-end security audits, verifying JWT expiry and environment variable encapsulation.",
          ],
        },
      ],
      uiSuggestions: [
        "A live, interactive kanban board automatically synchronized with Sprint objectives.",
        "Interactive entity-relationship diagram (ERD) canvas depicting database entities graphically.",
        "Real-time terminal simulator showing virtual build logs during mock deployment exercises.",
        "Team seat scheduler to coordinate resource hours across developers during sprints.",
      ],
      riskAnalysis: {
        technical: "Integrating rapid AI models introduces transient latency. Mitigation: Leverage non-blocking background queue tasks or responsive stages UI loaders.",
        security: "API key theft or leakage from client bundle inclusion. Mitigation: Implement absolute strict backend proxy routing keeping process.env variables fully hidden.",
        performance: "Large directory outputs can saturate front-end React re-renders. Mitigation: Optimize render loops using virtual lists or paginated nodes.",
        scalability: "Concurrent blueprint requests can hit API rate throttles. Mitigation: Establish local cache rules or smart request backoff intervals.",
        complexity: "Managing dynamic configurations can confuse non-technical founders. Mitigation: Provide highly accessible executive summaries and plain-English visualizers.",
      },
      deploymentStrategy: {
        hosting: "Google Cloud Run (Server Container) + CDN Edge Caching (Front-end SPA Assets)",
        cicd: "GitHub Actions triggering Docker builds and pushes on main merges.",
        envVars: ["NODE_ENV=production", "PORT=3000", "GEMINI_API_KEY=****", "JWT_SECRET=****"],
        monitoring: "Google Cloud Logging for fast error tracebacks and container CPU alerts.",
        logging: "Winston transports to persistent storage, filtering sensitive tokens out.",
        backup: "Automated daily point-in-time PostgreSQL snapshots retained for 30 days.",
      },
      inputParams: params,
    };
  }

  async generateWorkspaceChat(
    name: string,
    description: string,
    blueprint: any,
    conversations: { role: "user" | "assistant"; content: string }[],
    userMessage: string,
    quickAction?: string
  ): Promise<string> {
    const ai = getAI();
    if (!ai) {
      return `[AI Offline / No API Key] This is a fallback reply from the local CTO compiler module. I received your request: "${userMessage}". Please configure a real GEMINI_API_KEY to enable intelligent project-aware completions.`;
    }

    try {
      const bpText = blueprint ? JSON.stringify({
        techStack: blueprint.techStack,
        entities: blueprint.databaseDesign?.entities,
        apiPlan: blueprint.restApiPlan,
        sprintPlan: blueprint.sprintPlan,
      }, null, 2) : "No blueprint generated yet.";

      const systemPrompt = `You are the lead CTO Architect and Principal Software Engineer in AI Forge OS workspace.
You are fully project-aware. You are helping the user develop the project:
- Name: "${name}"
- Description: "${description}"

Here is the current architectural blueprint:
${bpText}

Your goal is to answer the user's questions or execute the requested quick action with high technical precision.
If the user asks to generate a component, API, database migration, README, Dockerfile, etc. (either via quick actions or chat), output production-grade code, configurations, or explanations tailored EXACTLY to this project's tech stack and database schema.

Always be concise, precise, and practical. Do not speak in corporate fluff. Write actual code examples, step-by-step guidance, and real system configurations.`;

      const contents = [
        { role: "user" as const, parts: [{ text: systemPrompt }] }
      ];

      for (const msg of conversations) {
        const role = msg.role === "assistant" ? "model" : "user";
        contents.push({
          role: role as any,
          parts: [{ text: msg.content }]
        });
      }

      contents.push({
        role: "user" as const,
        parts: [{ text: userMessage }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
      });

      return response.text || "No response received from the Gemini compilation model.";
    } catch (e: any) {
      console.error("Workspace chat generation failed:", e);
      return `Failed to process AI request. Technical error: ${e.message || e}`;
    }
  }
}

export const geminiService = new GeminiService();

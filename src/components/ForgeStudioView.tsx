import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ApiService } from "../api";
import { Project, WorkspaceState } from "../types";
import {
  Folder,
  FolderOpen,
  FileCode,
  Play,
  Terminal,
  MessageSquare,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  AlertOctagon,
  HelpCircle,
  Code,
  BookOpen,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  Send,
  Cpu,
  Database,
  Search,
  Check,
  X,
  Compass,
  FileText,
  Workflow,
  Share2,
  HardDrive,
  Github,
  Monitor,
  Activity,
  Zap,
  Info,
  ExternalLink,
  RefreshCw,
  GitCommit,
  GitBranch,
  GitPullRequest,
  GitFork,
  ShieldAlert,
  Trash2,
  Copy,
  Edit2,
  LayoutTemplate,
  Network,
  Eye,
  ArrowUpRight,
  History,
  Save,
  Sliders,
  Maximize2,
  Minimize2,
  CheckCircle,
  FileDown
} from "lucide-react";

interface ForgeStudioViewProps {
  token: string;
  onTabChange: (tab: string) => void;
  showAiPanel?: boolean;
  onToggleAiPanel?: () => void;
}

interface CustomPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

interface CodeVersion {
  id: string;
  timestamp: string;
  description: string;
  filesSnapshot: Record<string, string>;
}

export default function ForgeStudioView({ token, onTabChange, showAiPanel = true, onToggleAiPanel }: ForgeStudioViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Layout selection for Center Panel: "editor" | "architecture" | "review" | "deploy" | "git"
  const [studioSubTab, setStudioSubTab] = useState<"editor" | "architecture" | "review" | "deploy" | "git">("editor");

  // Project Explorer state
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
    src: true,
    "src/components": true,
    "src/pages": true,
    server: true,
    "server/controllers": true,
    "server/services": true,
    "server/middleware": true,
    "server/routes": true,
    database: true,
    docker: true,
    config: true,
    tests: true,
    "tests/unit": true,
    "tests/integration": true,
    docs: true
  });

  // Code editor states
  const [openFiles, setOpenFiles] = useState<string[]>(["README.md", "src/App.tsx", "database/schema.ts"]);
  const [activeFile, setActiveFile] = useState<string>("src/App.tsx");
  const [codeFiles, setCodeFiles] = useState<Record<string, string>>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>({});
  
  // Search and replace states
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [showSearchReplace, setShowSearchReplace] = useState(false);

  // UI customization
  const [editorFontSize, setEditorFontSize] = useState<number>(12);
  const [editorTheme, setEditorTheme] = useState<"midnight" | "ocean" | "dracula" | "amber">("midnight");
  const [splitView, setSplitView] = useState(false);

  // AI chat states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string; timestamp: string }[]>([
    {
      role: "assistant",
      content: "Welcome to **Forge Studio IDE**. I am your active AI Software Engineer. I am fully synchronized with this project's specification, database schema, and technical stack blueprint. Select a file or click an AI action to generate production-grade code.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiPanelTab, setAiPanelTab] = useState<"chat" | "prompts" | "actions">("actions");

  // Version history states
  const [versions, setVersions] = useState<CodeVersion[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Code review states
  const [reviewReport, setReviewReport] = useState<{
    complexityScore: string;
    maintainabilityScore: number;
    readinessScore: number;
    securityIssues: { severity: "low" | "medium" | "high"; title: string; desc: string; fixed: boolean }[];
    performanceSuggestions: { title: string; desc: string; impact: string }[];
    bestPractices: { title: string; ok: boolean }[];
  }>({
    complexityScore: "A",
    maintainabilityScore: 94,
    readinessScore: 88,
    securityIssues: [
      { severity: "medium", title: "Implicit any types in API handlers", desc: "Missing precise TS types for query/body parameters in Express routers.", fixed: false },
      { severity: "low", title: "Missing JWT expiration handling on front-end", desc: "Access token is evaluated on load but validation handles gracefully via interceptors only.", fixed: false }
    ],
    performanceSuggestions: [
      { title: "React Component Memoization", desc: "Wrap dynamic metric views in React.memo to prevent layout re-renders.", impact: "Medium" },
      { title: "Query Indexing", desc: "Add secondary composite index on database fields mapped to heavy filters.", impact: "High" }
    ],
    bestPractices: [
      { title: "Structured Error Logging", ok: true },
      { title: "Environment variable isolation", ok: true },
      { title: "Named exports for components", ok: false }
    ]
  });
  const [isReviewing, setIsReviewing] = useState(false);

  // Architecture Viewer state
  const [activeArchTab, setActiveArchTab] = useState<"tree" | "dependency" | "components" | "api" | "database">("components");

  // Git Preparation state
  const [gitBranch, setGitBranch] = useState("main");
  const [gitCommits, setGitCommits] = useState<{ hash: string; msg: string; author: string; date: string }[]>([
    { hash: "8fa2b1d", msg: "Initialize core project architecture & DB models", author: "AI Forge OS", date: "Just now" },
    { hash: "fc291aa", msg: "Compile system layout blueprint and checklist requirements", author: "AI Forge OS", date: "5 mins ago" }
  ]);
  const [commitInput, setCommitInput] = useState("");
  const [gitBranches] = useState(["main", "dev-studio", "feature-auth", "release-v1.0"]);

  // Deployment Preparation state
  const [deployTarget, setDeployTarget] = useState<"firebase" | "vercel" | "render" | "railway" | "docker" | "cloudrun">("cloudrun");
  const [generatedDeployYaml, setGeneratedDeployYaml] = useState<string>("");
  const [isDeployBuilding, setIsDeployBuilding] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);

  // Prompt Library state
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([
    { id: "1", name: "Create SaaS Landing Page", description: "Generate standard conversion-optimized layout component with heroes and pricing cards.", prompt: "Generate a fully responsive React landing page using Tailwind CSS, including a hero section with a bold call to action, features grid with beautiful icons, an interactive pricing toggle, and a modern footer. Optimize spacing and negative space." },
    { id: "2", name: "Generate CRM CRUD Controllers", description: "Standard database-backed controller endpoints for pipeline tracking.", prompt: "Generate an Express controller implementing CRUD endpoints for a CRM Lead management table. Include validation middleware, error handling blocks, and Drizzle query parameters. Follow secure REST standards." },
    { id: "3", name: "Generate Admin Charts panel", description: "Render data charts using recharts in dashboard views.", prompt: "Create a beautiful React component with a multi-chart analytical dashboard using Recharts. Include a line chart for views over time, bar chart for conversion categories, and KPI cards with elegant hover scaling animations." }
  ]);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [showPromptCreator, setShowPromptCreator] = useState(false);

  // Selected code text highlight context for inline AI
  const [selectedCodeText, setSelectedCodeText] = useState("");
  const [showInlineAiMenu, setShowInlineAiMenu] = useState(false);
  const [inlineMenuPos, setInlineMenuPos] = useState({ x: 0, y: 0 });

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize and load project data
  useEffect(() => {
    loadProjects();
  }, []);

  // Sync scroll on chat messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiTyping]);

  const loadProjects = async (selectId?: string) => {
    setIsLoading(true);
    try {
      const list = await ApiService.listProjects(token);
      setProjects(list);
      if (list.length > 0) {
        const idToSelect = selectId || list[0].id;
        setSelectedProjectId(idToSelect);
        const proj = list.find((p) => p.id === idToSelect);
        if (proj) {
          loadProjectWorkspace(proj);
        }
      }
    } catch (e) {
      console.error("Failed to load workspace projects list", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectWorkspace = (project: Project) => {
    setActiveProject(project);

    // Read stored workspace state
    if (project.workspace) {
      const ws = project.workspace;
      if (ws.aiConversations && ws.aiConversations.length > 0) {
        setChatMessages(ws.aiConversations);
      }

      if (ws.codeFiles && Object.keys(ws.codeFiles).length > 0) {
        setCodeFiles(ws.codeFiles);
      } else {
        generateDefaultFiles(project);
      }

      if (ws.openFiles && ws.openFiles.length > 0) {
        setOpenFiles(ws.openFiles);
      }
      if (ws.activeFile) {
        setActiveFile(ws.activeFile);
      }
    } else {
      generateDefaultFiles(project);
    }
  };

  const generateDefaultFiles = (project: Project) => {
    const tech = project.blueprint?.techStack;
    const dbDesign = project.blueprint?.databaseDesign;
    const apiPlan = project.blueprint?.restApiPlan;

    const schemaFields = dbDesign?.entities?.[0]?.fields.join("\n  ") || "id: serial('id').primaryKey()";
    const routeExamples = apiPlan?.map(r => `// ${r.method} ${r.endpoint}\nrouter.${r.method.toLowerCase()}("${r.endpoint.replace('/api', '')}", (req, res) => {\n  res.json({ message: "${r.description}" });\n});`).join("\n\n") || `router.get("/status", (req, res) => {\n  res.json({ status: "ok" });\n});`;

    const defaultFiles: Record<string, string> = {
      "README.md": `# ${project.name} Documentation\n\n${project.description}\n\n## 🛠️ Technical Stack Selection\n- **Frontend Library**: ${tech?.frontend || "React, Vite, Tailwind CSS"}\n- **Backend Services**: ${tech?.backend || "Node.js, Express"}\n- **Database Ingress**: ${tech?.database || "PostgreSQL, Drizzle ORM"}\n- **Cloud Deployment**: ${tech?.cloudHosting || "Google Cloud Run"}\n- **CI/CD Pipeline**: ${tech?.devops || "GitHub Actions & Docker"}\n\n## 🚀 Quick Start Guide\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``,
      "src/App.tsx": `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-center items-center p-8 font-sans">\n      <div className="max-w-xl bg-[#141b2d]/60 border border-[#1e293b] p-6 rounded-2xl shadow-xl">\n        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[#10b981] mb-2">\n          ${project.name}\n        </h1>\n        <p className="text-xs text-slate-400 mb-6">${project.description}</p>\n        \n        <button\n          onClick={() => setCount(count + 1)}\n          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold transition-all"\n        >\n          Dynamic Counter: {count}\n        </button>\n      </div>\n    </div>\n  );\n}`,
      "server/server.ts": `import express from "express";\nimport router from "./routes";\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\napp.use(router);\n\napp.listen(PORT, () => {\n  console.log("Server listening at http://localhost:" + PORT);\n});`,
      "server/routes/api.ts": `import { Router } from "express";\nconst router = Router();\n\n${routeExamples}\n\nexport default router;`,
      "database/schema.ts": `import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";\n\nexport const ${dbDesign?.entities?.[0]?.name || "items"}Table = pgTable("${(dbDesign?.entities?.[0]?.name || "items").toLowerCase()}", {\n  ${schemaFields}\n});`,
      "docker/Dockerfile": `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nCMD ["node", "dist/server.js"]`
    };

    setCodeFiles(defaultFiles);
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProjectId(val);
    const proj = projects.find((p) => p.id === val);
    if (proj) {
      loadProjectWorkspace(proj);
    }
  };

  const persistWorkspaceToBackend = async (customFiles?: Record<string, string>) => {
    if (!selectedProjectId) return;
    try {
      const stateObj: WorkspaceState = {
        aiConversations: chatMessages,
        codeFiles: customFiles || codeFiles,
        openFiles,
        activeFile,
      };
      await ApiService.saveWorkspace(selectedProjectId, stateObj, token);
    } catch (e) {
      console.error("Workspace save failed", e);
    }
  };

  // Textarea context menu detection for Inline AI
  const handleTextareaSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== end) {
      const selectedText = target.value.substring(start, end);
      setSelectedCodeText(selectedText);
      
      // Calculate mouse positioning simulation coordinates
      const rect = target.getBoundingClientRect();
      setInlineMenuPos({
        x: rect.left + 40,
        y: rect.top + 100
      });
      setShowInlineAiMenu(true);
    } else {
      setShowInlineAiMenu(false);
    }
  };

  const handleFileClick = (filePath: string) => {
    if (!openFiles.includes(filePath)) {
      setOpenFiles([...openFiles, filePath]);
    }
    setActiveFile(filePath);
    setStudioSubTab("editor");
    setShowInlineAiMenu(false);
  };

  const handleCloseFileTab = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = openFiles.filter(f => f !== filePath);
    setOpenFiles(updated);
    if (activeFile === filePath && updated.length > 0) {
      setActiveFile(updated[updated.length - 1]);
    }
  };

  const handleCodeEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setCodeFiles({ ...codeFiles, [activeFile]: newVal });
    setUnsavedChanges({ ...unsavedChanges, [activeFile]: true });
  };

  const handleSaveFile = () => {
    setUnsavedChanges({ ...unsavedChanges, [activeFile]: false });
    persistWorkspaceToBackend();
    
    // Add to version history snapshot
    const nextVer: CodeVersion = {
      id: Math.random().toString(36).substring(3, 9),
      timestamp: new Date().toLocaleTimeString(),
      description: `Manual save of file: "${activeFile.split("/").pop()}"`,
      filesSnapshot: { ...codeFiles }
    };
    setVersions([nextVer, ...versions]);
  };

  // Keyboard shortcut listener for Ctrl+S
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [activeFile, codeFiles]);

  // AI chat call orchestrator
  const sendAiCommand = async (customText?: string) => {
    const content = customText || chatInput;
    if (!content.trim() || !selectedProjectId) return;

    const userMsg = {
      role: "user" as const,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setIsAiTyping(true);

    try {
      // Append comprehensive current file and database schemas context details to feed model
      const systemContext = `[Studio IDE Context: Code Editor active file: "${activeFile}". Current code length: ${codeFiles[activeFile]?.length || 0} characters. Folder structure: ${Object.keys(codeFiles).join(", ")}. Blueprint details: ${JSON.stringify(activeProject?.blueprint?.techStack || {})}]`;
      const finalPrompt = `${systemContext}\n\nUser request: ${content}`;

      const response = await ApiService.workspaceChat(selectedProjectId, {
        message: finalPrompt,
        history: chatMessages.map(m => ({ role: m.role, content: m.content }))
      }, token);

      const assistantMsg = {
        role: "assistant" as const,
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages([...nextMessages, assistantMsg]);
    } catch (e: any) {
      console.error(e);
      setChatMessages([...nextMessages, {
        role: "assistant",
        content: `Could not contact compiler node. Trace error: ${e.message || e}. Using mock AI simulation for developer layout offline mode.`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // AI Code Actions (Injecting compiled files directly)
  const executeCodeAction = async (action: string) => {
    setIsAiTyping(true);
    setAiPanelTab("chat");

    const promptText = `Generate production-grade code module for "${action}" that matches this project "${activeProject?.name}". Output the complete valid file contents wrapped in standard markdown blocks so I can write it immediately to files.`;
    
    const userMsg = {
      role: "user" as const,
      content: `[AI Code Action] Run action: "${action}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);

    try {
      const response = await ApiService.workspaceChat(selectedProjectId, {
        message: promptText,
        history: chatMessages.map(m => ({ role: m.role, content: m.content }))
      }, token);

      const assistantMsg = {
        role: "assistant" as const,
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages([...nextMessages, assistantMsg]);

      // Parse code block and auto-suggest path
      const codeBlockRegex = /```(?:typescript|javascript|tsx|json|css|html|sql|bash|yaml)?\s*([\s\S]*?)```/g;
      const match = codeBlockRegex.exec(response.reply);
      if (match) {
        const parsedCode = match[1];
        
        // Match path suggestion
        let targetPath = activeFile;
        if (action.includes("React Component")) targetPath = "src/components/MyNewComponent.tsx";
        else if (action.includes("Express Controller")) targetPath = "server/controllers/MyController.ts";
        else if (action.includes("API Route")) targetPath = "server/routes/myApi.ts";
        else if (action.includes("Database Model")) targetPath = "database/schema.ts";
        else if (action.includes("Dockerfile")) targetPath = "docker/Dockerfile";
        else if (action.includes("README")) targetPath = "README.md";

        // Let's prompt user or auto-create it
        const nextFiles = { ...codeFiles, [targetPath]: parsedCode };
        setCodeFiles(nextFiles);
        if (!openFiles.includes(targetPath)) {
          setOpenFiles([...openFiles, targetPath]);
        }
        setActiveFile(targetPath);
        setUnsavedChanges({ ...unsavedChanges, [targetPath]: true });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Inline AI Menu Options execution
  const executeInlineAi = async (option: string) => {
    setShowInlineAiMenu(false);
    setIsAiTyping(true);
    setAiPanelTab("chat");

    const userMsg = {
      role: "user" as const,
      content: `[Inline Code Help] ${option} selected code:\n\`\`\`\n${selectedCodeText}\n\`\`\``,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);

    try {
      const response = await ApiService.workspaceChat(selectedProjectId, {
        message: `Perform inline AI transformation: "${option}" on this block:\n${selectedCodeText}. Generate optimized or cleaned solution block wrapped inside markdown backticks.`,
        history: chatMessages.map(m => ({ role: m.role, content: m.content }))
      }, token);

      const assistantMsg = {
        role: "assistant" as const,
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages([...nextMessages, assistantMsg]);

      // If user wants to replace selected code with AI's code block
      const codeBlockRegex = /```(?:typescript|javascript|tsx|json|css|html|sql)?\s*([\s\S]*?)```/g;
      const match = codeBlockRegex.exec(response.reply);
      if (match && option !== "Explain" && option !== "Find Bugs") {
        const parsedCode = match[1];
        const oldFileContent = codeFiles[activeFile] || "";
        const nextContent = oldFileContent.replace(selectedCodeText, parsedCode.trim());
        setCodeFiles({ ...codeFiles, [activeFile]: nextContent });
        setUnsavedChanges({ ...unsavedChanges, [activeFile]: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Folder Explorer mutations
  const handleCreateFile = (pathName: string) => {
    if (!pathName) return;
    const cleanPath = pathName.trim();
    if (codeFiles[cleanPath] !== undefined) return;
    const nextFiles = { ...codeFiles, [cleanPath]: `// File ${cleanPath} initialized.\n` };
    setCodeFiles(nextFiles);
    setOpenFiles([...openFiles, cleanPath]);
    setActiveFile(cleanPath);
    persistWorkspaceToBackend(nextFiles);
  };

  const handleDeleteFile = (filePath: string) => {
    const nextFiles = { ...codeFiles };
    delete nextFiles[filePath];
    setCodeFiles(nextFiles);
    const nextOpen = openFiles.filter(f => f !== filePath);
    setOpenFiles(nextOpen);
    if (activeFile === filePath && nextOpen.length > 0) {
      setActiveFile(nextOpen[nextOpen.length - 1]);
    }
    persistWorkspaceToBackend(nextFiles);
  };

  const handleDuplicateFile = (filePath: string) => {
    const ext = filePath.includes(".") ? "." + filePath.split(".").pop() : "";
    const base = filePath.includes(".") ? filePath.substring(0, filePath.lastIndexOf(".")) : filePath;
    const nextPath = `${base}_copy${ext}`;
    const nextFiles = { ...codeFiles, [nextPath]: codeFiles[filePath] || "" };
    setCodeFiles(nextFiles);
    setOpenFiles([...openFiles, nextPath]);
    setActiveFile(nextPath);
    persistWorkspaceToBackend(nextFiles);
  };

  // Reusable Prompt Lib creator
  const saveCustomPrompt = () => {
    if (!newPromptName.trim() || !newPromptText.trim()) return;
    const promptObj: CustomPrompt = {
      id: Date.now().toString(),
      name: newPromptName.trim(),
      description: "Saved custom templates",
      prompt: newPromptText.trim()
    };
    setCustomPrompts([...customPrompts, promptObj]);
    setNewPromptName("");
    setNewPromptText("");
    setShowPromptCreator(false);
  };

  // Visual code highlighter module
  const codeHighlights = useMemo(() => {
    const raw = codeFiles[activeFile] || "";
    // Safe text escape
    let text = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Comments (both single & multi line)
    text = text.replace(/(\/\/.*)/g, '<span class="text-[#6272a4] font-normal italic">$1</span>');
    text = text.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-[#6272a4] font-normal italic">$1</span>');

    // Strings
    text = text.replace(/(["'`])(.*?)\1/g, '<span class="text-[#f1fa8c]">$1$2$1</span>');

    // Numbers
    text = text.replace(/\b(\d+)\b/g, '<span class="text-[#bd93f9]">$1</span>');

    // Keywords
    const keywords = [
      "import", "from", "export", "default", "const", "let", "var", "function", "return",
      "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "class",
      "interface", "type", "enum", "extends", "implements", "new", "this", "super", "try",
      "catch", "finally", "throw", "async", "await", "public", "private", "protected", "readonly"
    ];
    const kwRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
    text = text.replace(kwRegex, '<span class="text-[#ff79c6] font-bold">$1</span>');

    // Common imports or objects
    text = text.replace(/\b(React|useState|useEffect|useRef|useMemo|ApiService|Router|express)\b/g, '<span class="text-[#50fa7b] font-medium">$1</span>');

    return text;
  }, [activeFile, codeFiles[activeFile]]);

  // Code Review trigger
  const runCodeReview = () => {
    setIsReviewing(true);
    setTimeout(() => {
      // Simulate real-time neural static analyzer
      setReviewReport({
        complexityScore: "A",
        maintainabilityScore: 97,
        readinessScore: 94,
        securityIssues: [
          { severity: "low", title: "Implicit generic schema parameters resolved", desc: "No critical SQL injections detected in active schema migrations.", fixed: true }
        ],
        performanceSuggestions: [
          { title: "Optimized route parameters caching", desc: "Response body cache headers implemented successfully.", impact: "Low" }
        ],
        bestPractices: [
          { title: "Structured Error Logging", ok: true },
          { title: "Environment variable isolation", ok: true },
          { title: "Named exports for components", ok: true }
        ]
      });
      setIsReviewing(false);
    }, 1500);
  };

  // Git commit simulator
  const handleGitCommit = () => {
    if (!commitInput.trim()) return;
    const shortHash = Math.random().toString(16).substring(2, 9);
    const newCommit = {
      hash: shortHash,
      msg: commitInput,
      author: "AI Developer Studio",
      date: "Just now"
    };
    setGitCommits([newCommit, ...gitCommits]);
    setCommitInput("");

    // Create persistent code version tag
    const nextVer: CodeVersion = {
      id: shortHash,
      timestamp: new Date().toLocaleTimeString(),
      description: `Commit: "${commitInput}"`,
      filesSnapshot: { ...codeFiles }
    };
    setVersions([nextVer, ...versions]);
  };

  // Deploy pipeline simulator
  const triggerDeployPipelineSimulation = () => {
    setIsDeployBuilding(true);
    setDeployLogs([]);
    const stages = [
      `Initializing deployment pipeline container targeting ${deployTarget.toUpperCase()}...`,
      "Evaluating project compilation specs...",
      "Resolving workspace environment declarations...",
      "Linting workspace code assets - OK",
      "Building static assets bundle and server binaries...",
      "Verifying structural integrity checks - Passed",
      `Constructing custom architecture config files targeting ${deployTarget}...`,
      `[SUCCESS] System ready. Deployment blueprint compiled for ${deployTarget.toUpperCase()}!`
    ];

    let count = 0;
    const interval = setInterval(() => {
      if (count < stages.length) {
        setDeployLogs(prev => [...prev, stages[count]]);
        count++;
      } else {
        clearInterval(interval);
        setIsDeployBuilding(false);

        // Populate mock target YAML
        if (deployTarget === "docker") {
          setGeneratedDeployYaml(`# Docker Compose Deployment Specs\nversion: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n      - DATABASE_URL=postgresql://root:secret@postgres:5432/appdb`);
        } else if (deployTarget === "firebase") {
          setGeneratedDeployYaml(`{\n  "hosting": {\n    "public": "dist",\n    "ignore": [\n      "firebase.json",\n      "**/.*",\n      "**/node_modules/**"\n    ]\n  }\n}`);
        } else if (deployTarget === "cloudrun") {
          setGeneratedDeployYaml(`apiVersion: serving.knative.dev/v1\nkind: Service\nmetadata:\n  name: ${activeProject?.name.toLowerCase().replace(/\s+/g, "-") || "forge-app"}\n  namespace: default\nspec:\n  template:\n    spec:\n      containers:\n        - image: gcr.io/aiforge-project/service:latest\n          ports:\n            - containerPort: 3000`);
        } else {
          setGeneratedDeployYaml(`{\n  "version": 2,\n  "builds": [\n    { "src": "package.json", "use": "@vercel/node" }\n  ]\n}`);
        }
      }
    }, 600);
  };

  // Folder Explorer visual directory tree representation
  const folderExplorerTree = useMemo(() => {
    const fileKeys = Object.keys(codeFiles);
    const tree: Record<string, any> = {};

    fileKeys.forEach(f => {
      const parts = f.split("/");
      let current = tree;
      parts.forEach((p, idx) => {
        if (!current[p]) {
          current[p] = idx === parts.length - 1 ? { _file: f } : {};
        }
        current = current[p];
      });
    });

    return tree;
  }, [codeFiles]);

  const renderExplorerNode = (node: any, name: string, depth = 0, currentPath = "") => {
    const nodePath = currentPath ? `${currentPath}/${name}` : name;
    const isFile = node._file !== undefined;

    if (isFile) {
      const isActive = activeFile === node._file;
      return (
        <div
          key={node._file}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => handleFileClick(node._file)}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded text-xs transition-colors cursor-pointer ${
            isActive
              ? "bg-[#1e293b] text-blue-400 font-bold"
              : "text-[#94a3b8] hover:text-white hover:bg-[#141b2d]/65"
          }`}
        >
          <span className="flex items-center gap-2 truncate">
            <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{name}</span>
            {unsavedChanges[node._file] && (
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full shrink-0" title="Unsaved changes" />
            )}
          </span>
          
          {/* Quick inline explorer utility operations */}
          <div className="hidden group-hover:flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleDuplicateFile(node._file); }}
              title="Duplicate node"
              className="p-1 hover:text-white text-slate-500 rounded"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteFile(node._file); }}
              title="Delete node"
              className="p-1 hover:text-red-400 text-slate-500 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    const isFolderExpanded = expandedFolders[nodePath] !== false;

    return (
      <div key={nodePath}>
        <div
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => setExpandedFolders({ ...expandedFolders, [nodePath]: !isFolderExpanded })}
          className="flex items-center justify-between py-1.5 pr-2 rounded text-xs text-slate-300 hover:text-white hover:bg-[#141b2d]/40 transition-all cursor-pointer font-semibold"
        >
          <span className="flex items-center gap-1.5">
            {isFolderExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span className="truncate">{name}</span>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isFolderExpanded ? "" : "-rotate-90"}`} />
        </div>

        {isFolderExpanded && (
          <div className="space-y-0.5">
            {Object.keys(node).map(childName => 
              renderExplorerNode(node[childName], childName, depth + 1, nodePath)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 text-left font-sans flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Header toolbar */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#141b2d] pb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sliders className="w-6.5 h-6.5 text-[#a855f7]" />
            Forge Studio
          </h1>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">
            Real project code compiler, interactive workspace sandbox, and visual analyzer.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedProjectId}
            onChange={handleProjectSelect}
            className="px-3.5 py-1.5 bg-[#141b2d] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-[#a855f7] min-w-[180px]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name}
              </option>
            ))}
          </select>
          
          {/* Quick navigation utility */}
          <button
            onClick={() => onTabChange("workspace")}
            className="px-3 py-1.5 bg-[#1e293b]/50 border border-[#1e293b] hover:text-white rounded-lg text-xs text-[#94a3b8] font-bold flex items-center gap-1 transition-all"
          >
            <Compass className="w-3.5 h-3.5" />
            Workspace
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Cpu className="w-10 h-10 animate-spin text-purple-500 mb-4" />
          <p className="text-xs font-semibold">Warming up code compilers...</p>
        </div>
      ) : !activeProject ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border border-dashed border-[#1e293b] rounded-2xl p-12 bg-[#141b2d]/10">
          <Zap className="w-12 h-12 text-[#475569] mb-4" />
          <h3 className="text-sm font-bold text-white">No active launchpad project detected</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm text-center mt-1">
            Build a custom blueprint using 🧠 Forge Brain to load workspace code.
          </p>
          <button 
            onClick={() => onTabChange("forge_brain")}
            className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all"
          >
            Build Blueprint
          </button>
        </div>
      ) : (
        /* ===================================================================================== */
        /* STUDIO FOUR-PANEL LAYOUT                                                              */
        /* ===================================================================================== */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden pb-4 relative">
          
          {/* --------------------------------------------------------------------------------- */}
          {/* PANEL 1: PROJECT EXPLORER (Left panel - 3 cols)                                  */}
          {/* --------------------------------------------------------------------------------- */}
          <div className="lg:col-span-3 bg-[#0e1424]/85 border border-[#1e293b] rounded-xl flex flex-col h-full overflow-hidden shadow-xl backdrop-blur-md">
            <div className="p-3 bg-[#11192a] border-b border-[#1e293b] flex justify-between items-center shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#94a3b8] flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                Workspace Filesystem
              </span>
              <button
                onClick={() => {
                  const name = prompt("Enter new filename (e.g. src/components/Alert.tsx):");
                  if (name) handleCreateFile(name);
                }}
                className="p-1.5 bg-[#141b2d] border border-[#1e293b] hover:text-purple-400 text-[#94a3b8] rounded-lg transition-colors"
                title="Create a file"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual File tree structure */}
            <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar space-y-1">
              {Object.keys(folderExplorerTree).map(rootKey => 
                renderExplorerNode(folderExplorerTree[rootKey], rootKey)
              )}
            </div>

            {/* Version control snapshots list indicator */}
            <div className="p-3 bg-[#11192a] border-t border-[#1e293b] shrink-0">
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="w-full py-1.5 px-3 bg-[#141b2d] border border-[#1e293b] hover:border-slate-700 text-slate-300 text-xs font-bold rounded-lg flex justify-between items-center transition-all"
              >
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  Local Code Versions
                </span>
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-blue-400 font-extrabold">
                  {versions.length}
                </span>
              </button>

              {/* Version History Drawer list overlay */}
              <AnimatePresence>
                {showVersionHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar pt-1.5"
                  >
                    {versions.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center py-2">No file snapshots saved yet.</p>
                    ) : (
                      versions.map((ver, idx) => (
                        <div
                          key={ver.id}
                          onClick={() => {
                            setCodeFiles(ver.filesSnapshot);
                            alert(`Restored workspace code filesystem snapshot from ${ver.timestamp}`);
                          }}
                          className="p-2 bg-[#141b2d] border border-[#1e293b]/70 hover:border-blue-500 rounded text-[10px] text-left cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-slate-300">{ver.id}</span>
                            <span className="text-slate-500 text-[9px]">{ver.timestamp}</span>
                          </div>
                          <p className="text-slate-400 truncate">{ver.description}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* --------------------------------------------------------------------------------- */}
          {/* PANEL 2: MONACO CODE EDITOR (Center panel - 5 cols)                              */}
          {/* --------------------------------------------------------------------------------- */}
          <div className={`${showAiPanel ? "lg:col-span-5" : "lg:col-span-9"} flex flex-col h-full bg-[#141b2d]/30 border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl relative`}>
            
            {/* Editor Sub Navigation Tabs */}
            <div className="flex border-b border-[#1e293b] bg-[#0e1424] overflow-x-auto shrink-0 scrollbar-none">
              {[
                { id: "editor", label: "Sandbox Editor", icon: Code },
                { id: "architecture", label: "Architecture", icon: LayoutTemplate },
                { id: "review", label: "Code Review", icon: ShieldAlert },
                { id: "git", label: "Git Specs", icon: GitCommit },
                { id: "deploy", label: "Deploy Ready", icon: Workflow },
              ].map((sub) => {
                const isSel = studioSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setStudioSubTab(sub.id as any)}
                    className={`px-4 py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all shrink-0 ${
                      isSel
                        ? "border-[#a855f7] bg-[#141b2d]/45 text-white"
                        : "border-transparent text-[#94a3b8] hover:text-white hover:bg-[#141b2d]/25"
                    }`}
                  >
                    <sub.icon className="w-3.5 h-3.5" />
                    {sub.label}
                  </button>
                );
              })}
            </div>

            {/* TAB BODY AREA */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-xs">
              
              {/* editor tab */}
              {studioSubTab === "editor" && (
                <div className="flex flex-col h-full overflow-hidden">
                  
                  {/* File Tabs Pills row */}
                  <div className="flex justify-between items-center border-b border-[#1e293b] pb-2 shrink-0">
                    <div className="flex gap-1 overflow-x-auto scrollbar-none">
                      {openFiles.map((f) => {
                        const isAct = activeFile === f;
                        return (
                          <div
                            key={f}
                            onClick={() => setActiveFile(f)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                              isAct
                                ? "bg-[#a855f7] text-white"
                                : "bg-[#0e1424] text-[#94a3b8] hover:text-white"
                            }`}
                          >
                            <FileCode className="w-3 h-3 text-slate-300" />
                            <span>{f.split("/").pop()}</span>
                            {unsavedChanges[f] && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full shrink-0" />}
                            <button
                              onClick={(e) => handleCloseFileTab(f, e)}
                              className="hover:text-red-400 ml-1 text-[11px]"
                            >
                              &times;
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick controls row */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSearchReplace(!showSearchReplace)}
                        title="Search and Replace"
                        className="p-1.5 bg-[#0e1424] border border-[#1e293b] text-slate-400 hover:text-white rounded"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleSaveFile}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                        title="Save Changes (Ctrl+S)"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Search and Replace dialog overlay */}
                  <AnimatePresence>
                    {showSearchReplace && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-[#0e1424] border border-[#1e293b] rounded-lg mt-2 space-y-2 shrink-0"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Find..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-[#141b2d] border border-[#1e293b] rounded text-[11px] text-white outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Replace..."
                            value={replaceQuery}
                            onChange={(e) => setReplaceQuery(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-[#141b2d] border border-[#1e293b] rounded text-[11px] text-white outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              if (!searchQuery) return;
                              const current = codeFiles[activeFile] || "";
                              const next = current.replace(new RegExp(searchQuery, "g"), replaceQuery);
                              setCodeFiles({ ...codeFiles, [activeFile]: next });
                              setUnsavedChanges({ ...unsavedChanges, [activeFile]: true });
                            }}
                            className="px-2.5 py-1 bg-[#1e293b] hover:text-white rounded text-[10px]"
                          >
                            Replace All
                          </button>
                          <button
                            onClick={() => setShowSearchReplace(false)}
                            className="px-2.5 py-1 bg-slate-800 hover:text-white rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* High Fidelity double-layer custom syntax highlighted editor */}
                  <div className="flex-1 mt-3 flex flex-col overflow-hidden bg-[#0a0e17] border border-[#1e293b] rounded-xl relative">
                    
                    {/* Top status bar */}
                    <div className="p-2 bg-[#0e1424] border-b border-[#1e293b] flex justify-between items-center text-[10px] text-[#475569] font-mono">
                      <span>{activeFile}</span>
                      <div className="flex items-center gap-3">
                        <select
                          value={editorFontSize}
                          onChange={(e) => setEditorFontSize(Number(e.target.value))}
                          className="bg-transparent border-none text-[10px] text-slate-400 focus:outline-none focus:ring-0"
                        >
                          <option value="11" className="bg-[#0b0f19]">11px</option>
                          <option value="12" className="bg-[#0b0f19]">12px</option>
                          <option value="13" className="bg-[#0b0f19]">13px</option>
                          <option value="14" className="bg-[#0b0f19]">14px</option>
                        </select>
                        <span className="text-purple-400 animate-pulse flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#a855f7] rounded-full" />
                          Ready
                        </span>
                      </div>
                    </div>

                    {/* Main text composition container */}
                    <div className="flex-1 flex overflow-hidden font-mono relative">
                      
                      {/* Left gutter line numbers */}
                      <div className="w-8 bg-[#070b13] text-[#334155] text-right pr-2 py-3 select-none leading-relaxed border-r border-[#1e293b]/50 shrink-0">
                        {Array.from({ length: Math.max(15, (codeFiles[activeFile] || "").split("\n").length) }).map((_, i) => (
                          <div key={i} style={{ fontSize: `${editorFontSize}px` }}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Overlapping double layers: Pre-rendered syntax highlight on background, and Transparent textarea on foreground */}
                      <div className="flex-1 relative overflow-auto custom-scrollbar">
                        
                        {/* Layer A (Background): Beautiful Syntax Highlight layer */}
                        <pre 
                          className="absolute inset-0 p-3 select-none pointer-events-none whitespace-pre-wrap word-break-break-all leading-relaxed"
                          style={{ fontSize: `${editorFontSize}px` }}
                          dangerouslySetInnerHTML={{ __html: codeHighlights }}
                        />

                        {/* Layer B (Foreground): High speed user interaction input layer */}
                        <textarea
                          ref={codeTextareaRef}
                          value={codeFiles[activeFile] || ""}
                          onChange={handleCodeEdit}
                          onSelect={handleTextareaSelection}
                          className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-blue-400 p-3 outline-none resize-none overflow-hidden leading-relaxed border-none focus:ring-0 whitespace-pre-wrap word-break-break-all font-mono"
                          style={{ fontSize: `${editorFontSize}px` }}
                          placeholder="// Type project code here... Highlight snippet to trigger Inline AI"
                        />
                      </div>
                    </div>

                    {/* Double-layer selection Inline AI menu */}
                    <AnimatePresence>
                      {showInlineAiMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute p-2 bg-[#0e1424] border border-[#a855f7]/50 rounded-xl shadow-2xl z-50 flex items-center gap-1"
                          style={{ left: `${inlineMenuPos.x}px`, top: `${inlineMenuPos.y}px` }}
                        >
                          <span className="text-[9px] uppercase font-bold text-[#a855f7] px-1 bg-purple-950/40 rounded mr-1 shrink-0">Inline AI</span>
                          {[
                            "Explain", "Optimize", "Refactor", "Find Bugs", "Add Comments"
                          ].map((action) => (
                            <button
                              key={action}
                              onClick={() => executeInlineAi(action)}
                              className="px-2 py-1 hover:bg-[#a855f7] hover:text-white rounded text-[10px] text-slate-300 font-bold transition-all whitespace-nowrap"
                            >
                              {action}
                            </button>
                          ))}
                          <button
                            onClick={() => setShowInlineAiMenu(false)}
                            className="p-1 hover:text-white text-slate-500 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* architecture visualization tab */}
              {studioSubTab === "architecture" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#11192a]/55 border border-[#1e293b] rounded-xl flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                        <Network className="w-4 h-4 text-purple-400" />
                        AI Compiled Architecture visualizer
                      </h3>
                      <p className="text-[11px] text-[#94a3b8] mt-0.5">Visually rendering dependencies and system layouts</p>
                    </div>

                    <div className="flex gap-1.5">
                      {[
                        { id: "components", label: "Components" },
                        { id: "api", label: "REST Pipeline" },
                        { id: "database", label: "DB Diagrams" },
                        { id: "tree", label: "Folder Tree" }
                      ].map((atab) => {
                        const isSel = activeArchTab === atab.id;
                        return (
                          <button
                            key={atab.id}
                            onClick={() => setActiveArchTab(atab.id as any)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                              isSel
                                ? "bg-purple-950/40 text-purple-400 border-[#a855f7]"
                                : "bg-transparent text-slate-400 border-transparent hover:text-white"
                            }`}
                          >
                            {atab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Architecture Diagram Canvas */}
                  <div className="p-6 bg-[#0a0e17] border border-[#1e293b] rounded-xl min-h-[340px] flex flex-col justify-center items-center text-center">
                    
                    {/* Render DB relations layout schema map */}
                    {activeArchTab === "database" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {activeProject.blueprint?.databaseDesign?.entities.map((ent, idx) => (
                          <div key={idx} className="p-3 bg-[#11192a]/70 border border-[#1e293b] rounded-xl text-left">
                            <span className="text-[10px] uppercase font-black text-purple-400 flex items-center gap-1">
                              <Database className="w-3.5 h-3.5" />
                              {ent.name}
                            </span>
                            <div className="mt-2.5 divide-y divide-[#1e293b]/60">
                              {ent.fields.map((f, fi) => (
                                <div key={fi} className="py-1 text-[11px] flex justify-between text-slate-300">
                                  <span>🔑 {f.split(":")[0]}</span>
                                  <span className="text-slate-500 text-[10px]">{f.split(":")[1] || "varchar"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Render API routes flow */}
                    {activeArchTab === "api" && (
                      <div className="space-y-3 w-full max-w-lg">
                        {activeProject.blueprint?.restApiPlan.map((route, idx) => (
                          <div key={idx} className="p-3 bg-[#11192a]/30 border border-[#1e293b] rounded-lg flex items-center justify-between text-left hover:border-purple-500 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                route.method === "GET" ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800" :
                                route.method === "POST" ? "bg-blue-950/30 text-blue-400 border border-blue-800" : "bg-purple-950/30 text-purple-400 border border-purple-800"
                              }`}>{route.method}</span>
                              <span className="text-xs font-mono font-bold text-slate-200">{route.endpoint}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#475569]" />
                            <span className="text-[10px] text-slate-400 font-bold max-w-[180px] truncate">{route.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Components dependencies graph flowchart mock */}
                    {activeArchTab === "components" && (
                      <div className="flex flex-col items-center gap-5 w-full">
                        <div className="px-4 py-2 bg-[#11192a] border border-[#a855f7]/50 rounded-xl font-bold text-white shadow-lg text-xs">
                          📁 App Router Entrypoint
                        </div>
                        <div className="h-5 w-0.5 bg-purple-500" />
                        <div className="grid grid-cols-3 gap-4 w-full">
                          <div className="p-3 bg-[#11192a]/55 border border-[#1e293b] rounded-xl text-center text-slate-300 text-[11px] font-semibold">
                            💻 Navigation Shell
                          </div>
                          <div className="p-3 bg-[#11192a]/55 border border-[#1e293b] rounded-xl text-center text-slate-300 text-[11px] font-semibold">
                            🧠 Engine Controller
                          </div>
                          <div className="p-3 bg-[#11192a]/55 border border-[#1e293b] rounded-xl text-center text-slate-300 text-[11px] font-semibold">
                            ⚙️ DB Adapter
                          </div>
                        </div>
                        <div className="h-5 w-0.5 bg-[#475569]" />
                        <div className="p-3 bg-[#11192a]/30 border border-dashed border-[#1e293b] rounded-xl max-w-sm text-[#94a3b8] text-[10px] leading-relaxed">
                          All components are successfully resolved. Code splitting and dynamic imports enabled.
                        </div>
                      </div>
                    )}

                    {/* Folder Tree Diagram representation */}
                    {activeArchTab === "tree" && (
                      <div className="w-full text-left max-w-md max-h-64 overflow-y-auto p-4 bg-[#11192a]/30 rounded-xl border border-[#1e293b]/70 font-mono text-[11px] text-slate-300 space-y-2">
                        <div>📁 /root</div>
                        <div className="pl-4">├── 📁 src/components</div>
                        <div className="pl-4">│   ├── 📄 Button.tsx</div>
                        <div className="pl-4">│   └── 📄 Navbar.tsx</div>
                        <div className="pl-4">├── 📁 server/routes</div>
                        <div className="pl-4">│   └── 📄 api.ts</div>
                        <div className="pl-4">└── 📄 package.json</div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* code review analysis tab */}
              {studioSubTab === "review" && (
                <div className="space-y-4">
                  <div className="p-4 bg-[#11192a]/55 border border-[#1e293b] rounded-xl flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        AI Automated Static Code analysis
                      </h3>
                      <p className="text-[11px] text-[#94a3b8] mt-0.5">Evaluating complexity, performance bottleneck metrics, and safety issues</p>
                    </div>

                    <button
                      onClick={runCodeReview}
                      disabled={isReviewing}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all text-xs"
                    >
                      {isReviewing ? "Scanning Codebase..." : "Run Analysis"}
                    </button>
                  </div>

                  {/* Code metrics dashboard */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#11192a]/55 border border-[#1e293b] rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Complexity Class</span>
                      <p className="text-2xl font-black text-blue-400">{reviewReport.complexityScore}</p>
                    </div>
                    <div className="p-3 bg-[#11192a]/55 border border-[#1e293b] rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Maintainability</span>
                      <p className="text-2xl font-black text-emerald-400">{reviewReport.maintainabilityScore}%</p>
                    </div>
                    <div className="p-3 bg-[#11192a]/55 border border-[#1e293b] rounded-xl text-center">
                      <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Production Readiness</span>
                      <p className="text-2xl font-black text-purple-400">{reviewReport.readinessScore}%</p>
                    </div>
                  </div>

                  {/* Detailed issues checklists */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-white border-b border-[#1e293b] pb-2 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      Security & Compliance findings
                    </h4>
                    
                    {reviewReport.securityIssues.map((issue, idx) => (
                      <div key={idx} className="p-3 bg-[#11192a]/20 border border-[#1e293b]/70 rounded-xl flex justify-between items-center">
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase mr-2 ${
                            issue.severity === "high" ? "bg-red-950/40 text-red-400 border border-red-800" :
                            issue.severity === "medium" ? "bg-amber-950/40 text-amber-400 border border-amber-800" : "bg-blue-950/40 text-blue-400 border border-blue-800"
                          }`}>{issue.severity}</span>
                          <span className="font-bold text-slate-200 text-xs">{issue.title}</span>
                          <p className="text-[11px] text-[#94a3b8] mt-1">{issue.desc}</p>
                        </div>
                        {issue.fixed ? (
                          <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                            <Check className="w-4 h-4" /> Fixed
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const updated = [...reviewReport.securityIssues];
                              updated[idx].fixed = true;
                              setReviewReport({ ...reviewReport, securityIssues: updated });
                            }}
                            className="px-2 py-1 bg-slate-800 hover:text-white rounded text-[10px] font-bold"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* git preparations tab */}
              {studioSubTab === "git" && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-950/15 border border-blue-900/40 rounded-xl">
                    <h3 className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                      <GitFork className="w-4 h-4 animate-pulse" />
                      Git Repositories Prep Shell
                    </h3>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed mt-1">
                      Prepare project architectures for immediate code handoff to remote branches and future pipeline commits.
                    </p>
                  </div>

                  {/* Branch selector & Commit form */}
                  <div className="p-4 bg-[#11192a]/55 border border-[#1e293b] rounded-xl space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-400 font-bold">Active Working Branch</span>
                      <select
                        value={gitBranch}
                        onChange={(e) => setGitBranch(e.target.value)}
                        className="px-3 py-1 bg-[#141b2d] border border-[#1e293b] text-xs text-white rounded focus:outline-none"
                      >
                        {gitBranches.map(br => <option key={br} value={br}>{br}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-[#1e293b]/60">
                      <input
                        type="text"
                        placeholder="Commit message..."
                        value={commitInput}
                        onChange={(e) => setCommitInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-[#141b2d] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={handleGitCommit}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                      >
                        <GitCommit className="w-4.5 h-4.5" />
                        Commit
                      </button>
                    </div>
                  </div>

                  {/* Branch history list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-[#1e293b] pb-2">
                      <History className="w-3.5 h-3.5 text-blue-400" />
                      Commit Logs history
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {gitCommits.map((commit, idx) => (
                        <div key={idx} className="p-3 bg-[#11192a]/20 border border-[#1e293b] rounded-lg flex justify-between items-center">
                          <div>
                            <span className="font-mono text-blue-400 font-bold text-[11px] mr-2">[{commit.hash}]</span>
                            <span className="text-slate-200 text-xs font-semibold">{commit.msg}</span>
                            <span className="text-[9px] text-[#475569] block mt-0.5">Author: {commit.author}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{commit.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* deployment target compiler tab */}
              {studioSubTab === "deploy" && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-950/15 border border-purple-900/40 rounded-xl">
                    <h3 className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                      <Workflow className="w-4 h-4" />
                      Multicloud Pipelines deployment manager
                    </h3>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed mt-1">Compile YAML delivery templates for Firebase, Vercel, Railway, or Google Cloud Run targets.</p>
                  </div>

                  {/* Config selector */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "cloudrun", label: "Cloud Run" },
                      { id: "docker", label: "Docker" },
                      { id: "firebase", label: "Firebase" },
                      { id: "vercel", label: "Vercel" },
                      { id: "render", label: "Render" },
                      { id: "railway", label: "Railway" }
                    ].map((target) => {
                      const isSel = deployTarget === target.id;
                      return (
                        <button
                          key={target.id}
                          onClick={() => setDeployTarget(target.id as any)}
                          className={`p-3 border rounded-xl text-center transition-all ${
                            isSel
                              ? "bg-purple-950/30 border-[#a855f7] text-purple-400 font-bold"
                              : "bg-[#11192a]/40 border-[#1e293b] text-slate-400 hover:text-white"
                          }`}
                        >
                          {target.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Compile config specs buttons */}
                  <button
                    onClick={triggerDeployPipelineSimulation}
                    disabled={isDeployBuilding}
                    className="w-full py-2 bg-[#a855f7] hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isDeployBuilding ? "animate-spin" : ""}`} />
                    {isDeployBuilding ? "Compiling Specs..." : "Compile Deployment YAML"}
                  </button>

                  {/* Pipeline logs terminal representation */}
                  {deployLogs.length > 0 && (
                    <div className="p-3.5 bg-black border border-[#1e293b] rounded-xl text-[10px] font-mono text-slate-300 leading-relaxed max-h-44 overflow-y-auto space-y-1">
                      {deployLogs.map((log, i) => (
                        <div key={i} className={log.includes("[SUCCESS]") ? "text-emerald-400 font-bold" : ""}>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Compiled YAML viewer block */}
                  {generatedDeployYaml && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Compiled target YAML config:</span>
                      <pre className="p-4 bg-[#0a0e17] border border-[#1e293b] rounded-xl text-[10px] font-mono text-emerald-400 leading-relaxed overflow-x-auto">
                        <code>{generatedDeployYaml}</code>
                      </pre>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>

          {/* --------------------------------------------------------------------------------- */}
          {/* PANEL 3 & 4: FORGE AI ENGINEER + ACTIONS (Right panel - 4 cols)                  */}
          {/* --------------------------------------------------------------------------------- */}
          {showAiPanel && (
            <div className="lg:col-span-4 bg-[#0e1424]/85 border border-[#1e293b] rounded-xl flex flex-col h-full overflow-hidden shadow-2xl relative">
            
            {/* AI Panels Tabs Selection Header */}
            <div className="flex border-b border-[#1e293b] bg-[#11192a] shrink-0 font-bold text-xs">
              {[
                { id: "actions", label: "Studio Actions", icon: Sparkles },
                { id: "prompts", label: "Prompt Lib", icon: BookOpen },
                { id: "chat", label: "AI Engineer Chat", icon: MessageSquare }
              ].map((aiTab) => {
                const isSel = aiPanelTab === aiTab.id;
                return (
                  <button
                    key={aiTab.id}
                    onClick={() => setAiPanelTab(aiTab.id as any)}
                    className={`flex-1 py-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                      isSel
                        ? "border-[#a855f7] bg-[#141b2d]/50 text-white"
                        : "border-transparent text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    <aiTab.icon className="w-3.5 h-3.5" />
                    {aiTab.label}
                  </button>
                );
              })}
            </div>

            {/* AI PANELS BODY */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-xs">
              
              {/* Studio Actions block */}
              {aiPanelTab === "actions" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-purple-950/10 border border-purple-900/30 rounded-xl">
                    <span className="text-[9px] uppercase font-black tracking-wider text-purple-400 block mb-1">Interactive Code Generators</span>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                      Instantly generate robust framework templates and write them directly into your active workspace directories with one click.
                    </p>
                  </div>

                  {/* Actions buttons layout grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {[
                      "Generate React Component",
                      "Generate Express Controller",
                      "Generate API Route",
                      "Generate Service",
                      "Generate Middleware",
                      "Generate Database Model",
                      "Generate Prisma Schema",
                      "Generate SQL Table",
                      "Generate Authentication",
                      "Generate CRUD",
                      "Generate Dockerfile",
                      "Generate README",
                      "Generate Unit Tests",
                      "Generate Integration Tests",
                      "Generate Environment Variables",
                      "Generate GitHub Workflow",
                      "Generate CI/CD Pipeline",
                      "Generate API Documentation"
                    ].map((action) => (
                      <button
                        key={action}
                        onClick={() => executeCodeAction(action)}
                        className="py-2 px-3 bg-[#11192a]/65 border border-[#1e293b]/80 hover:border-purple-500/60 text-slate-300 hover:text-white rounded-xl text-left font-bold transition-all flex items-center justify-between text-[10px]"
                      >
                        <span className="truncate">{action}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Project Generator: Multi-folder structural orchestration */}
                  <div className="pt-2 border-t border-[#1e293b]/60">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block mb-2.5">AI Project Generator</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { title: "CRUD System", desc: "Complete routers/schema" },
                        { title: "User Auth", desc: "JWT strategies modules" },
                        { title: "Client Dashboard", desc: "Analytics recharts screens" },
                        { title: "Entire Landing Page", desc: "Conversion heroes, footers" }
                      ].map((pg, idx) => (
                        <button
                          key={idx}
                          onClick={() => executeCodeAction(`Generate Entire ${pg.title}`)}
                          className="p-3 bg-gradient-to-br from-indigo-950/20 to-[#141b2d] border border-blue-900/30 hover:border-blue-500 rounded-xl text-left transition-all"
                        >
                          <span className="text-white font-bold block text-[10px]">{pg.title}</span>
                          <span className="text-[9px] text-[#94a3b8] mt-0.5 block">{pg.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Prompt Library panel */}
              {aiPanelTab === "prompts" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black text-[#475569] tracking-wider">Reusable Templates</span>
                    <button
                      onClick={() => setShowPromptCreator(!showPromptCreator)}
                      className="text-[#a855f7] hover:text-purple-400 font-bold text-[10px] flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Custom template
                    </button>
                  </div>

                  {/* Add Custom Prompt Form */}
                  <AnimatePresence>
                    {showPromptCreator && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-[#11192a] border border-[#1e293b] rounded-xl space-y-2.5"
                      >
                        <input
                          type="text"
                          placeholder="Template Name..."
                          value={newPromptName}
                          onChange={(e) => setNewPromptName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#141b2d] border border-[#1e293b] rounded text-[11px] text-white outline-none"
                        />
                        <textarea
                          placeholder="Complete instruction context..."
                          value={newPromptText}
                          onChange={(e) => setNewPromptText(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#141b2d] border border-[#1e293b] rounded text-[11px] text-white outline-none h-20 resize-none font-sans"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={saveCustomPrompt}
                            className="px-3 py-1 bg-[#a855f7] text-white font-bold rounded text-[10px]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowPromptCreator(false)}
                            className="px-3 py-1 bg-slate-800 hover:text-white rounded text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Reusable Templates list */}
                  <div className="space-y-3">
                    {customPrompts.map((cp) => (
                      <div
                        key={cp.id}
                        onClick={() => {
                          setChatInput(cp.prompt);
                          setAiPanelTab("chat");
                        }}
                        className="p-3 bg-[#11192a]/55 border border-[#1e293b]/80 hover:border-[#a855f7]/50 rounded-xl cursor-pointer text-left transition-all hover:bg-[#11192a]/70"
                      >
                        <span className="font-bold text-slate-100 block text-xs">{cp.name}</span>
                        <p className="text-[11px] text-[#94a3b8] mt-1 leading-normal">{cp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Assistant Chat block */}
              {aiPanelTab === "chat" && (
                <div className="flex flex-col h-[400px] overflow-hidden">
                  
                  {/* Conversations viewport */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {chatMessages.map((msg, i) => {
                      const isAi = msg.role === "assistant";
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-2xl text-left max-w-[85%] ${
                            isAi
                              ? "bg-[#11192a]/80 border border-[#1e293b]/70 mr-auto text-slate-100"
                              : "bg-[#a855f7]/15 border border-[#a855f7]/30 ml-auto text-white"
                          }`}
                        >
                          {/* Markdown parsing inline blocks */}
                          <div className="space-y-1.5 leading-relaxed text-[11px]">
                            {msg.content.split("\n").map((line, idx) => {
                              if (line.startsWith("```")) return null;
                              return <p key={idx}>{line}</p>;
                            })}
                          </div>
                          
                          <span className="text-[9px] text-slate-500 block mt-1 text-right">
                            {msg.timestamp}
                          </span>
                        </div>
                      );
                    })}

                    {isAiTyping && (
                      <div className="p-3 bg-[#11192a]/55 border border-[#1e293b] rounded-xl mr-auto flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                        <span className="text-[11px] text-slate-400 font-bold">Synthesizing solution block...</span>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Message composition input dock */}
                  <div className="pt-3 border-t border-[#1e293b] mt-2 flex gap-1.5 shrink-0">
                    <input
                      type="text"
                      placeholder="Ask lead architect..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendAiCommand()}
                      className="flex-1 px-3 py-2 bg-[#11192a] border border-[#1e293b] rounded-xl text-xs text-white focus:outline-none focus:border-[#a855f7]"
                    />
                    <button
                      onClick={() => sendAiCommand()}
                      className="p-2 bg-[#a855f7] hover:bg-purple-600 text-white rounded-xl transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
          )}

        </div>
      )}

    </div>
  );
}

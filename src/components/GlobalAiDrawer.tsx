import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ApiService } from "../api";
import { Project, User } from "../types";
import {
  X,
  Cpu,
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  FolderOpen,
  Code,
  LayoutTemplate,
  Database,
  Terminal,
  Activity,
  Bookmark
} from "lucide-react";

interface GlobalAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  user: Omit<User, "passwordHash">;
}

export default function GlobalAiDrawer({ isOpen, onClose, token, user }: GlobalAiDrawerProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [activeFile, setActiveFile] = useState<string>("");
  
  // Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string; timestamp: string }[]>([
    {
      role: "assistant",
      content: "Hello! I am your global CTO Architect Assistant. I am fully synchronized with all your Forge Brain projects, tech-stack blueprints, workspace codebases, and sprint metrics. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load projects list
  useEffect(() => {
    if (isOpen && token) {
      setIsLoadingProjects(true);
      ApiService.listProjects(token)
        .then((list) => {
          setProjects(list);
          if (list.length > 0) {
            setSelectedProjectId(list[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to list projects in AI assistant", err);
          setErrorMessage("Failed to load projects. Please try again.");
        })
        .finally(() => {
          setIsLoadingProjects(false);
        });
    }
  }, [isOpen, token]);

  // Load selected project details (to fetch blueprint and workspace files)
  useEffect(() => {
    if (token && selectedProjectId) {
      ApiService.getProjectDetails(selectedProjectId, token)
        .then((proj) => {
          setActiveProject(proj);
          // Set active file to first available code file if any
          if (proj.workspace?.codeFiles && Object.keys(proj.workspace.codeFiles).length > 0) {
            setActiveFile(Object.keys(proj.workspace.codeFiles)[0]);
          } else {
            setActiveFile("");
          }
          // Optionally load saved conversations if available
          if (proj.workspace?.aiConversations && proj.workspace.aiConversations.length > 0) {
            setChatMessages(proj.workspace.aiConversations);
          } else {
            // Reset to default greeting
            setChatMessages([
              {
                role: "assistant",
                content: `Hello! I am your global CTO Architect Assistant. I am fully synchronized with your active project "${proj.name}"'s tech-stack blueprint and current files workspace. How can I assist you with development, debugging, or code optimization today?`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            ]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch project details in AI assistant", err);
        });
    }
  }, [token, selectedProjectId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || !selectedProjectId) return;

    const userMsg = {
      role: "user" as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    if (!textToSend) setChatInput("");
    setIsAiTyping(true);
    setErrorMessage(null);

    try {
      // Build comprehensive context
      const techStack = activeProject?.blueprint?.techStack || {};
      const fileCode = activeFile && activeProject?.workspace?.codeFiles?.[activeFile]
        ? activeProject.workspace.codeFiles[activeFile]
        : "";

      const contextString = `[Global AI Assistant Context]
Active Project: "${activeProject?.name || "None"}"
Blueprint Tech-Stack: ${JSON.stringify(techStack)}
Current Workspace Sprint: "Sprint 1 (Active)"
Selected Active File: "${activeFile || "None"}"
${fileCode ? `Active File Code Content:\n\`\`\`\n${fileCode}\n\`\`\`` : "No code file actively selected."}`;

      const finalPrompt = `${contextString}\n\nUser Question/Request: ${text}`;

      const response = await ApiService.workspaceChat(selectedProjectId, {
        message: finalPrompt,
        history: chatMessages.map(m => ({ role: m.role, content: m.content }))
      }, token);

      const assistantMsg = {
        role: "assistant" as const,
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      const updatedHistory = [...nextMessages, assistantMsg];
      setChatMessages(updatedHistory);

      // Persist conversation history to the project workspace
      if (activeProject) {
        const updatedWorkspace = {
          ...(activeProject.workspace || {}),
          aiConversations: updatedHistory
        };
        ApiService.saveWorkspace(selectedProjectId, updatedWorkspace, token)
          .then(() => {
            // Update local state to sync
            setActiveProject({
              ...activeProject,
              workspace: updatedWorkspace
            });
          })
          .catch((err) => console.error("Failed to save workspace convo history", err));
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to reach AI compiler node.");
      setChatMessages([...nextMessages, {
        role: "assistant",
        content: `Error: Unable to load model response. using developer offline mode simulation. Error details: ${err.message || err}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const executeQuickAction = (action: string) => {
    let prompt = "";
    if (!activeFile) {
      prompt = `Run quick action: "${action}". Let's discuss general modern software architecture patterns or select a project code file above to perform operations!`;
    } else {
      const codeLen = activeProject?.workspace?.codeFiles?.[activeFile]?.length || 0;
      if (codeLen === 0) {
        prompt = `Run quick action: "${action}" on active file "${activeFile}". Since the file is empty, let's generate a robust template/starter code block for it!`;
      } else {
        switch (action) {
          case "Explain Code":
            prompt = `Explain the design pattern, components, and general architecture of the code in active file "${activeFile}" step-by-step. Keep it readable and highly technical.`;
            break;
          case "Generate Component":
            prompt = `Generate a fully optimized frontend component related to our blueprint tech stack that can accompany or integrate with "${activeFile}". Maintain styling standards.`;
            break;
          case "Generate API":
            prompt = `Design and generate a highly secure Express REST API controller endpoint blueprint or database repository logic that interfaces with "${activeFile}".`;
            break;
          case "Fix Bug":
            prompt = `Carefully review active file "${activeFile}" for syntax errors, potential logical flaws, performance bottlenecks, and edge-case exceptions. Highlight the fixes.`;
            break;
          case "Optimize Code":
            prompt = `Optimize active file "${activeFile}" for performance, redundant executions, better variable scopes, memory footprint, and visual responsiveness. Provide the optimized code.`;
            break;
          case "Generate Tests":
            prompt = `Generate comprehensive unit and integration test specs (e.g. using Jest or Vitest) to achieve 100% test coverage for the code in "${activeFile}".`;
            break;
          default:
            prompt = `Execute action "${action}" on file "${activeFile}".`;
        }
      }
    }
    handleSendMessage(prompt);
  };

  const handleClearHistory = async () => {
    if (!selectedProjectId || !activeProject) return;
    const confirmClear = window.confirm("Are you sure you want to clear conversation history for this project?");
    if (!confirmClear) return;

    try {
      const updatedWorkspace = {
        ...(activeProject.workspace || {}),
        aiConversations: []
      };
      await ApiService.saveWorkspace(selectedProjectId, updatedWorkspace, token);
      setChatMessages([
        {
          role: "assistant",
          content: "Conversation history cleared. I am ready to start a new developer session!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setActiveProject({
        ...activeProject,
        workspace: updatedWorkspace
      });
    } catch (err) {
      console.error("Failed to clear chat history", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          {/* Sliding Panel */}
          <motion.div
            id="global-ai-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[480px] z-50 bg-[#0c1220]/95 border-l border-[#1e293b] shadow-2xl flex flex-col backdrop-blur-lg"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#1e293b] flex justify-between items-center bg-[#11192a]/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#a855f7]/10 rounded-lg border border-[#a855f7]/30">
                  <Sparkles className="w-5 h-5 text-[#a855f7]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">CTO solutions assistant</h2>
                  <p className="text-[10px] text-[#94a3b8]">Project & Workspace Blueprint Engine</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[#1e293b] text-[#94a3b8] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context & Selection Header */}
            <div className="p-3.5 bg-[#141b2d]/50 border-b border-[#1e293b] space-y-3 shrink-0">
              {/* Project selector row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Linked Architecture Project</label>
                {isLoadingProjects ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>Loading secure projects list...</span>
                  </div>
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#090d16] border border-[#1e293b] hover:border-purple-500/50 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {projects.length === 0 ? (
                      <option value="">No Active Projects Registered</option>
                    ) : (
                      projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          📁 {p.name}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>

              {activeProject && (
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#090d16]/60 p-2.5 rounded-lg border border-[#1e293b]/50">
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase text-[#475569] font-bold block">Blueprint Tech Stack</span>
                    <div className="flex flex-col text-slate-300 gap-0.5 font-mono">
                      <span className="truncate">🎨 {activeProject.blueprint?.techStack?.frontend || "React"}</span>
                      <span className="truncate">⚙️ {activeProject.blueprint?.techStack?.backend || "Node"}</span>
                      <span className="truncate">🗄️ {activeProject.blueprint?.techStack?.database || "Postgres"}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] uppercase text-[#475569] font-bold block">Workspace Focus</span>
                    <span className="text-[8px] uppercase font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded inline-block mb-1">
                      Sprint 1 Active
                    </span>
                    <select
                      value={activeFile}
                      onChange={(e) => setActiveFile(e.target.value)}
                      className="w-full px-2 py-1 bg-[#0c1220] border border-[#1e293b] rounded text-[10px] text-white focus:outline-none focus:border-purple-500 font-mono transition-colors"
                    >
                      {activeProject.workspace?.codeFiles && Object.keys(activeProject.workspace.codeFiles).length > 0 ? (
                        Object.keys(activeProject.workspace.codeFiles).map((file) => (
                          <option key={file} value={file}>
                            📄 {file}
                          </option>
                        ))
                      ) : (
                        <option value="">No Files Available</option>
                      )}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="p-3 bg-[#0f172a]/30 border-b border-[#1e293b]/60 shrink-0">
              <span className="text-[9px] uppercase font-black text-[#475569] tracking-wider block mb-2">Workspace Quick Actions</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  "Explain Code",
                  "Generate Component",
                  "Generate API",
                  "Fix Bug",
                  "Optimize Code",
                  "Generate Tests"
                ].map((act) => (
                  <button
                    key={act}
                    onClick={() => executeQuickAction(act)}
                    disabled={!selectedProjectId}
                    className="py-1 px-1.5 bg-[#11192a] hover:bg-[#1e293b] border border-[#1e293b] hover:border-purple-500/50 disabled:opacity-50 disabled:pointer-events-none text-[9px] text-slate-300 hover:text-white rounded text-center truncate font-semibold transition-all cursor-pointer"
                  >
                    {act === "Explain Code" && "📝 "}
                    {act === "Generate Component" && "🧩 "}
                    {act === "Generate API" && "⚙️ "}
                    {act === "Fix Bug" && "🐛 "}
                    {act === "Optimize Code" && "🚀 "}
                    {act === "Generate Tests" && "🧪 "}
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#080c14]/40 relative">
              {chatMessages.map((msg, i) => {
                const isAi = msg.role === "assistant";
                return (
                  <div key={i} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[88%] rounded-xl p-3 text-[11px] leading-relaxed relative ${
                      isAi 
                        ? "bg-[#11192a] text-slate-200 border border-[#1e293b]" 
                        : "bg-purple-600 text-white rounded-tr-none shadow-lg"
                    }`}>
                      <div className="flex justify-between items-center mb-1 text-[9px] font-bold text-[#475569] gap-4">
                        <span className={isAi ? "text-[#a855f7]" : "text-purple-200"}>{isAi ? "CTO ARCHITECT" : "DEVELOPER"}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                    </div>
                  </div>
                );
              })}

              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#11192a] text-slate-300 border border-[#1e293b] rounded-xl p-3 text-[11px] flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 animate-spin text-[#a855f7]" />
                    <span className="italic animate-pulse">Compiling workspace model context...</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested Prompts Pills Row */}
            {activeProject && (
              <div className="px-4 py-2 bg-[#11192a]/20 border-t border-[#1e293b]/40 overflow-x-auto whitespace-nowrap shrink-0 scrollbar-none flex gap-1.5">
                {[
                  "Explain my current blueprint",
                  "Give me a security review",
                  "Suggest performance improvements",
                  "How to scale my database design?"
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="py-1 px-2.5 bg-[#141b2d]/80 hover:bg-purple-950/20 border border-[#1e293b] hover:border-purple-500/50 rounded-full text-[10px] text-slate-300 hover:text-white font-medium transition-colors cursor-pointer inline-block"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div className="p-4 border-t border-[#1e293b] bg-[#11192a]/50 flex items-center gap-2 shrink-0">
              <button
                onClick={handleClearHistory}
                title="Clear Session Conversation"
                className="p-2 bg-[#141b2d] border border-[#1e293b] hover:border-red-500/30 text-[#94a3b8] hover:text-red-400 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Trash2Icon />
              </button>
              
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                disabled={isAiTyping || !selectedProjectId}
                placeholder={selectedProjectId ? "Ask CTO Assistant anything..." : "Select active project first..."}
                className="flex-1 px-3 py-2 bg-[#090d16] border border-[#1e293b] focus:border-purple-500 text-xs text-white rounded-lg focus:outline-none transition-colors placeholder:text-slate-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isAiTyping || !chatInput.trim() || !selectedProjectId}
                className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Inline Trash icon wrapper to prevent direct custom SVG imports or missing exports
function Trash2Icon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ApiService } from "../api";
import ProjectDetailPanel from "./ProjectDetailPanel";
import {
  Plus,
  FolderOpen,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Trash2,
  TrendingUp,
  X,
  Play,
  Loader2,
  Brain,
} from "lucide-react";
import { Project, User } from "../types";

interface DashboardViewProps {
  user: Omit<User, "passwordHash">;
  token: string;
  onNotificationsTrigger: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DashboardView({
  user,
  token,
  onNotificationsTrigger,
  activeTab,
  onTabChange,
}: DashboardViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Error/Success state managers
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New project modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjCategory, setNewProjCategory] = useState("SaaS Productivity");
  const [newProjDate, setNewProjDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const list = await ApiService.listProjects(token);
      setProjects(list);

      // Maintain selected project if we are in detail view
      if (selectedProject) {
        const updated = list.find((p: Project) => p.id === selectedProject.id);
        if (updated) {
          setSelectedProject(updated);
        }
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  // Handle URL change or outer state routing
  useEffect(() => {
    if (activeTab === "dashboard") {
      setSelectedProject(null);
    } else if (activeTab.startsWith("analytics_")) {
      const pId = activeTab.replace("analytics_", "");
      const matched = projects.find((p) => p.id === pId);
      if (matched) {
        setSelectedProject(matched);
      }
    }
  }, [activeTab]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newProjName || !newProjDesc || !newProjDate) {
      setErrorMessage("Please populate all fields to initialize blueprint.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await ApiService.createProject(
        {
          name: newProjName,
          description: newProjDesc,
          category: newProjCategory,
          targetLaunchDate: newProjDate,
        },
        token
      );

      // Clean form state
      setNewProjName("");
      setNewProjDesc("");
      setNewProjCategory("SaaS Productivity");
      setNewProjDate("");
      setShowCreateModal(false);
      setSuccessMessage("Launchpad initialized successfully.");

      // Reload
      await fetchProjects();
      onNotificationsTrigger();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize launchpad.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMessage(null);
    try {
      const updated = await ApiService.launchProject(id, token);
      await fetchProjects();
      onNotificationsTrigger();
      // automatically switch to analytics view on launch!
      onTabChange(`analytics_${id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to launch project.");
    }
  };

  const handleTriggerDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setErrorMessage(null);
    try {
      await ApiService.deleteProject(deleteConfirmId, token);
      if (selectedProject?.id === deleteConfirmId) {
        setSelectedProject(null);
      }
      setDeleteConfirmId(null);
      setSuccessMessage("Project blueprint deleted successfully.");
      await fetchProjects();
      onNotificationsTrigger();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete project.");
      setDeleteConfirmId(null);
    }
  };

  // Filters
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  if (selectedProject) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <ProjectDetailPanel
          project={selectedProject}
          token={token}
          onUpdateProject={(updated) => {
            setSelectedProject(updated);
            // Sync with projects array
            setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
          }}
          onBack={() => {
            setSelectedProject(null);
            onTabChange("dashboard");
          }}
          onNotificationsTrigger={onNotificationsTrigger}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-left font-sans">
      {/* State notifications */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900 text-red-400 text-xs flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="hover:text-white font-bold text-sm leading-none">&times;</button>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/20 border border-emerald-900 text-emerald-400 text-xs flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="hover:text-white font-bold text-sm leading-none">&times;</button>
        </div>
      )}

      {/* Header section with telemetry summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-[#141b2d]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Founder Launchpad</h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Analyze execution scopes, complete AI security checkposts, and launch SaaS platforms.
          </p>
        </div>

        <button
          id="btn-new-project"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-[#3b82f6]/10"
        >
          <Plus className="w-4 h-4" />
          Initialize Launchpad
        </button>
      </div>

      {/* Main launchpads list */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input
            type="text"
            placeholder="Search active project specifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#141b2d] border border-[#1e293b] rounded-lg text-xs text-white placeholder-[#475569] focus:outline-none focus:border-[#3b82f6]"
          />
        </div>
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
          <span className="text-xs text-[#94a3b8]">Interrogating backend storage repositories...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#141b2d] border border-[#1e293b]">
          <FolderOpen className="w-12 h-12 text-[#475569] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white mb-1">Zero launchpads present</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto leading-relaxed mb-6">
            You haven't defined any product specs yet. Generate your first AI-powered launch strategy now.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-lg transition-all"
          >
            Create Project Launchpad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const completedCount = p.checklist.filter((item) => item.completed).length;
            const totalCount = p.checklist.length;
            return (
              <div
                key={p.id}
                id={`project-card-${p.id}`}
                onClick={() => setSelectedProject(p)}
                className="p-5 rounded-xl bg-[#141b2d] border border-[#1e293b] hover:border-[#334155] hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-[#1e293b] text-[#3b82f6] border border-[#3b82f6]/20">
                      {p.category}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                      p.status === "launched" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 truncate">{p.name}</h3>
                  <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed mb-4">{p.description}</p>
                </div>

                <div>
                  {/* Progress Meter */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-[10px] text-[#94a3b8] mb-1">
                      <span>Ready Metrics</span>
                      <span className="font-bold text-white">{p.score}%</span>
                    </div>
                    <div className="w-full bg-[#0e1424] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#3b82f6] h-1.5 rounded-full transition-all duration-300" style={{ width: `${p.score}%` }} />
                    </div>
                    <span className="text-[9px] text-[#475569] block mt-1">{completedCount}/{totalCount} checkpoints cleared</span>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-[10px] text-[#475569] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.targetLaunchDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {p.status === "building" && (
                        <button
                          id={`btn-launch-${p.id}`}
                          onClick={(e) => handleLaunchProject(p.id, e)}
                          title="Launch project to live status"
                          className="p-1.5 rounded bg-emerald-950/45 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      {p.status === "launched" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTabChange(`analytics_${p.id}`);
                          }}
                          title="View telemetry dashboard"
                          className="p-1.5 rounded bg-[#1e293b] hover:bg-[#334155] text-[#60a5fa] transition-colors border border-[#334155]"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTabChange("forge_brain");
                        }}
                        title="Open Forge Brain Architecture Blueprint"
                        className="p-1.5 rounded bg-blue-950/45 hover:bg-blue-900 border border-blue-800 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleTriggerDelete(p.id, e)}
                        title="Delete project blueprint"
                        className="p-1.5 rounded bg-red-950/45 hover:bg-red-900 border border-red-800 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guided Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] shadow-2xl text-left"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#1e293b]">
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#3b82f6]" />
                  Initialize AI Launchpad
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-[#1e293b] rounded text-[#94a3b8] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-900 text-red-400 text-xs flex justify-between items-center">
                    <span>{errorMessage}</span>
                    <button type="button" onClick={() => setErrorMessage(null)} className="hover:text-white font-bold text-sm leading-none">&times;</button>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#475569] mb-1">Product / Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DocSummarizer AI"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#475569] mb-1">Launch Category</label>
                  <select
                    value={newProjCategory}
                    onChange={(e) => setNewProjCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                  >
                    <option value="SaaS Productivity">SaaS Productivity & Tools</option>
                    <option value="AI Developer Tools">AI & Developer Tools</option>
                    <option value="Web3 & Crypto">Web3 & Decentralized Platforms</option>
                    <option value="E-commerce SaaS">E-commerce & Business Operations</option>
                    <option value="Social & Community">Social Networks & Communities</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#475569] mb-1">Target Launch Date</label>
                  <input
                    type="date"
                    required
                    value={newProjDate}
                    onChange={(e) => setNewProjDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-[#3b82f6]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#475569] mb-1">Product Description & Specs</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide a detailed overview. Our Gemini engine parses this description to yield fine-grained checklists, security controls, and growth strategies."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Parsing specifications via Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Assemble AI Strategy Checklist
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b0f19]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] shadow-2xl text-left"
            >
              <h3 className="text-base font-bold text-white mb-2">Confirm Deletion</h3>
              <p className="text-xs text-[#94a3b8] mb-6 leading-relaxed">
                Are you absolutely sure you want to delete this launch pad? This action is irreversible and all blueprints will be deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-xs font-semibold text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded-lg transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

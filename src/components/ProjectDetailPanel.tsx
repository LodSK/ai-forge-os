import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { ApiService } from "../api";
import {
  CheckSquare,
  Square,
  Sparkles,
  TrendingUp,
  FileUp,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Paperclip,
  CheckCircle,
} from "lucide-react";
import { Project, ChecklistItem, RoadmapPhase } from "../types";

interface ProjectDetailPanelProps {
  project: Project;
  token: string;
  onUpdateProject: (updated: Project) => void;
  onBack: () => void;
  onNotificationsTrigger: () => void;
}

export default function ProjectDetailPanel({
  project,
  token,
  onUpdateProject,
  onBack,
  onNotificationsTrigger,
}: ProjectDetailPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"checklist" | "roadmap" | "growth" | "assets">("checklist");
  const [checklistFilter, setChecklistFilter] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter items
  const filteredChecklist = project.checklist.filter((item) => {
    if (checklistFilter === "all") return true;
    return item.category === checklistFilter;
  });

  // Toggle checklist item
  const handleToggleItem = async (itemId: string, currentCompleted: boolean) => {
    try {
      const updated = await ApiService.updateChecklistItem(project.id, itemId, !currentCompleted, token);
      onUpdateProject(updated);
      onNotificationsTrigger(); // trigger unread notifications reload
    } catch (e) {
      console.error(e);
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Upload file logic
  const handleUploadFile = async (file: File) => {
    setIsLoadingFile(true);
    setErrorMessage(null);
    try {
      const result = await ApiService.uploadFile(project.id, file, token);
      onUpdateProject(result.project);
      onNotificationsTrigger();
    } catch (e: any) {
      setErrorMessage(e.message || "File upload failed.");
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "tech":
        return "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20";
      case "marketing":
        return "text-pink-400 bg-pink-400/10 border-pink-400/20";
      case "legal":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "operations":
        return "text-purple-400 bg-purple-400/10 border-purple-400/20";
      default:
        return "text-[#94a3b8] bg-[#1e293b] border-[#334155]";
    }
  };

  return (
    <div className="text-left font-sans">
      {/* Detail Header breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] mb-6">
        <button onClick={onBack} className="hover:text-white transition-colors">Launchpads</button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white font-bold">{project.name}</span>
      </div>

      {/* Project Overview Card */}
      <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        {/* Abstract background flare */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#3b82f6]/5 blur-3xl rounded-full pointer-events-none" />

        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <h2 className="text-2xl font-black text-white">{project.name}</h2>
            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded border ${
              project.status === "launched" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-amber-400 bg-amber-400/10 border-amber-400/20"
            }`}>
              {project.status}
            </span>
            <span className="text-xs text-[#94a3b8] px-2 py-0.5 rounded bg-[#1e293b] border border-[#334155]">
              {project.category}
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] max-w-xl leading-relaxed mb-4">{project.description}</p>
          <div className="flex items-center gap-4 text-xs text-[#475569]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
              Target: {new Date(project.targetLaunchDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        {/* Big AI Launch Score */}
        <div className="w-full lg:w-fit p-5 rounded-lg bg-[#0e1424] border border-[#1e293b] flex items-center gap-4 shrink-0">
          <div className="relative flex items-center justify-center">
            {/* SVG circle meter */}
            <svg className="w-16 h-16 transform -rotate-9xl">
              <circle cx="32" cy="32" r="28" className="stroke-[#1e293b] stroke-[4px] fill-none" />
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-[#3b82f6] stroke-[4px] fill-none transition-all duration-300"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * project.score) / 100}
              />
            </svg>
            <span className="absolute text-base font-black text-white">{project.score}%</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-0.5">Readiness Rating</p>
            <p className="text-xs text-[#475569] max-w-[150px] leading-tight">Increase score by completing checklist tasks.</p>
          </div>
        </div>
      </div>

      {/* Sub tabs selection */}
      <div className="border-b border-[#141b2d] flex items-center gap-1.5 mb-6 overflow-x-auto pb-px">
        {[
          { id: "checklist", label: "Launch Checklist", icon: CheckSquare },
          { id: "roadmap", label: "Product Roadmap", icon: Layers },
          { id: "growth", label: "AI Growth Hacks", icon: Sparkles },
          { id: "assets", label: "Uploaded Assets", icon: Paperclip },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === tab.id
                ? "border-[#3b82f6] text-[#3b82f6] bg-[#141b2d]/50"
                : "border-transparent text-[#94a3b8] hover:text-white"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-[#141b2d] border border-[#1e293b] rounded-xl p-6 shadow-xl min-h-[300px]">
        {/* CHECKLIST PANEL */}
        {activeSubTab === "checklist" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-[#1e293b]">
              <div>
                <h3 className="text-sm font-bold text-white">Execution Checklist</h3>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">Check off completed components to update launch score.</p>
              </div>

              {/* Checklist Category Filter Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {["all", "tech", "marketing", "legal", "operations", "general"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setChecklistFilter(cat)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border transition-all uppercase ${
                      checklistFilter === cat
                        ? "bg-[#3b82f6] text-white border-transparent"
                        : "bg-[#0e1424] text-[#94a3b8] border-[#1e293b] hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredChecklist.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#475569]">
                No checklist tasks match the active filters.
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredChecklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id, item.completed)}
                    className={`p-4 rounded-lg bg-[#0e1424] border transition-all cursor-pointer flex items-start gap-4 hover:border-[#334155] ${
                      item.completed ? "border-emerald-950/40 opacity-70" : "border-[#1e293b]"
                    }`}
                  >
                    <button className="shrink-0 text-[#3b82f6] mt-0.5">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Square className="w-5 h-5 text-[#475569]" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold ${item.completed ? "line-through text-[#475569]" : "text-white"}`}>
                          {item.title}
                        </span>
                        <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-semibold shrink-0 ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${item.completed ? "line-through text-[#475569]" : "text-[#94a3b8]"}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ROADMAP PANEL */}
        {activeSubTab === "roadmap" && (
          <div>
            <div className="mb-6 pb-4 border-b border-[#1e293b]">
              <h3 className="text-sm font-bold text-white">SaaS Launch Milestones</h3>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">Structured temporal phases customized by Gemini.</p>
            </div>

            <div className="space-y-6">
              {project.roadmap.map((phase) => (
                <div key={phase.id} className="relative pl-6 border-l-2 border-[#1e293b] last:border-l-0">
                  <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-[#3b82f6]" />
                  <div className="p-4 rounded-lg bg-[#0e1424] border border-[#1e293b]">
                    <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                      <span className="text-xs font-bold text-white">{phase.title}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                        phase.status === "completed" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                        phase.status === "current" ? "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20" :
                        "text-[#475569] bg-[#1e293b] border-[#334155]"
                      }`}>
                        {phase.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mb-3 leading-relaxed">{phase.description}</p>
                    <ul className="space-y-2">
                      {phase.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                          <div className="w-1.5 h-1.5 bg-[#475569] rounded-full shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROWTH HACKS PANEL */}
        {activeSubTab === "growth" && (
          <div>
            <div className="mb-6 pb-4 border-b border-[#1e293b]">
              <h3 className="text-sm font-bold text-white">Gemini Growth Recommendations</h3>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">Viral distribution vectors, marketing shortcuts, and community seeds.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.aiSuggestions.map((hack, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-[#0e1424] border border-[#1e293b] flex items-start gap-3">
                  <div className="p-2 bg-[#3b82f6]/10 rounded-lg text-[#3b82f6] border border-[#3b82f6]/20 shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Growth Hack #{idx + 1}</h4>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">{hack}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ASSETS PANEL */}
        {activeSubTab === "assets" && (
          <div>
            <div className="mb-6 pb-4 border-b border-[#1e293b]">
              <h3 className="text-sm font-bold text-white">Technical & Pitch Assets</h3>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">Upload product specifications, design screens, or pitch documents.</p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/20 border border-red-900 text-red-400 text-xs flex justify-between items-center">
                <span>{errorMessage}</span>
                <button onClick={() => setErrorMessage(null)} className="hover:text-white font-bold text-sm leading-none">&times;</button>
              </div>
            )}

            {/* Drag and Drop File Uploader */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all mb-6 ${
                dragActive ? "border-[#3b82f6] bg-[#3b82f6]/5" : "border-[#1e293b] hover:border-[#334155]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              {isLoadingFile ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
                  <span className="text-xs text-white">Transmitting file to sandbox filesystem...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <FileUp className="w-8 h-8 text-[#94a3b8] mb-3" />
                  <p className="text-xs text-white font-bold mb-1">Drag assets here or click to browse</p>
                  <p className="text-[10px] text-[#475569]">Supports images, PDF, ZIP, markdown (up to 10MB)</p>
                </div>
              )}
            </div>

            {/* Uploaded Files Directory */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Stored Repository Files</h4>
              {(!project.fileUrls || project.fileUrls.length === 0) ? (
                <div className="p-4 text-center text-xs text-[#475569] bg-[#0e1424] border border-[#1e293b] rounded-lg">
                  No files uploaded. Drag a file above to begin.
                </div>
              ) : (
                project.fileUrls.map((url, idx) => {
                  const parts = url.split("/");
                  const filename = parts[parts.length - 1];
                  return (
                    <div key={idx} className="p-3 bg-[#0e1424] border border-[#1e293b] rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Paperclip className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span className="text-white font-semibold truncate max-w-[180px]">{filename}</span>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-[#3b82f6] hover:underline"
                      >
                        Download Asset
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

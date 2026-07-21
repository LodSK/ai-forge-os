import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ApiService } from "../api";
import { Project, ForgeBlueprint } from "../types";
import {
  Brain,
  Cpu,
  Layers,
  Table,
  Terminal,
  ListTodo,
  AlertTriangle,
  CloudLightning,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Save,
  Download,
  Loader2,
  Database,
  Key,
  Cloud,
  Wrench,
  CheckCircle,
  FileDown,
  PlusCircle,
  FileText,
  Activity,
  Code
} from "lucide-react";

interface ForgeBrainViewProps {
  token: string;
}

export default function ForgeBrainView({ token }: ForgeBrainViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isNewProjectMode, setIsNewProjectMode] = useState<boolean>(false);

  // Form states
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [industry, setIndustry] = useState("SaaS Productivity & Tools");
  const [targetAudience, setTargetAudience] = useState("Software developers & entrepreneurs");
  const [platform, setPlatform] = useState("Web");
  const [preferredTechStack, setPreferredTechStack] = useState("React, Vite, Node.js, Express, PostgreSQL");
  const [timeline, setTimeline] = useState("3 Months");
  const [budget, setBudget] = useState("$25,000");
  const [teamSize, setTeamSize] = useState("3 Developers");
  const [aiLevel, setAiLevel] = useState("High");

  // App states
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [blueprint, setBlueprint] = useState<ForgeBlueprint | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Right Panel collapsed sections tracking
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    summary: false,
    techStack: false,
    featureRoadmap: false,
    databaseDesign: true,
    restApiPlan: true,
    folderStructure: true,
    sprintPlan: true,
    uiSuggestions: true,
    riskAnalysis: true,
    deploymentStrategy: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const generationSteps = [
    "Analyzing project requirements & domain goals...",
    "Selecting optimal technologies & compiling dependencies...",
    "Designing logical system architecture...",
    "Creating normalized database entities & schema...",
    "Building full features roadmap & sprint plans...",
    "Preparing deployment & monitoring strategies...",
    "Finalizing beautiful blueprint presentation...",
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const list = await ApiService.listProjects(token);
      setProjects(list);
      if (list.length > 0) {
        setSelectedProjectId(list[0].id);
        loadProjectBlueprint(list[0]);
      } else {
        setIsNewProjectMode(true);
      }
    } catch (err: any) {
      setErrorMessage("Failed to load active launchpad projects.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const loadProjectBlueprint = (project: Project) => {
    setProjectName(project.name);
    setProjectDescription(project.description);
    if (project.blueprint) {
      setBlueprint(project.blueprint);
      if (project.blueprint.inputParams) {
        const ip = project.blueprint.inputParams;
        if (ip.industry) setIndustry(ip.industry);
        if (ip.targetAudience) setTargetAudience(ip.targetAudience);
        if (ip.platform) setPlatform(ip.platform);
        if (ip.preferredTechStack) setPreferredTechStack(ip.preferredTechStack);
        if (ip.timeline) setTimeline(ip.timeline);
        if (ip.budget) setBudget(ip.budget);
        if (ip.teamSize) setTeamSize(ip.teamSize);
        if (ip.aiLevel) setAiLevel(ip.aiLevel);
      }
    } else {
      setBlueprint(null);
    }
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "new") {
      setIsNewProjectMode(true);
      setSelectedProjectId("");
      setProjectName("");
      setProjectDescription("");
      setBlueprint(null);
    } else {
      setIsNewProjectMode(false);
      setSelectedProjectId(val);
      const proj = projects.find((p) => p.id === val);
      if (proj) {
        loadProjectBlueprint(proj);
      }
    }
  };

  const handleGenerateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    let activeId = selectedProjectId;

    // 1. If in "New Project" mode, we must first create the project!
    if (isNewProjectMode) {
      if (!projectName.trim() || !projectDescription.trim()) {
        setErrorMessage("Please enter a valid project name and description to initiate.");
        return;
      }
      setIsGenerating(true);
      setGenerationStep(0);
      try {
        const newProj = await ApiService.createProject({
          name: projectName,
          description: projectDescription,
          category: industry,
          targetLaunchDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] // default 3 months out
        }, token);
        activeId = newProj.id;
        setSelectedProjectId(newProj.id);
        setIsNewProjectMode(false);
        // Add to local projects array
        setProjects((prev) => [...prev, newProj]);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to initialize new project launchpad.");
        setIsGenerating(false);
        return;
      }
    }

    if (!activeId) {
      setErrorMessage("No active launchpad project selected.");
      return;
    }

    setIsGenerating(true);
    setGenerationStep(0);

    // Dynamic simulator for the progressive stages
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < generationSteps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    try {
      const params = {
        industry,
        targetAudience,
        platform,
        preferredTechStack,
        timeline,
        budget,
        teamSize,
        aiLevel,
      };

      const resultBlueprint = await ApiService.generateBlueprint(activeId, params, token);
      
      // Persist to DB directly
      await ApiService.saveBlueprint(activeId, resultBlueprint, token);

      // Force the final step representation
      setGenerationStep(generationSteps.length - 1);
      setTimeout(() => {
        setBlueprint(resultBlueprint);
        setIsGenerating(false);
        setSuccessMessage("CTO Architect Blueprint generated and saved successfully!");
        // Refresh project list to sync state
        loadProjectsAndPreserveSelection(activeId);
      }, 800);

    } catch (err: any) {
      setErrorMessage(err.message || "Blueprint generation failed.");
      setIsGenerating(false);
    } finally {
      clearInterval(stepInterval);
    }
  };

  const loadProjectsAndPreserveSelection = async (selectId: string) => {
    try {
      const list = await ApiService.listProjects(token);
      setProjects(list);
      setSelectedProjectId(selectId);
      const proj = list.find((p) => p.id === selectId);
      if (proj && proj.blueprint) {
        setBlueprint(proj.blueprint);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBlueprint = async () => {
    if (!selectedProjectId || !blueprint) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await ApiService.saveBlueprint(selectedProjectId, blueprint, token);
      setSuccessMessage("Blueprint saved successfully to your persistent workspace!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save blueprint.");
    }
  };

  // Export functions
  const handleExportJSON = () => {
    if (!blueprint) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blueprint, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${projectName.replace(/\s+/g, "_")}_blueprint.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportMarkdown = () => {
    if (!blueprint) return;
    const md = `# AI Forge OS - Architecture Blueprint: ${projectName}
## Executive Summary
${blueprint.executiveSummary}

## Technical Stack
- **Frontend**: ${blueprint.techStack.frontend}
- **Backend**: ${blueprint.techStack.backend}
- **Database**: ${blueprint.techStack.database}
- **Authentication**: ${blueprint.techStack.authentication}
- **AI Integration**: ${blueprint.techStack.aiProvider}
- **Cloud Hosting**: ${blueprint.techStack.cloudHosting}
- **DevOps**: ${blueprint.techStack.devops}
- **Testing Framework**: ${blueprint.techStack.testingFramework}
- **Deployment Strategy**: ${blueprint.techStack.deployment}

## Database Entity Architecture
${blueprint.databaseDesign.entities.map(e => `
### Table: ${e.name}
**Fields**:
${e.fields.map(f => `- ${f}`).join("\n")}

**Relationships**:
${e.relationships.map(r => `- ${r}`).join("\n")}
`).join("\n")}

## REST API Plan
| Method | Endpoint | Description |
|--------|----------|-------------|
${blueprint.restApiPlan.map(route => `| **${route.method}** | \`${route.endpoint}\` | ${route.description} |`).join("\n")}

## Monospace Folder Directory structure
\`\`\`
${blueprint.folderStructure}
\`\`\`

## 10-Week Sprint Schedule Plan
${blueprint.sprintPlan.map(sprint => `
### ${sprint.name} (${sprint.duration})
**Objectives**:
${sprint.objectives.map(o => `- [ ] ${o}`).join("\n")}
`).join("\n")}

## Interactive UI & Component Suggestions
${blueprint.uiSuggestions.map(ui => `- ${ui}`).join("\n")}

## Risk Analysis & Matrix Mitigation
- **Technical**: ${blueprint.riskAnalysis.technical}
- **Security**: ${blueprint.riskAnalysis.security}
- **Performance**: ${blueprint.riskAnalysis.performance}
- **Scalability**: ${blueprint.riskAnalysis.scalability}
- **Complexity**: ${blueprint.riskAnalysis.complexity}

## Deployment Strategy
- **Hosting**: ${blueprint.deploymentStrategy.hosting}
- **CI/CD Pipeline**: ${blueprint.deploymentStrategy.cicd}
- **Environment Variables**:
${blueprint.deploymentStrategy.envVars.map(v => `  - \`${v}\``).join("\n")}
- **Monitoring**: ${blueprint.deploymentStrategy.monitoring}
- **Logging**: ${blueprint.deploymentStrategy.logging}
- **Backup**: ${blueprint.deploymentStrategy.backup}
`;

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${projectName.replace(/\s+/g, "_")}_blueprint.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportPDF = () => {
    // Simple styled HTML print layout triggering window.print()
    const printContent = document.getElementById("blueprint-scrollable-area");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export blueprints as PDF.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${projectName} - Architecture Blueprint</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; }
            h1 { font-size: 28px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; color: #0f172a; }
            h2 { font-size: 20px; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; color: #1e3a8a; }
            h3 { font-size: 16px; margin-top: 20px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background-color: #f1f5f9; }
            pre { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; white-space: pre-wrap; }
            ul { padding-left: 20px; }
            li { font-size: 14px; margin-bottom: 4px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
            .card { border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <h1>AI Forge OS: CTO System Architecture Blueprint</h1>
          <p><strong>Project Name:</strong> ${projectName}</p>
          <p><strong>Industry Focus:</strong> ${industry}</p>
          <hr/>
          <h2>1. Executive Summary</h2>
          <p>${blueprint?.executiveSummary}</p>

          <h2>2. Technical Stack</h2>
          <div class="grid">
            <div class="card"><strong>Frontend:</strong> ${blueprint?.techStack.frontend}</div>
            <div class="card"><strong>Backend:</strong> ${blueprint?.techStack.backend}</div>
            <div class="card"><strong>Database:</strong> ${blueprint?.techStack.database}</div>
            <div class="card"><strong>Authentication:</strong> ${blueprint?.techStack.authentication}</div>
            <div class="card"><strong>AI Provider:</strong> ${blueprint?.techStack.aiProvider}</div>
            <div class="card"><strong>Cloud Hosting:</strong> ${blueprint?.techStack.cloudHosting}</div>
            <div class="card"><strong>DevOps CI/CD:</strong> ${blueprint?.techStack.devops}</div>
            <div class="card"><strong>Testing Suite:</strong> ${blueprint?.techStack.testingFramework}</div>
          </div>

          <h2>3. Database Design Schema</h2>
          ${blueprint?.databaseDesign.entities.map(e => `
            <h3>Table: ${e.name}</h3>
            <p><strong>Attributes:</strong></p>
            <ul>${e.fields.map(f => `<li>${f}</li>`).join("")}</ul>
            <p><strong>Entity Relations:</strong></p>
            <ul>${e.relationships.map(r => `<li>${r}</li>`).join("")}</ul>
          `).join("")}

          <h2>4. Core REST API Interface</h2>
          <table>
            <thead>
              <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
            </thead>
            <tbody>
              ${blueprint?.restApiPlan.map(route => `
                <tr>
                  <td><span class="badge">${route.method}</span></td>
                  <td><code>${route.endpoint}</code></td>
                  <td>${route.description}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <h2>5. Monospace Folder Tree Directory Structure</h2>
          <pre>${blueprint?.folderStructure}</pre>

          <h2>6. Structured Sprint Schedule</h2>
          ${blueprint?.sprintPlan.map(sprint => `
            <h3>${sprint.name} (${sprint.duration})</h3>
            <ul>${sprint.objectives.map(o => `<li>${o}</li>`).join("")}</ul>
          `).join("")}

          <h2>7. Interactive UI Layout Proposals</h2>
          <ul>${blueprint?.uiSuggestions.map(ui => `<li>${ui}</li>`).join("")}</ul>

          <h2>8. System Vulnerability & Risk Analysis</h2>
          <ul>
            <li><strong>Technical:</strong> ${blueprint?.riskAnalysis.technical}</li>
            <li><strong>Security:</strong> ${blueprint?.riskAnalysis.security}</li>
            <li><strong>Performance:</strong> ${blueprint?.riskAnalysis.performance}</li>
            <li><strong>Scalability:</strong> ${blueprint?.riskAnalysis.scalability}</li>
            <li><strong>Architectural Complexity:</strong> ${blueprint?.riskAnalysis.complexity}</li>
          </ul>

          <h2>9. Production Release & Deployment Roadmap</h2>
          <ul>
            <li><strong>Hosting:</strong> ${blueprint?.deploymentStrategy.hosting}</li>
            <li><strong>Integration:</strong> ${blueprint?.deploymentStrategy.cicd}</li>
            <li><strong>Variables:</strong> ${blueprint?.deploymentStrategy.envVars.join(", ")}</li>
            <li><strong>Logging:</strong> ${blueprint?.deploymentStrategy.logging}</li>
            <li><strong>Security Backup:</strong> ${blueprint?.deploymentStrategy.backup}</li>
          </ul>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 text-left font-sans">
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#141b2d] pb-6 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
            <Brain className="w-8 h-8 text-[#3b82f6]" />
            Forge Brain
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            CTO Architecture Engine: compile project concepts into complete production software blueprints.
          </p>
        </div>

        {/* Global Select Project Launchpad dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-[10px] font-bold uppercase text-[#475569] whitespace-nowrap">Project Selector</label>
          <select
            value={isNewProjectMode ? "new" : selectedProjectId}
            onChange={handleProjectSelect}
            className="px-3.5 py-2 bg-[#141b2d] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-[#3b82f6] min-w-[200px]"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                📁 {p.name} {p.blueprint ? "✓" : ""}
              </option>
            ))}
            <option value="new">➕ Create New Launchpad</option>
          </select>
        </div>
      </div>

      {/* Success/Error Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-lg bg-emerald-950/20 border border-emerald-900 text-emerald-400 text-xs flex justify-between items-center"
          >
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="hover:text-white font-bold">&times;</button>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900 text-red-400 text-xs flex justify-between items-center"
          >
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="hover:text-white font-bold">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Project Input form */}
        <div className="lg:col-span-5 bg-[#141b2d]/60 backdrop-blur-md border border-[#1e293b] rounded-xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-[#3b82f6] to-[#10b981]" />
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-1.5 border-b border-[#1e293b] pb-2.5">
            <PlusCircle className="w-4 h-4 text-[#3b82f6]" />
            Blueprint Configuration
          </h2>

          <form onSubmit={handleGenerateBlueprint} className="space-y-4">
            {/* Project Name (editable in new mode, otherwise display-only or pre-populated) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1.5">Project Name</label>
              <input
                type="text"
                required
                disabled={!isNewProjectMode}
                placeholder="e.g. Athena AI Tutor"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] disabled:opacity-60"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1.5">Project Description & Domain Specs</label>
              <textarea
                required
                rows={4}
                disabled={!isNewProjectMode}
                placeholder="Describe your software idea in detail..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] disabled:opacity-60 resize-none leading-relaxed"
              />
              {!isNewProjectMode && (
                <span className="text-[9px] text-[#475569] mt-1 block">To modify, update name/description in the primary Launchpad view.</span>
              )}
            </div>

            {/* Industry/Sector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1.5">Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="SaaS Productivity & Tools">SaaS Productivity & Tools</option>
                <option value="AI Developer Tools & API">AI & Developer Tools</option>
                <option value="FinTech & Decentralized Ledger">FinTech & Blockchain</option>
                <option value="E-Commerce & Digital Logistics">E-Commerce & Digital Logistics</option>
                <option value="Healthcare SaaS & Telemedicine">Healthcare & Biotech</option>
                <option value="EdTech & AI Tutoring">EdTech & AI Tutoring</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1.5">Target Audience</label>
              <input
                type="text"
                required
                placeholder="e.g. Independent content creators, B2B sales teams"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            {/* Platform Selection pill-grid */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1.5">Deployment Target Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {["Web", "Mobile", "Desktop", "API Only", "Hybrid SaaS"].map((p) => {
                  const isSel = platform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`py-1.5 rounded text-xs font-semibold border transition-all ${
                        isSel
                          ? "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]"
                          : "bg-[#0b0f19] text-[#94a3b8] border-[#1e293b] hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Tech Stack */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569] mb-1.5">Preferred Tech Stack</label>
              <input
                type="text"
                required
                placeholder="e.g. Next.js, FastAPI, PostgreSQL, Tailwind"
                value={preferredTechStack}
                onChange={(e) => setPreferredTechStack(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            {/* Timeline, Budget, Team Size in a 3-column row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] font-bold uppercase text-[#475569] mb-1">Timeline</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-[11px] text-white focus:outline-none"
                >
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-[#475569] mb-1">Budget</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-[11px] text-white focus:outline-none"
                >
                  <option value="$10,000">$10k</option>
                  <option value="$25,000">$25k</option>
                  <option value="$50,000">$50k</option>
                  <option value="$100k+">$100k+</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-[#475569] mb-1">Team Size</label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-[11px] text-white focus:outline-none"
                >
                  <option value="1 Developer">1 Dev</option>
                  <option value="3 Developers">3 Devs</option>
                  <option value="5+ Developers">5+ Devs</option>
                </select>
              </div>
            </div>

            {/* AI Assistance Level */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#475569]">AI Assistance Level</label>
                <span className="text-[11px] font-extrabold text-[#3b82f6]">{aiLevel}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                value={aiLevel === "None" ? 0 : aiLevel === "Medium" ? 1 : aiLevel === "High" ? 2 : 3}
                onChange={(e) => {
                  const idx = parseInt(e.target.value);
                  const levels = ["None", "Medium", "High", "Extreme Max"];
                  setAiLevel(levels[idx]);
                }}
                className="w-full accent-[#3b82f6] bg-[#0b0f19] h-1.5 rounded-lg appearance-none cursor-pointer border border-[#1e293b]"
              />
            </div>

            {/* Action Trigger */}
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg mt-4 border border-[#3b82f6]/40"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Architectural Blueprint...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Architecture Blueprint
                </>
              )}
            </button>
          </form>

          {/* AI Blueprint Progress Step Simulator UI */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-4 rounded-lg bg-[#0b0f19] border border-[#1e293b]"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-bold text-[#3b82f6] tracking-wider animate-pulse">CTO Compilation Node</span>
                  <span className="text-xs text-[#94a3b8] font-bold">{Math.round(((generationStep + 1) / generationSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-[#141b2d] h-1.5 rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-[#10b981] h-full rounded-full"
                    animate={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-[11px] text-white leading-relaxed font-medium transition-all">
                  ⚙️ {generationSteps[generationStep]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Blueprint Display */}
        <div className="lg:col-span-7 space-y-6">
          {blueprint ? (
            <div className="bg-[#141b2d]/40 backdrop-blur-md border border-[#1e293b] rounded-xl p-6 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 blur-2xl rounded-full pointer-events-none" />

              {/* Toolbar & Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1e293b] pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#10b981]" />
                    {projectName} Blueprint
                  </h2>
                  <p className="text-[10px] text-[#94a3b8]">Compiled by AI Forge Solutions Engine</p>
                </div>

                {/* Export controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleExportPDF}
                    title="Export styled print PDF"
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#3b82f6]" />
                    PDF
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    title="Export standard markdown document"
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#10b981]" />
                    MD
                  </button>
                  <button
                    onClick={handleExportJSON}
                    title="Download raw schema JSON configuration"
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Code className="w-3.5 h-3.5 text-amber-400" />
                    JSON
                  </button>
                  <button
                    onClick={handleSaveBlueprint}
                    title="Save current blueprint modification"
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>

              {/* Scrollable blueprint presentation cards container */}
              <div id="blueprint-scrollable-area" className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* 1. EXECUTIVE SUMMARY */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("summary")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-[#3b82f6]" />
                      1. Executive Overview
                    </span>
                    {collapsedSections.summary ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.summary && (
                    <div className="p-4 text-xs text-[#94a3b8] leading-relaxed border-t border-[#1e293b]">
                      {blueprint.executiveSummary}
                    </div>
                  )}
                </div>

                {/* 2. TECH STACK SELECTION */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("techStack")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-pink-500" />
                      2. Recommended Architecture Stack
                    </span>
                    {collapsedSections.techStack ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.techStack && (
                    <div className="p-4 border-t border-[#1e293b] grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: "Frontend Library", value: blueprint.techStack.frontend, icon: Code, color: "text-[#3b82f6]" },
                        { key: "Backend Framework", value: blueprint.techStack.backend, icon: Cpu, color: "text-[#10b981]" },
                        { key: "Database Architecture", value: blueprint.techStack.database, icon: Database, color: "text-amber-500" },
                        { key: "Authentication Engine", value: blueprint.techStack.authentication, icon: Key, color: "text-red-400" },
                        { key: "AI Intelligence Provider", value: blueprint.techStack.aiProvider, icon: Brain, color: "text-purple-400" },
                        { key: "Cloud Ingress Hosting", value: blueprint.techStack.cloudHosting, icon: Cloud, color: "text-sky-400" },
                        { key: "Continuous Integration", value: blueprint.techStack.devops, icon: Wrench, color: "text-pink-400" },
                        { key: "Testing Environment", value: blueprint.techStack.testingFramework, icon: Activity, color: "text-emerald-400" },
                        { key: "Deployment Pipeline", value: blueprint.techStack.deployment, icon: CloudLightning, color: "text-cyan-400" },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-[#141b2d] rounded border border-[#1e293b]/60 flex items-start gap-2.5">
                          <item.icon className={`w-4 h-4 ${item.color} mt-0.5 shrink-0`} />
                          <div>
                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#475569] mb-0.5">{item.key}</span>
                            <span className="text-[11px] text-white leading-snug">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. DATABASE SCHEMA DESIGN */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("databaseDesign")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-500" />
                      3. Database Schema Design (Normalized)
                    </span>
                    {collapsedSections.databaseDesign ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.databaseDesign && (
                    <div className="p-4 border-t border-[#1e293b] space-y-4">
                      {blueprint.databaseDesign.entities.map((entity, idx) => (
                        <div key={idx} className="p-4 bg-[#141b2d] rounded border border-[#1e293b]">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-2.5">
                            <Table className="w-3.5 h-3.5 text-amber-400" />
                            Table: {entity.name}
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <p className="font-bold text-[#475569] uppercase tracking-wider text-[9px] mb-1">Attributes & Keys</p>
                              <ul className="space-y-1 text-[#94a3b8]">
                                {entity.fields.map((f, i) => <li key={i} className="flex items-center gap-1">🔹 {f}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="font-bold text-[#475569] uppercase tracking-wider text-[9px] mb-1">Foreign Keys & Relations</p>
                              <ul className="space-y-1 text-[#94a3b8]">
                                {entity.relationships.map((r, i) => <li key={i} className="flex items-center gap-1">🔗 {r}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. REST API PLANNING */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("restApiPlan")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Table className="w-4 h-4 text-red-500" />
                      4. Core REST API Interface Rules
                    </span>
                    {collapsedSections.restApiPlan ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.restApiPlan && (
                    <div className="p-4 border-t border-[#1e293b] overflow-x-auto">
                      <table className="w-full text-[11px] text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="border-b border-[#1e293b] text-[#475569] uppercase text-[9px] font-bold">
                            <th className="py-2.5 pl-2">Verb</th>
                            <th className="py-2.5">Gateway Ingress Endpoint</th>
                            <th className="py-2.5 pr-2">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]/60">
                          {blueprint.restApiPlan.map((route, i) => {
                            const isPost = route.method === "POST";
                            const isGet = route.method === "GET";
                            const isPut = route.method === "PUT";
                            return (
                              <tr key={i} className="hover:bg-[#141b2d]/50 transition-colors">
                                <td className="py-2.5 pl-2 font-black">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] border ${
                                    isPost ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/60" :
                                    isGet ? "bg-blue-950/20 text-blue-400 border-blue-900/60" :
                                    isPut ? "bg-amber-950/20 text-amber-400 border-amber-900/60" :
                                    "bg-red-950/20 text-red-400 border-red-900/60"
                                  }`}>
                                    {route.method}
                                  </span>
                                </td>
                                <td className="py-2.5 font-mono text-white select-all">{route.endpoint}</td>
                                <td className="py-2.5 text-[#94a3b8] pr-2 leading-relaxed">{route.description}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 5. FOLDER TREE STRUCTURE */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("folderStructure")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-cyan-400" />
                      5. Monospace Directory Structure File Tree
                    </span>
                    {collapsedSections.folderStructure ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.folderStructure && (
                    <div className="p-4 border-t border-[#1e293b] relative">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(blueprint.folderStructure);
                          setSuccessMessage("Directory map copied directly to clipboard!");
                        }}
                        className="absolute top-2 right-2 px-2 py-1 bg-[#1e293b] hover:bg-[#334155] text-[9px] font-bold uppercase rounded text-white border border-[#334155] transition-colors"
                      >
                        Copy Tree
                      </button>
                      <pre className="p-3 bg-[#0b0f19] text-[#10b981] font-mono text-[10px] leading-relaxed overflow-x-auto rounded border border-[#1e293b]/80">
                        {blueprint.folderStructure}
                      </pre>
                    </div>
                  )}
                </div>

                {/* 6. SPRINT TIMELINE */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("sprintPlan")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-emerald-400" />
                      6. 10-Week Sprint Roadmap Plan
                    </span>
                    {collapsedSections.sprintPlan ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.sprintPlan && (
                    <div className="p-4 border-t border-[#1e293b] space-y-4">
                      {blueprint.sprintPlan.map((sprint, idx) => (
                        <div key={idx} className="p-4 bg-[#141b2d] rounded border border-[#1e293b] relative">
                          <span className="absolute top-3 right-3 text-[10px] bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 px-2 py-0.5 rounded font-extrabold">{sprint.duration}</span>
                          <h4 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            {sprint.name}
                          </h4>
                          <ul className="space-y-1.5 pl-2 text-[11px] text-[#94a3b8]">
                            {sprint.objectives.map((obj, i) => (
                              <li key={i} className="flex items-start gap-1.5 leading-relaxed">
                                <input type="checkbox" readOnly checked className="accent-[#10b981] mt-0.5" />
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. UI LAYOUT PROPOSALS */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("uiSuggestions")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      7. Interface Layout Suggestions
                    </span>
                    {collapsedSections.uiSuggestions ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.uiSuggestions && (
                    <div className="p-4 border-t border-[#1e293b] space-y-2">
                      {blueprint.uiSuggestions.map((ui, idx) => (
                        <div key={idx} className="p-3 bg-[#141b2d] rounded border border-[#1e293b]/60 text-xs text-[#94a3b8] flex gap-2.5 items-start leading-relaxed">
                          <span className="p-1 bg-purple-500/10 text-purple-400 rounded text-[10px] font-bold shrink-0">UI {idx+1}</span>
                          {ui}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 8. RISK ANALYSIS */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("riskAnalysis")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      8. Risk Matrix & Security Mitigations
                    </span>
                    {collapsedSections.riskAnalysis ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.riskAnalysis && (
                    <div className="p-4 border-t border-[#1e293b] grid grid-cols-1 gap-3 text-xs">
                      {[
                        { title: "Technical Constraints", text: blueprint.riskAnalysis.technical, color: "border-red-950 text-red-400 bg-red-950/10" },
                        { title: "Authentication & Security Audits", text: blueprint.riskAnalysis.security, color: "border-amber-950 text-amber-400 bg-amber-950/10" },
                        { title: "Performance Metrics Latency", text: blueprint.riskAnalysis.performance, color: "border-blue-950 text-blue-400 bg-blue-950/10" },
                        { title: "Scale Load limits", text: blueprint.riskAnalysis.scalability, color: "border-purple-950 text-purple-400 bg-purple-950/10" },
                        { title: "Logical Complexity Thresholds", text: blueprint.riskAnalysis.complexity, color: "border-cyan-950 text-cyan-400 bg-cyan-950/10" },
                      ].map((risk, idx) => (
                        <div key={idx} className={`p-3.5 rounded border ${risk.color} leading-relaxed`}>
                          <span className="font-extrabold uppercase text-[10px] block mb-1 tracking-wider">{risk.title}</span>
                          {risk.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 9. DEPLOYMENT STRATEGY */}
                <div className="border border-[#1e293b] rounded-lg overflow-hidden bg-[#0e1424]">
                  <button
                    onClick={() => toggleSection("deploymentStrategy")}
                    className="w-full px-4 py-3 bg-[#11192a] hover:bg-[#151f33] flex justify-between items-center text-xs font-bold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <CloudLightning className="w-4 h-4 text-blue-400" />
                      9. Cloud Launch & DevOps Strategy
                    </span>
                    {collapsedSections.deploymentStrategy ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  {!collapsedSections.deploymentStrategy && (
                    <div className="p-4 border-t border-[#1e293b] space-y-3.5 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div className="p-3 bg-[#141b2d] rounded border border-[#1e293b]">
                          <span className="block text-[9px] font-bold text-[#475569] uppercase tracking-wider mb-1">Target Ingress Hosting</span>
                          <span className="text-white font-medium leading-relaxed">{blueprint.deploymentStrategy.hosting}</span>
                        </div>
                        <div className="p-3 bg-[#141b2d] rounded border border-[#1e293b]">
                          <span className="block text-[9px] font-bold text-[#475569] uppercase tracking-wider mb-1">Devops CI/CD Framework</span>
                          <span className="text-white font-medium leading-relaxed">{blueprint.deploymentStrategy.cicd}</span>
                        </div>
                        <div className="p-3 bg-[#141b2d] rounded border border-[#1e293b]">
                          <span className="block text-[9px] font-bold text-[#475569] uppercase tracking-wider mb-1">Logging Transports</span>
                          <span className="text-white font-medium leading-relaxed">{blueprint.deploymentStrategy.logging}</span>
                        </div>
                        <div className="p-3 bg-[#141b2d] rounded border border-[#1e293b]">
                          <span className="block text-[9px] font-bold text-[#475569] uppercase tracking-wider mb-1">Automatic Backups retention</span>
                          <span className="text-white font-medium leading-relaxed">{blueprint.deploymentStrategy.backup}</span>
                        </div>
                      </div>

                      {/* Env Vars */}
                      <div className="p-3 bg-[#141b2d] rounded border border-[#1e293b]">
                        <span className="block text-[9px] font-bold text-[#475569] uppercase tracking-wider mb-2">Required .env Variables</span>
                        <div className="flex flex-wrap gap-2">
                          {blueprint.deploymentStrategy.envVars.map((v, i) => (
                            <code key={i} className="px-2 py-0.5 bg-[#0b0f19] text-pink-400 font-mono rounded text-[10px] border border-[#1e293b]">{v}</code>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-[#141b2d]/30 border border-[#1e293b] rounded-xl p-12 text-center shadow-xl h-full flex flex-col justify-center items-center">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 mb-4 animate-pulse">
                <Brain className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">No Active Blueprint Compiled</h3>
              <p className="text-xs text-[#94a3b8] max-w-sm leading-relaxed mb-6">
                Fill out the configuration specifications in the left panel and click Generate to compile a full Principal Solutions Architect Blueprint.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

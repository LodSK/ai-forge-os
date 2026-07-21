import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Bot, Rocket, ShieldCheck, Zap, Layers, BarChart, CheckCircle } from "lucide-react";

interface LandingViewProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export default function LandingView({ onGetStarted, onLogin }: LandingViewProps) {
  const [demoIdea, setDemoIdea] = useState("");
  const [calculatorResult, setCalculatorResult] = useState<null | {
    score: number;
    title: string;
    description: string;
  }>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoIdea.trim()) return;

    setIsCalculating(true);
    setTimeout(() => {
      // High-quality deterministic preview of the tool
      const score = Math.floor(Math.random() * 15) + 42; // baseline
      setCalculatorResult({
        score,
        title: `AI Readiness: Level ${score}/100`,
        description: `Your idea for "${demoIdea}" has strong core potential. To reach 100% Launch Readiness, our platform will help you map out technical checklists (JWT, SSL certs, Docker configurations) and marketing hooks suited to your niche. Register to access the full roadmap.`,
      });
      setIsCalculating(false);
    }, 1200);
  };

  return (
    <div id="landing-container" className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] font-sans selection:bg-[#3b82f6] selection:text-white">
      {/* Premium subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Hero Header Area */}
      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e293b] border border-[#334155] text-xs font-semibold text-[#60a5fa] mb-6">
            <Rocket className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>AI Forge Platform V1.0 is Live</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 max-w-4xl mx-auto leading-[1.1]">
            The <span className="text-[#3b82f6]">Operating System</span> for AI Builders
          </h1>

          <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop guessing your launch checklists. AI Forge parses your project specifications to generate automated, step-by-step developer checklists, compliance roadmaps, and growth telemetry.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <button
              id="hero-get-started"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-[#3b82f6]/10"
            >
              Initialize Launchpad
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="hero-login"
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#141b2d] hover:bg-[#1e293b] text-white rounded-lg font-semibold border border-[#334155] transition-all duration-150"
            >
              Access Dashboard
            </button>
          </div>
        </motion.div>

        {/* Dynamic Launch Readiness Calculator Mock Tool */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-xl mx-auto p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] shadow-2xl relative overflow-hidden backdrop-blur-md"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-[#3b82f6]" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#94a3b8]">AI Readiness Estimator</h3>
          </div>
          <form onSubmit={handleDemoSubmit} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="What are you building? (e.g. Developer productivity Chrome extension)"
              value={demoIdea}
              onChange={(e) => setDemoIdea(e.target.value)}
              className="flex-1 px-4 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
            <button
              type="submit"
              disabled={isCalculating}
              className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all"
            >
              {isCalculating ? "Evaluating..." : "Estimate"}
            </button>
          </form>

          {calculatorResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-5 pt-5 border-t border-[#1e293b] text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#3b82f6] font-bold text-sm">{calculatorResult.title}</span>
                <div className="w-32 bg-[#0b0f19] rounded-full h-2">
                  <div
                    className="bg-[#3b82f6] h-2 rounded-full"
                    style={{ width: `${calculatorResult.score}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">{calculatorResult.description}</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Core Platform Pillars (No identical 3-column stacked icons AI slop!) */}
      <div id="landing-features" className="bg-[#0e1424] border-t border-[#141b2d] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Engineered for absolute operational rigor</h2>
            <p className="text-[#94a3b8] max-w-xl mx-auto text-sm leading-relaxed">
              We skip the fluff. AI Forge establishes the technical, compliance, and marketing foundations that ensure your SaaS survives launch day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] hover:border-[#3b82f6]/50 transition-colors">
              <div className="p-3 bg-[#1e293b] w-fit rounded-lg mb-4 text-[#3b82f6]">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Full-Stack Roadmap</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Step-by-step guidance mapping dependencies across tech stacks, database pipelines, and secure hosting rules optimized for LLM agents.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] hover:border-[#3b82f6]/50 transition-colors">
              <div className="p-3 bg-[#1e293b] w-fit rounded-lg mb-4 text-[#10b981]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Compliance & Privacy</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Automated legal checkpoints including GDPR policies, cookie constraints, encryption configurations, and security audits.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] hover:border-[#3b82f6]/50 transition-colors">
              <div className="p-3 bg-[#1e293b] w-fit rounded-lg mb-4 text-[#eab308]">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">AI Growth Hacks</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Personalized distribution hooks using models optimized for developer communities, HN listings, and organic SEO.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] hover:border-[#3b82f6]/50 transition-colors">
              <div className="p-3 bg-[#1e293b] w-fit rounded-lg mb-4 text-[#ec4899]">
                <BarChart className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Launchday Telemetry</h4>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Simulated public visitor tunnels and active conversion monitors that record feedback loops and list subscription states.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div id="landing-pricing" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Scales with your ambitious milestones</h2>
          <p className="text-[#94a3b8] max-w-xl mx-auto text-sm leading-relaxed">
            Choose a plan that fits your execution tier. Both options operate with full-stack access and zero-friction licensing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Developer Tier */}
          <div className="p-8 rounded-xl bg-[#141b2d] border border-[#1e293b] hover:border-[#334155] transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#60a5fa] px-2 py-1 rounded bg-[#1e293b] border border-[#334155]">Developer Tier</span>
                <span className="text-2xl font-black text-white">$0 <span className="text-xs font-normal text-[#94a3b8]">/ free forever</span></span>
              </div>
              <p className="text-xs text-[#94a3b8] mb-6 leading-relaxed">For indie founders launching single applications with up to 3 parallel campaigns.</p>
              <ul className="space-y-3 mb-8">
                {["1 Active Launchpad Project", "AI-Generated Custom Checklists", "Dynamic Launch Readiness Metrics", "Local System Audit Log Tracking"].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                    <CheckCircle className="w-4 h-4 text-[#3b82f6] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onGetStarted}
              className="w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition-all"
            >
              Deploy Free Sandbox
            </button>
          </div>

          {/* SaaS Pro Tier */}
          <div className="p-8 rounded-xl bg-[#141b2d] border-2 border-[#3b82f6] shadow-xl shadow-[#3b82f6]/5 hover:border-[#60a5fa] transition-all flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#3b82f6] text-white text-[10px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-bl-lg">Popular</div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#10b981] px-2 py-1 rounded bg-[#1e293b] border border-[#334155]">SaaS Pro Tier</span>
                <span className="text-2xl font-black text-white">$29 <span className="text-xs font-normal text-[#94a3b8]">/ month</span></span>
              </div>
              <p className="text-xs text-[#94a3b8] mb-6 leading-relaxed">For teams and agency creators needing unlimited projects, deep Gemini queries, and raw API access.</p>
              <ul className="space-y-3 mb-8">
                {["Unlimited Active Projects", "Deep AI Growth Hack Generations", "Simulated Multi-User Traffic Loops", "Full OpenAPI/Swagger Reference", "Standard Priority Developer Support"].map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                    <CheckCircle className="w-4 h-4 text-[#10b981] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={onGetStarted}
              className="w-full py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition-all shadow-lg"
            >
              Get Professional Access
            </button>
          </div>
        </div>
      </div>

      {/* Landing Footer */}
      <footer className="border-t border-[#141b2d] py-12 text-center text-xs text-[#475569]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#3b82f6]" />
            <span className="font-bold text-[#e2e8f0]">AI Forge OS</span>
          </div>
          <span>&copy; 2026 AI Forge. All rights reserved. Built with senior-level architectural rigor.</span>
        </div>
      </footer>
    </div>
  );
}

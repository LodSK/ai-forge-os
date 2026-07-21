import React, { useState } from "react";
import { Settings, ToggleLeft, ToggleRight, Terminal, Globe, HelpCircle } from "lucide-react";

export default function SettingsView() {
  const [darkMode, setDarkMode] = useState(true);
  const [webhooksUrl, setWebhooksUrl] = useState("https://api.mycompany.com/v1/devlaunch-webhook");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 text-left font-sans">
      <div className="mb-8 pb-6 border-b border-[#141b2d]">
        <h1 className="text-3xl font-black text-white tracking-tight">Platform Settings</h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Adjust webhook triggers, dashboard preferences, and developer credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* Preference Card */}
        <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b]">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-[#3b82f6]" />
            Dashboard Preferences
          </h3>

          <div className="flex justify-between items-center py-3 border-b border-[#1e293b] text-xs">
            <div>
              <p className="text-white font-semibold">Premium Dark Canvas Mode</p>
              <p className="text-[#475569] mt-0.5">Maintain dark luxury typography schemes.</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-[#3b82f6] hover:text-white transition-colors"
            >
              {darkMode ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
            </button>
          </div>

          <div className="flex justify-between items-center py-3 text-xs">
            <div>
              <p className="text-white font-semibold">Live Traffic Simulation</p>
              <p className="text-[#475569] mt-0.5">Toggle live visitor ticker logs on launched projects.</p>
            </div>
            <ToggleRight className="w-10 h-10 text-[#3b82f6]" />
          </div>
        </div>

        {/* Webhooks Trigger Card */}
        <form onSubmit={handleSave} className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b]">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[#10b981]" />
            Webhook Integrations
          </h3>
          <p className="text-[10px] text-[#475569] mb-4">Post execution milestones and launch achievements to your backend</p>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#475569] mb-1">Payload Endpoint URL</label>
              <input
                type="url"
                required
                value={webhooksUrl}
                onChange={(e) => setWebhooksUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-lg transition-all shadow-lg"
          >
            {isSaved ? "Saved Successfully!" : "Save Webhook Hooks"}
          </button>
        </form>

        {/* API secrets / ENV instruction display */}
        <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-2xl rounded-full pointer-events-none" />
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-amber-500" />
            Developer Credentials (.env)
          </h3>
          <p className="text-[10px] text-[#475569] mb-4">Platform key diagnostics. Secrets are loaded dynamically on execution containers.</p>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-[#94a3b8] font-semibold">GEMINI_API_KEY</span>
              <span className="text-[#475569] font-mono">••••••••••••••••••••••••••••</span>
            </div>
            <div className="flex justify-between border-b border-[#1e293b] pb-2">
              <span className="text-[#94a3b8] font-semibold">JWT_SECRET</span>
              <span className="text-amber-500 font-mono text-[10px]">Configured (Fallback Active)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8] font-semibold">CONTAINER_API_GATEWAY</span>
              <span className="text-emerald-500 font-mono text-[10px]">ONLINE (Port 3000)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ApiService } from "../api";
import {
  TrendingUp,
  Eye,
  UserPlus,
  Percent,
  RefreshCw,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";
import { Project } from "../types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface AnalyticsViewProps {
  token: string;
  projectId?: string; // Optional pre-selected project
}

interface AnalyticsData {
  projectId: string;
  projectName: string;
  views: number;
  signups: number;
  conversionRate: number;
  dailyViews: { date: string; count: number }[];
  dailySignups: { date: string; count: number }[];
}

export default function AnalyticsView({ token, projectId }: AnalyticsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tickerLogs, setTickerLogs] = useState<string[]>([]);

  // Load released projects
  const fetchLaunchedProjects = async () => {
    try {
      const list = await ApiService.listProjects(token);
      const launched = list.filter((p: Project) => p.status === "launched");
      setProjects(launched);

      if (launched.length > 0) {
        // If preselected matches, use it; otherwise, select the first
        const matched = launched.find((p: Project) => p.id === projectId);
        setSelectedProjectId(matched ? matched.id : launched[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLaunchedProjects();
  }, [token, projectId]);

  // Load details whenever project changes
  const loadAnalytics = async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    try {
      const data = await ApiService.getProjectAnalytics(selectedProjectId, token);
      setAnalytics(data);

      // Generate funny simulated traffic ticker logs for excitement
      const events = [
        `Anonymous visitor from California signed up to the waitlist.`,
        `Product Hunt visitor explored features tab.`,
        `HN developer analyzed checklist completeness.`,
        `Developer from London booked a private beta slot.`,
        `Anonymous tech lead shared link to their team slack channel.`,
      ];
      const selectedLogs = Array.from({ length: 4 }, () => events[Math.floor(Math.random() * events.length)]);
      setTickerLogs(selectedLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedProjectId]);

  const handleRefresh = () => {
    loadAnalytics();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-left font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-[#141b2d]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Launch Telemetry</h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Real-time visual analysis of launched applications, traffic funnels, and registration conversions.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex items-center gap-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-2 bg-[#141b2d] border border-[#1e293b] rounded-lg text-xs text-white focus:outline-none focus:border-[#3b82f6]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleRefresh}
              className="p-2 bg-[#141b2d] hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-white border border-[#1e293b] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#141b2d] border border-[#1e293b]">
          <Calendar className="w-12 h-12 text-[#475569] mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white mb-1">No active live dashboards</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto leading-relaxed">
            Analytics dashboards are generated once a launchpad project status is changed to "Launched". Complete your checklist items and hit launch to start tracking.
          </p>
        </div>
      ) : isLoading || !analytics ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
          <span className="text-xs text-[#94a3b8]">Compiling historical traffic logs...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest">Total Launch Visitors</span>
                <p className="text-3xl font-black text-white mt-1">{analytics.views}</p>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">+14% vs yesterday</span>
              </div>
              <div className="p-3 bg-[#1e293b] rounded-lg text-[#3b82f6] border border-[#1e293b]">
                <Eye className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest">Waitlist Registrations</span>
                <p className="text-3xl font-black text-white mt-1">{analytics.signups}</p>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">+8% signups surge</span>
              </div>
              <div className="p-3 bg-[#1e293b] rounded-lg text-emerald-400 border border-[#1e293b]">
                <UserPlus className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest">Conversion Percentage</span>
                <p className="text-3xl font-black text-white mt-1">{analytics.conversionRate}%</p>
                <span className="text-[10px] text-blue-400 font-semibold block mt-1">Excellent SaaS ratio</span>
              </div>
              <div className="p-3 bg-[#1e293b] rounded-lg text-purple-400 border border-[#1e293b]">
                <Percent className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] lg:col-span-2">
              <h3 className="text-sm font-bold text-white mb-6">Traffic Funnel Growth Timeline (Past 7 Days)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyViews}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#475569" fontSize={11} />
                    <YAxis stroke="#475569" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#141b2d",
                        borderColor: "#1e293b",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#94a3b8", fontSize: "11px" }}
                      itemStyle={{ color: "#fff", fontSize: "12px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Unique Visitors"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Ticker log */}
            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Live visitor telemetry logs</h3>
                <p className="text-[10px] text-[#475569] mb-4">Simulated public user activity streams</p>

                <div className="space-y-3">
                  {tickerLogs.map((log, idx) => (
                    <div key={idx} className="p-3 rounded bg-[#0e1424] border border-[#1e293b] text-[11px] leading-relaxed text-[#94a3b8]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-[#3b82f6] font-bold">EVENT_CAPTURE</span>
                        <span className="text-[9px] text-[#475569]">Just now</span>
                      </div>
                      {log}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1e293b] text-center">
                <span className="text-[10px] text-[#475569] flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  Streaming live traffic
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

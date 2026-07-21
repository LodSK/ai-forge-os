import { useState, useEffect } from "react";
import { ApiService } from "../api";
import { User, AuditLog, SystemMetrics } from "../types";
import {
  ShieldAlert,
  Users,
  Layers,
  Rocket,
  CheckCircle,
  Trash2,
  ListOrdered,
  Loader2,
  XCircle,
} from "lucide-react";

interface AdminViewProps {
  token: string;
}

export default function AdminView({ token }: AdminViewProps) {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [users, setUsers] = useState<Omit<User, "passwordHash">[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const stats = await ApiService.getAdminMetrics(token);
      setMetrics(stats);

      const userList = await ApiService.listUsers(token);
      setUsers(userList);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load administrative modules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you absolutely sure you want to delete this founder account? All associated projects and checklist blueprints will be deleted as well.")) return;

    try {
      await ApiService.deleteUser(userId, token);
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete user account.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-left font-sans">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-[#141b2d]">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Administration</h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Locked terminal panel to monitor system metrics, manage database directories, and query system-wide audit logs.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-950/20 border border-red-800 text-xs font-bold text-red-400">
          <ShieldAlert className="w-3.5 h-3.5" />
          SECURE ADMINISTRATIVE CONSOLE
        </div>
      </div>

      {errorMessage ? (
        <div className="p-12 text-center rounded-xl bg-red-950/25 border border-red-800/50">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Administrative Block</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto leading-relaxed mb-4">{errorMessage}</p>
          <p className="text-[10px] text-amber-500">To view this panel, register or log in with an Administrator role.</p>
        </div>
      ) : isLoading || !metrics ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#10b981] animate-spin" />
          <span className="text-xs text-[#94a3b8]">Initializing platform directory indexes...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest">Total Active Founders</span>
                <p className="text-3xl font-black text-white mt-1">{metrics.totalUsers}</p>
                <span className="text-[10px] text-emerald-400 font-semibold block mt-1">100% active sessions</span>
              </div>
              <div className="p-3 bg-[#1e293b] rounded-lg text-[#10b981] border border-[#1e293b]">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest">Total Active Blueprints</span>
                <p className="text-3xl font-black text-white mt-1">{metrics.totalProjects}</p>
                <span className="text-[10px] text-[#3b82f6] font-semibold block mt-1">Gemini models optimized</span>
              </div>
              <div className="p-3 bg-[#1e293b] rounded-lg text-[#3b82f6] border border-[#1e293b]">
                <Layers className="w-6 h-6" />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest">Successful Launches</span>
                <p className="text-3xl font-black text-white mt-1">{metrics.totalLaunches}</p>
                <span className="text-[10px] text-purple-400 font-semibold block mt-1">Traffic generators active</span>
              </div>
              <div className="p-3 bg-[#1e293b] rounded-lg text-purple-400 border border-[#1e293b]">
                <Rocket className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Directory Table list */}
            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] lg:col-span-2">
              <h3 className="text-sm font-bold text-white mb-4">Founder Account Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-[#1e293b]">
                  <thead>
                    <tr className="text-[#475569] font-semibold">
                      <th className="pb-3">Founder</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Joined</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {users.map((usr) => (
                      <tr key={usr.id} className="text-[#94a3b8]">
                        <td className="py-3 font-bold text-white flex items-center gap-2">
                          <img src={usr.avatarUrl} alt="Avatar" className="w-6 h-6 rounded-full" />
                          {usr.firstName} {usr.lastName}
                        </td>
                        <td className="py-3">{usr.email}</td>
                        <td className="py-3">
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                            usr.role === "admin" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20"
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3">{new Date(usr.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          {usr.id !== token ? (
                            <button
                              id={`btn-delete-user-${usr.id}`}
                              onClick={() => handleDeleteUser(usr.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Delete user account"
                            >
                              <Trash2 className="w-4 h-4 ml-auto" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#475569]">Self</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Wide Audit Logs */}
            <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b]">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-[#10b981]" />
                System Audit Trail
              </h3>
              <p className="text-[10px] text-[#475569] mb-4">Complete cryptographic chronological actions logging of all users.</p>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                {(metrics.recentAuditLogs || []).length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#475569] bg-[#0e1424] border border-[#1e293b] rounded-lg">
                    No system log trails captured.
                  </div>
                ) : (
                  metrics.recentAuditLogs.map((log: AuditLog) => (
                    <div key={log.id} className="p-3 bg-[#0e1424] border border-[#1e293b] rounded-lg text-[11px] leading-relaxed text-[#94a3b8]">
                      <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                        <span className="text-[9px] text-[#3b82f6] font-bold uppercase truncate max-w-[100px]">{log.action}</span>
                        <span className="text-[9px] text-[#475569]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-white font-semibold mb-0.5">{log.userEmail}</p>
                      <p className="text-[#475569] leading-normal">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

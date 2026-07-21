import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ApiService } from "../api";
import { User, AuditLog, UserRole } from "../types";
import { ShieldCheck, User as UserIcon, ListOrdered, Calendar, Mail, Key } from "lucide-react";

interface ProfileViewProps {
  user: Omit<User, "passwordHash">;
  token: string;
}

export default function ProfileView({ user, token }: ProfileViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch only this user's logs
  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await ApiService.getMyLogs(token);
      setLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 text-left font-sans">
      <div className="mb-8 pb-6 border-b border-[#141b2d]">
        <h1 className="text-3xl font-black text-white tracking-tight">Founder Profile</h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Review credentials, access tokens, and administrative interaction logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Account Details Card */}
        <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] flex flex-col justify-between h-fit md:col-span-1">
          <div className="text-center mb-6">
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full bg-[#0e1424] border-2 border-[#3b82f6] mx-auto mb-4 p-1"
            />
            <h3 className="text-lg font-black text-white leading-tight">{user.firstName} {user.lastName}</h3>
            <span className={`text-[9px] uppercase font-bold px-2.5 py-0.5 rounded border inline-block mt-2 ${
              user.role === UserRole.ADMIN ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20"
            }`}>
              {user.role} role
            </span>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#1e293b] text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#475569] block mb-0.5">Primary Email</span>
              <span className="text-[#e2e8f0] font-semibold flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-[#94a3b8]" />
                {user.email}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#475569] block mb-0.5">Platform Security</span>
              <span className="text-[#e2e8f0] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Session Token Signed
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#475569] block mb-0.5">Account Created</span>
              <span className="text-[#e2e8f0] font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Logs Trail */}
        <div className="p-6 rounded-xl bg-[#141b2d] border border-[#1e293b] md:col-span-2">
          <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
            <ListOrdered className="w-4 h-4 text-[#3b82f6]" />
            Your Activity Trail
          </h3>
          <p className="text-[10px] text-[#475569] mb-4">Cryptographically signed security events logs logged inside this sandbox container</p>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
            {isLoadingLogs ? (
              <div className="py-12 text-center text-xs text-[#475569]">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#475569] bg-[#0e1424] border border-[#1e293b] rounded-lg">
                No security actions recorded for this founder account.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 bg-[#0e1424] border border-[#1e293b] rounded-lg text-xs leading-relaxed text-[#94a3b8]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-[#3b82f6] uppercase font-bold">{log.action}</span>
                    <span className="text-[9px] text-[#475569]">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  {log.details}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

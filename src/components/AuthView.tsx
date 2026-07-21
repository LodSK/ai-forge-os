import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ApiService } from "../api";
import { Bot, LogIn, UserPlus, HelpCircle, Eye, EyeOff } from "lucide-react";
import { User, UserRole } from "../types";

interface AuthViewProps {
  onAuthSuccess: (user: Omit<User, "passwordHash">, token: string) => void;
  onCancel: () => void;
  initialMode?: "login" | "register";
  initialErrorMessage?: string | null;
}

export default function AuthView({
  onAuthSuccess,
  onCancel,
  initialMode = "login",
  initialErrorMessage = null,
}: AuthViewProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialErrorMessage) {
      setErrorMessage(initialErrorMessage);
    }
  }, [initialErrorMessage]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      if (mode === "login") {
        const res = await ApiService.login({ email, password });
        onAuthSuccess(res.user, res.accessToken);
      } else if (mode === "register") {
        const res = await ApiService.register({
          email,
          password,
          firstName,
          lastName,
          role,
        });
        onAuthSuccess(res.user, res.accessToken);
      } else {
        // Forgot password simulation
        setTimeout(() => {
          setSuccessMessage(`A password recovery token has been transmitted to ${email}. Check your inbox within 5 minutes.`);
          setIsLoading(false);
        }, 1000);
        return;
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected issue occurred during authenticating.");
    } finally {
      if (mode !== "forgot") {
        setIsLoading(false);
      }
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col justify-center items-center px-4 relative font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,#111827_0%,transparent_80%)] pointer-events-none" />

      {/* Decorative logo header */}
      <button
        onClick={onCancel}
        className="absolute top-8 left-8 flex items-center gap-2 text-xs text-[#94a3b8] hover:text-white transition-colors border border-[#1e293b] rounded-lg px-3 py-1.5 bg-[#141b2d]/50"
      >
        <span>&larr; Back to Home</span>
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md p-8 rounded-xl bg-[#141b2d] border border-[#1e293b] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-[#1e293b] rounded-lg mb-4 text-[#3b82f6]">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create AI Forge Account"}
            {mode === "forgot" && "Reset Launch Credentials"}
          </h2>
          <p className="text-xs text-[#94a3b8] mt-2">
            {mode === "login" && "Access your secure launch pad and AI models."}
            {mode === "register" && "Generate structured blueprints for your startup."}
            {mode === "forgot" && "Recover administrative credentials securely."}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 mb-6 text-xs bg-red-950/50 border border-red-800 text-red-200 rounded-lg">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 mb-6 text-xs bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#475569] mb-1">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#475569] mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#475569] mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6]"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold uppercase text-[#475569]">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode("forgot");
                    }}
                    className="text-[10px] text-[#3b82f6] hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#3b82f6] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#475569] mb-1">Explore Role (Interactive Testing)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-[#0b0f19] border border-[#1e293b] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6]"
              >
                <option value={UserRole.USER}>Standard User (Founder View)</option>
                <option value={UserRole.ADMIN}>Platform Administrator (Audit logs, full user directory)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-2 shadow-lg"
          >
            {isLoading ? (
              <span>Connecting Secure Gateway...</span>
            ) : (
              <>
                {mode === "login" && <><LogIn className="w-4 h-4" /> Sign In</>}
                {mode === "register" && <><UserPlus className="w-4 h-4" /> Create Founder Account</>}
                {mode === "forgot" && <><HelpCircle className="w-4 h-4" /> Broadcast Recovery Link</>}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#1e293b] text-center text-xs text-[#94a3b8]">
          {mode === "login" && (
            <span>
              New to AI Forge?{" "}
              <button
                onClick={() => {
                  clearMessages();
                  setMode("register");
                }}
                className="text-[#3b82f6] hover:underline font-semibold"
              >
                Create Account
              </button>
            </span>
          )}
          {mode === "register" && (
            <span>
              Already registered?{" "}
              <button
                onClick={() => {
                  clearMessages();
                  setMode("login");
                }}
                className="text-[#3b82f6] hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => {
                clearMessages();
                setMode("login");
              }}
              className="text-[#3b82f6] hover:underline font-semibold"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

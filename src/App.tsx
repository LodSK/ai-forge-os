import { useState, useEffect } from "react";
import { ApiService } from "./api";
import LandingView from "./components/LandingView";
import AuthView from "./components/AuthView";
import Navbar from "./components/Navbar";
import DashboardView from "./components/DashboardView";
import AnalyticsView from "./components/AnalyticsView";
import ProfileView from "./components/ProfileView";
import SettingsView from "./components/SettingsView";
import AdminView from "./components/AdminView";
import ForgeBrainView from "./components/ForgeBrainView";
import WorkspaceView from "./components/WorkspaceView";
import ForgeStudioView from "./components/ForgeStudioView";
import GlobalAiDrawer from "./components/GlobalAiDrawer";
import { User } from "./types";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<Omit<User, "passwordHash"> | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("landing");
  const [isInitializing, setIsInitializing] = useState(true);
  const [notificationsVersion, setNotificationsVersion] = useState(0);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // AI Assistant states
  const [showStudioAiPanel, setShowStudioAiPanel] = useState(true);
  const [showWorkspaceAiPanel, setShowWorkspaceAiPanel] = useState(true);
  const [showGlobalAiDrawer, setShowGlobalAiDrawer] = useState(false);

  const handleRobotIconClick = () => {
    if (activeTab === "forge_studio") {
      setShowStudioAiPanel((prev) => !prev);
    } else if (activeTab === "workspace") {
      setShowWorkspaceAiPanel((prev) => !prev);
    } else {
      setShowGlobalAiDrawer((prev) => !prev);
    }
  };

  // Load session from local storage on startup
  useEffect(() => {
    const storedToken = localStorage.getItem("aiforge_token");
    if (storedToken) {
      ApiService.me(storedToken)
        .then((res) => {
          setUser(res.user);
          setToken(storedToken);
          setActiveTab("dashboard");
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("aiforge_token");
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  const handleAuthSuccess = (authUser: Omit<User, "passwordHash">, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem("aiforge_token", authToken);
    setAuthMessage(null);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("aiforge_token");
    setActiveTab("landing");
  };

  // Listen for unauthorized/expired session events
  useEffect(() => {
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent;
      const errorMsg = customEvent.detail?.error || "Session has expired. Please log in again.";
      
      if (token) {
        setAuthMessage(errorMsg);
        handleLogout();
        setActiveTab("login");
      } else {
        handleLogout();
      }
    };

    window.addEventListener("unauthorized-session", handleUnauthorized);
    return () => {
      window.removeEventListener("unauthorized-session", handleUnauthorized);
    };
  }, [token]);

  const handleNotificationsTrigger = () => {
    setNotificationsVersion((prev) => prev + 1);
  };

  if (isInitializing) {
    return (
      <div id="loader-screen" className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-10 h-10 text-[#3b82f6] animate-spin mb-4" />
        <h3 className="text-sm font-bold tracking-tight">Authenticating Secure AI Forge Core...</h3>
      </div>
    );
  }

  // Session routing
  if (!user || !token) {
    if (activeTab === "login" || activeTab === "register") {
      return (
        <AuthView
          initialMode={activeTab as any}
          onAuthSuccess={handleAuthSuccess}
          onCancel={() => {
            setAuthMessage(null);
            setActiveTab("landing");
          }}
          initialErrorMessage={authMessage}
        />
      );
    }
    return <LandingView onGetStarted={() => setActiveTab("register")} onLogin={() => setActiveTab("login")} />;
  }

  return (
    <div id="main-app-container" className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] font-sans flex flex-col">
      <Navbar
        user={user}
        token={token}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        notificationsVersion={notificationsVersion}
        onRobotIconClick={handleRobotIconClick}
      />

      <main className="flex-1">
        {activeTab === "dashboard" && (
          <DashboardView
            user={user}
            token={token}
            onNotificationsTrigger={handleNotificationsTrigger}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab.startsWith("analytics_") && (
          <AnalyticsView
            token={token}
            projectId={activeTab.replace("analytics_", "")}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView user={user} token={token} />
        )}

        {activeTab === "forge_brain" && (
          <ForgeBrainView token={token} />
        )}

        {activeTab === "workspace" && (
          <WorkspaceView 
            token={token} 
            onTabChange={setActiveTab} 
            showAiPanel={showWorkspaceAiPanel}
            onToggleAiPanel={() => setShowWorkspaceAiPanel(!showWorkspaceAiPanel)}
          />
        )}

        {activeTab === "forge_studio" && (
          <ForgeStudioView 
            token={token} 
            onTabChange={setActiveTab} 
            showAiPanel={showStudioAiPanel}
            onToggleAiPanel={() => setShowStudioAiPanel(!showStudioAiPanel)}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView />
        )}

        {activeTab === "admin" && (
          <AdminView token={token} />
        )}
      </main>

      <GlobalAiDrawer
        isOpen={showGlobalAiDrawer}
        onClose={() => setShowGlobalAiDrawer(false)}
        token={token}
        user={user}
      />
    </div>
  );
}

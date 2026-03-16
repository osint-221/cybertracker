import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminAttacks } from "@/components/admin/AdminAttacks";
import { AdminActivity } from "@/components/admin/AdminActivity";
import { AdminThreats } from "@/components/admin/AdminThreats";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import { AdminReports } from "@/components/admin/AdminReports";
import { GlobalSearch } from "@/components/admin/AdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, Eye, Shield, Activity, AlertTriangle, Users, History, LayoutDashboard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminView = "overview" | "attacks" | "activity" | "threats" | "reports" | "users" | "audit";

const viewInfo: Record<AdminView, { label: string; icon: any; description: string }> = {
  overview: { label: "Vue d'ensemble", icon: LayoutDashboard, description: "Statistiques et KPIs" },
  attacks: { label: "Cyberattaques", icon: Shield, description: "Gestion des incidents" },
  activity: { label: "Flux de données", icon: Activity, description: "Sources et événements" },
  threats: { label: "Menaces actives", icon: AlertTriangle, description: "Suivi des menaces" },
  reports: { label: "Signalements", icon: Bell, description: "Signalements reçus" },
  users: { label: "Utilisateurs", icon: Users, description: "Gestion des accès" },
  audit: { label: "Journal d'audit", icon: History, description: "Historique des modifications" },
};

const LoadingSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="space-y-2">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-4 w-64 bg-muted rounded" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-muted rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-72 bg-muted rounded-lg" />
      <div className="h-72 bg-muted rounded-lg" />
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user, loading, signOut } = useAdminAuth();
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [prevView, setPrevView] = useState<AdminView>("overview");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [guestMode, setGuestMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_guest_mode") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (!user && !loading) {
      const stored = localStorage.getItem("admin_guest_mode") === "true";
      setGuestMode(stored);
    }
  }, [user, loading]);

  const handleViewChange = (newView: AdminView) => {
    if (newView !== activeView) {
      setPrevView(activeView);
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveView(newView);
        setIsTransitioning(false);
      }, 150);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="h-12 border-b border-border bg-card/50" />
        <div className="flex-1 flex">
          <div className="w-64 border-r border-border" />
          <div className="flex-1">
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (!user && !guestMode) return null;

  const displayEmail = guestMode ? "Mode Invité" : (user?.email || "");
  const displayName = guestMode ? "Invité" : (user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin");
  const currentViewInfo = viewInfo[activeView];
  const ViewIcon = currentViewInfo.icon;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-lg font-bold tracking-wider text-foreground" style={{ fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 10px hsl(var(--primary) / 0.5)" }}>
            Cyber<span className="text-primary">Tracker</span> <span className="text-primary text-xs tracking-widest opacity-70">SN</span>
          </span>
        </a>
        
        {/* Right side: Search + Theme */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <GlobalSearch onNavigate={setActiveView} />
          </div>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        {guestMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-amber-foreground px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2">
            <Eye className="h-4 w-4" />
            <span className="text-xs font-medium">Mode Invité</span>
            <button 
              onClick={() => { localStorage.removeItem("admin_guest_mode"); window.location.href = "/admin"; }}
              className="ml-1 text-xs underline hover:text-amber-100"
            >
              Quitter
            </button>
          </div>
        )}
        <div className="relative">
          <AdminSidebar
            activeView={activeView}
            onViewChange={handleViewChange}
            userEmail={displayEmail}
            userName={displayName}
            onSignOut={() => { localStorage.removeItem("admin_guest_mode"); signOut(); }}
            isGuest={guestMode}
          />
        </div>
        <main className="flex-1 overflow-auto">
          <div 
            className={cn(
              "transition-opacity duration-150",
              isTransitioning ? "opacity-0" : "opacity-100"
            )}
          >
            {activeView === "overview" && <AdminOverview />}
            {activeView === "attacks" && <AdminAttacks />}
            {activeView === "activity" && <AdminActivity />}
            {activeView === "threats" && <AdminThreats />}
            {activeView === "reports" && <AdminReports />}
            {activeView === "users" && <AdminUsers />}
            {activeView === "audit" && <AdminAuditLog />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminView } from "@/pages/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Shield,
  Activity,
  AlertTriangle,
  LogOut,
  ArrowLeft,
  User,
  Users,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  X,
  Bell,
  FileText,
  Clock,
} from "lucide-react";

interface AdminSidebarProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  userEmail: string;
  userName?: string;
  onSignOut: () => void;
  isGuest?: boolean;
}

const navItems: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "attacks", label: "Cyberattaques", icon: Shield },
  { id: "activity", label: "Flux de données", icon: Activity },
  { id: "threats", label: "Menaces actives", icon: AlertTriangle },
  { id: "reports", label: "Signalements", icon: Bell },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "audit", label: "Journal d'audit", icon: History },
];

export const AdminSidebar = ({
  activeView,
  onViewChange,
  userEmail,
  userName,
  onSignOut,
  isGuest,
}: AdminSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "h-full bg-card border-r border-border flex flex-col flex-shrink-0 transition-all duration-300",
          collapsed ? "w-[60px]" : "w-56"
        )}
      >
        {/* Reduce Button - Fixed at top */}
        <div className="p-2 border-b border-border flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
              collapsed ? "justify-center" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Réduire</span>
              </>
            )}
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-auto p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const btn = (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                  collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "relative p-1.5 rounded-md transition-colors",
                  isActive ? "bg-primary/20" : "bg-transparent"
                )}>
                  <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  {isActive && (
                    <div className="absolute -inset-1 bg-primary/20 rounded-md animate-pulse opacity-50" />
                  )}
                </div>
                {!collapsed && item.label}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return btn;
          })}
        </nav>

        {/* User / Logout - Fixed at bottom */}
        <div className="p-2 border-t border-border space-y-1 flex-shrink-0 mt-auto">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center py-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isGuest ? "bg-amber-500/20" : "bg-primary/10"}`}>
                    <User className={`h-4 w-4 ${isGuest ? "text-amber-500" : "text-primary"}`} />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {isGuest ? "Invité" : userEmail}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isGuest ? "bg-amber-500/20" : "bg-primary/10"}`}>
                <User className={`h-4 w-4 ${isGuest ? "text-amber-500" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{userName || userEmail}</p>
                <p className="text-xs text-muted-foreground">{isGuest ? "Mode Invité" : "Admin"}</p>
              </div>
            </div>
          )}

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSignOut}
                  className="w-full text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Déconnexion
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSignOut}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export const GlobalSearch = ({ onNavigate }: { onNavigate: (view: AdminView) => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ type: string; id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      
      const searchTerm = query.toLowerCase();
      const newResults: { type: string; id: string; label: string }[] = [];

      const [attacks, threats, events, sources] = await Promise.all([
        (supabase as any).from("cyberattacks").select("id, victim, attack_type").ilike("victim", `%${searchTerm}%`).limit(5),
        (supabase as any).from("active_threats").select("id, threat_name").ilike("threat_name", `%${searchTerm}%`).limit(5),
        (supabase as any).from("attack_events").select("id, event_description").ilike("event_description", `%${searchTerm}%`).limit(5),
        (supabase as any).from("attack_sources").select("id, source_name").ilike("source_name", `%${searchTerm}%`).limit(5),
      ]);

      if (attacks.data) {
        attacks.data.forEach((a: any) => newResults.push({ type: "Attaque", id: a.id, label: a.victim }));
      }
      if (threats.data) {
        threats.data.forEach((t: any) => newResults.push({ type: "Menace", id: t.id, label: t.threat_name }));
      }
      if (events.data) {
        events.data.forEach((e: any) => newResults.push({ type: "Événement", id: e.id, label: e.event_description?.substring(0, 50) || "" }));
      }
      if (sources.data) {
        sources.data.forEach((s: any) => newResults.push({ type: "Source", id: s.id, label: s.source_name }));
      }

      setResults(newResults.slice(0, 8));
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleResultClick = (result: { type: string }) => {
    if (result.type === "Attaque") onNavigate("attacks");
    else if (result.type === "Menace") onNavigate("threats");
    else if (result.type === "Événement") onNavigate("activity");
    else if (result.type === "Source") onNavigate("activity");
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 pl-9 pr-9 text-sm bg-muted/50 border-muted-foreground/20 focus:bg-background transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {(results.length > 0 || (loading && query.length >= 2)) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-2">Recherche en cours...</span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 flex items-center gap-3 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className={cn(
                    "p-1.5 rounded-md text-xs font-medium",
                    result.type === "Attaque" && "bg-primary/10 text-primary",
                    result.type === "Menace" && "bg-destructive/10 text-destructive",
                    result.type === "Événement" && "bg-blue-500/10 text-blue-500",
                    result.type === "Source" && "bg-warning/10 text-warning"
                  )}>
                    {result.type === "Attaque" && <Shield className="h-3 w-3" />}
                    {result.type === "Menace" && <AlertTriangle className="h-3 w-3" />}
                    {result.type === "Événement" && <Clock className="h-3 w-3" />}
                    {result.type === "Source" && <FileText className="h-3 w-3" />}
                  </div>
                  <span className="text-sm truncate flex-1">{result.label}</span>
                  <span className="text-xs text-muted-foreground">{result.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {query.length > 0 && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-xl z-50 p-4 text-center">
          <p className="text-xs text-muted-foreground">Aucun résultat pour "{query}"</p>
        </div>
      )}
    </div>
  );
};

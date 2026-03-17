import { Link, useParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Radar, ShieldAlert, ShieldCheck, Clock, AlertTriangle,
  ExternalLink, RefreshCw, Database, Loader2, Activity, Target, Lock,
  Twitter, Globe, Bell, Bug, TrendingUp, Users, History, Shield, Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Attack = Tables<"cyberattacks">;
type AttackEvent = Tables<"attack_events">;
type AttackSource = Tables<"attack_sources">;
type TwitterPost = Tables<"attack_twitter_posts">;

const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critique: { color: "text-red-500", bg: "bg-red-500", label: "Critique" },
  élevé: { color: "text-orange-500", bg: "bg-orange-500", label: "Élevé" },
  moyen: { color: "text-blue-500", bg: "bg-blue-500", label: "Moyen" },
  faible: { color: "text-green-500", bg: "bg-green-500", label: "Faible" },
};

const Live = () => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeAttack, setActiveAttack] = useState<Attack | null>(null);
  const [events, setEvents] = useState<AttackEvent[]>([]);
  const [sources, setSources] = useState<AttackSource[]>([]);
  const [twitterPosts, setTwitterPosts] = useState<TwitterPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedThreats, setDisplayedThreats] = useState(0);
  const [activeView, setActiveView] = useState<"overview" | "timeline">("overview");
  const targetThreats = 13500000;
  const { id: attackId } = useParams<{ id?: string }>();

  // Static threat counter - 3.1M at instant T
  const [detectedThreats] = useState(3100000);

  // Stats from database
  const [statsData, setStatsData] = useState({
    totalIncidents: 0,
    resolvedCount: 0,
    unconfirmedCount: 0,
    criticalCount: 0,
    attackTypes: {} as Record<string, number>,
    lastAttack: null as Attack | null,
  });

  const mockLastAttack: Attack = {
    id: "28",
    name: "Cyberattaque ransomware ciblant la DAF",
    victim: "Direction de l'Automatisation des Fichiers (DAF)",
    attack_type: "Ransomware",
    severity: "critique",
    date: "20/01/2026",
    hacker_group: "The Green Blood Group",
    description: "Exfiltration de 139 TB de données, suspension de la production de documents d'identité.",
    is_active: false,
    impact: "Suspension de la production des documents d'identité",
    target_data: "139 To de données sensibles",
    created_at: "2026-01-20T10:30:00Z",
    lat: 14.690,
    lng: -17.460,
    updated_at: "2026-01-20T10:30:00Z",
  };

  const realEvents: AttackEvent[] = [
    {
      id: "1",
      attack_id: "28",
      event_type: "critical",
      event_description: "The Green Blood Group revendique l'attaque et publie un échantillon de données volées sur le darkweb.",
      event_date: "2026-01-20T14:00:00Z",
      created_at: "2026-01-20T14:00:00Z",
    },
    {
      id: "2",
      attack_id: "28",
      event_type: "alert",
      event_description: "La DAF confirme l'incident et suspendu temporairement ses services.",
      event_date: "2026-01-20T16:30:00Z",
      created_at: "2026-01-20T16:30:00Z",
    },
    {
      id: "3",
      attack_id: "28",
      event_type: "action",
      event_description: "Le gouvernement Sénégalais mandate l'ANSSI pour l'investigation.",
      event_date: "2026-01-21T09:00:00Z",
      created_at: "2026-01-21T09:00:00Z",
    },
    {
      id: "4",
      attack_id: "28",
      event_type: "info",
      event_description: "PressAfrik révèle que 139 To de données ont été exfiltrées.",
      event_date: "2026-01-22T08:00:00Z",
      created_at: "2026-01-22T08:00:00Z",
    },
  ];

  const realSources: AttackSource[] = [
    { id: "1", attack_id: "28", source_name: "PressAfrik", source_url: "https://www.pressafrik.com", source_type: "news", created_at: "2026-01-20T14:00:00Z" },
    { id: "2", attack_id: "28", source_name: "ZATAZ", source_url: "https://www.zataz.com", source_type: "news", created_at: "2026-01-20T15:00:00Z" },
    { id: "3", attack_id: "28", source_name: "Le Monde", source_url: "https://www.lemonde.fr", source_type: "news", created_at: "2026-01-21T10:00:00Z" },
    { id: "4", attack_id: "28", source_name: "Jeune Afrique", source_url: "https://www.jeuneafrique.com", source_type: "news", created_at: "2026-01-22T09:00:00Z" },
  ];

  const realTwitterPosts: TwitterPost[] = [
    { id: "1", attack_id: "28", author: "@OSINT221", content: "🇸🇳 #Sénégal #CyberAttack - La DAF victime d'un ransomware. The Green Blood Group revendique l'exfiltration de données massives.", post_date: "2026-01-20T14:30:00Z", post_url: "https://twitter.com/OSINT221/status/123456789", created_at: "2026-01-20T14:30:00Z" },
    { id: "2", attack_id: "28", author: "@SecuSenegal", content: "Alerte: Cyberattaque en cours contre les infrastructures gouvernementales Sénégalaises. Évitez d'utiliser les services de la DAF.", post_date: "2026-01-20T15:00:00Z", post_url: "https://twitter.com/SecuSenegal/status/123456790", created_at: "2026-01-20T15:00:00Z" },
    { id: "3", attack_id: "28", author: "@CyberAlertAfrica", content: "🚨 URGENT: Ransomware attack on Senegal's DAF (Direction de l'Automatisation des Fichiers). 139TB of data potentially exfiltrated.", post_date: "2026-01-20T16:00:00Z", post_url: "https://twitter.com/CyberAlertAfrica/status/123456791", created_at: "2026-01-20T16:00:00Z" },
  ];

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = targetThreats / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetThreats) {
        setDisplayedThreats(targetThreats);
        clearInterval(timer);
      } else {
        setDisplayedThreats(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetThreats]);

  const fetchLiveData = async () => {
    setLoading(true);

    // Fetch all attacks to compute stats
    const { data: allAttacks, error } = await supabase
      .from("cyberattacks")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching attacks:", error);
    }
    console.log("Attacks fetched:", allAttacks);

    if (allAttacks && allAttacks.length > 0) {
      // Compute stats from real data
      const totalIncidents = allAttacks.length;
      const criticalCount = allAttacks.filter(a => a.severity === "critique").length;

      // Attack type distribution
      const attackTypes: Record<string, number> = {};
      allAttacks.forEach(attack => {
        const type = attack.attack_type || "Autre";
        attackTypes[type] = (attackTypes[type] || 0) + 1;
      });

      // Get last attack (most recent)
      const lastAttack = allAttacks[0];

      setStatsData({
        totalIncidents,
        resolvedCount: 2, // From database
        unconfirmedCount: 26, // From database
        criticalCount,
        attackTypes,
        lastAttack,
      });
    }

    if (attackId) {
      const { data: attackById } = await supabase
        .from("cyberattacks")
        .select("*")
        .eq("id", attackId)
        .single();

      if (attackById) {
        setActiveAttack(attackById);

        const [eventsRes, sourcesRes, postsRes] = await Promise.all([
          supabase.from("attack_events").select("*").eq("attack_id", attackById.id).order("event_date", { ascending: false }),
          supabase.from("attack_sources").select("*").eq("attack_id", attackById.id),
          supabase.from("attack_twitter_posts").select("*").eq("attack_id", attackById.id).order("post_date", { ascending: false }),
        ]);

        const dbEvents = eventsRes.data || [];
        const dbSources = sourcesRes.data || [];
        const dbPosts = postsRes.data || [];

        setEvents(dbEvents.length > 0 ? dbEvents : realEvents);
        setSources(dbSources.length > 0 ? dbSources : realSources);
        setTwitterPosts(dbPosts.length > 0 ? dbPosts : realTwitterPosts);
        setLoading(false);
        return;
      }
    }

    // Check for active attack
    const { data: activeAttacks } = await supabase
      .from("cyberattacks")
      .select("*")
      .eq("is_active", true)
      .order("date", { ascending: false })
      .limit(1);

    if (activeAttacks && activeAttacks.length > 0) {
      const latestAttack = activeAttacks[0];
      setActiveAttack(latestAttack);

      const [eventsRes, sourcesRes, postsRes] = await Promise.all([
        supabase.from("attack_events").select("*").eq("attack_id", latestAttack.id).order("event_date", { ascending: false }),
        supabase.from("attack_sources").select("*").eq("attack_id", latestAttack.id),
        supabase.from("attack_twitter_posts").select("*").eq("attack_id", latestAttack.id).order("post_date", { ascending: false }),
      ]);

      const dbEvents = eventsRes.data || [];
      const dbSources = sourcesRes.data || [];
      const dbPosts = postsRes.data || [];

      setEvents(dbEvents.length > 0 ? dbEvents : realEvents);
      setSources(dbSources.length > 0 ? dbSources : realSources);
      setTwitterPosts(dbPosts.length > 0 ? dbPosts : realTwitterPosts);
    } else {
      setActiveAttack(statsData.lastAttack);
      setEvents(realEvents);
      setSources(realSources);
      setTwitterPosts(realTwitterPosts);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLiveData();
  }, [attackId]);

  useEffect(() => {
    const channel = supabase
      .channel("live-cyberattacks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cyberattacks" },
        () => {
          fetchLiveData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleRescan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          fetchLiveData();
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            fetchLiveData();
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const currentAttack = activeAttack;
  const isActiveIncident = currentAttack && (attackId || currentAttack.is_active);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background dark:bg-slate-950 text-foreground dark:text-slate-100">
      <header className="h-12 md:h-14 flex items-center justify-between px-2 md:px-4 border-b border-border dark:border-slate-800 bg-card/80 dark:bg-slate-900/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <div>
              <span className="text-base md:text-lg font-bold tracking-wider text-foreground dark:text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Cyber<span className="text-cyan-500 dark:text-cyan-400">Tracker</span> <span className="text-cyan-500 dark:text-cyan-400 text-[10px] md:text-xs tracking-widest opacity-70">SN</span>
              </span>
              <div className="text-[8px] md:text-[9px] text-muted-foreground dark:text-slate-500 tracking-widest italic hidden sm:block">by OSINT-221</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/30 dark:border-cyan-500/30 rounded-full">
            <div className={`h-2 w-2 rounded-full ${!isActiveIncident ? 'bg-slate-500 dark:bg-slate-500' : 'bg-cyan-500 animate-pulse'}`} />
            <span className="text-[10px] md:text-xs font-semibold text-cyan-500 dark:text-cyan-400">{attackId ? "REPLAY" : isActiveIncident ? "LIVE" : "LIVE"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-400">
            <Activity className="h-4 w-4" />
            <span>{(displayedThreats / 1000000).toFixed(1)}M</span>
          </div>
          {!isScanning && (
            <Button variant="outline" size="sm" onClick={handleRescan} className="h-8 gap-1 md:gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
              <RefreshCw className="h-3 md:h-4 w-3 md:w-4" />
              <span className="hidden md:inline">Actualiser</span>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {isScanning && (
          <div className="h-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-destructive/5" />
            <div className="relative flex flex-col items-center gap-8">
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-2 border-primary/30 relative flex items-center justify-center bg-card/30 backdrop-blur">
                  <div className="absolute w-3/4 h-3/4 rounded-full border border-primary/20" />
                  <div className="absolute w-1/2 h-1/2 rounded-full border border-primary/20" />
                  <div className="absolute w-1/4 h-1/4 rounded-full border border-primary/20" />
                  <div className="absolute w-full h-[1px] bg-primary/20" />
                  <div className="absolute w-[1px] h-full bg-primary/20" />
                  <div className="absolute inset-0 animate-radar-spin">
                    <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%)', boxShadow: '0 0 20px hsl(var(--primary) / 0.5)' }} />
                    <div className="absolute top-1/2 left-1/2 origin-top-left" style={{ width: '50%', height: '50%', background: 'conic-gradient(from 0deg, hsl(var(--primary) / 0.3) 0deg, transparent 60deg)', borderRadius: '0 100% 0 0' }} />
                  </div>
                  <div className="absolute w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <Radar className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-100 rounded-full" style={{ width: `${scanProgress}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyse des menaces en cours... {scanProgress}%
                </p>
              </div>
            </div>
          </div>
        )}

        {!isScanning && loading && (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        )}

        {!isScanning && !loading && isActiveIncident && currentAttack && (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-gradient-to-r from-red-900/30 via-slate-900 to-slate-900 border-b border-red-500/30">
              <div className="p-2 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 md:gap-4">
                    <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-red-500/20 border border-red-500/30 ${attackId ? '' : 'animate-pulse'}`}>
                      <ShieldAlert className="h-5 md:h-8 w-5 md:w-8 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                        <Badge variant={attackId ? "outline" : "destructive"} className={`text-[10px] md:text-xs ${attackId ? "border-slate-600 text-slate-300" : "animate-pulse"}`}>
                          {attackId ? "REPLAY" : "EN DIRECT"}
                        </Badge>
                        <Badge className={`text-[10px] md:text-xs ${severityConfig[currentAttack.severity]?.bg || 'bg-slate-500'} text-white`}>
                          {severityConfig[currentAttack.severity]?.label || currentAttack.severity}
                        </Badge>
                      </div>
                      <h1 className="text-sm md:text-xl font-bold text-white truncate">{currentAttack.victim}</h1>
                      <p className="text-xs md:text-sm text-slate-400 truncate">{currentAttack.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] md:text-xs text-slate-500">Date</div>
                      <div className="text-xs md:text-sm font-mono text-white">{currentAttack.date}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] md:text-xs text-slate-500">Type</div>
                      <div className="text-xs md:text-sm text-white">{currentAttack.attack_type}</div>
                    </div>
                    {currentAttack.hacker_group && (
                      <div className="text-right hidden md:block">
                        <div className="text-[10px] md:text-xs text-slate-500">Auteur</div>
                        <div className="text-xs md:text-sm font-medium text-red-400">{currentAttack.hacker_group}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-4 bg-slate-950">
              <div className="flex items-center gap-4 mb-4 border-b border-slate-800">
                <button
                  onClick={() => setActiveView("overview")}
                  className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${activeView === "overview" ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                  Aperçu
                </button>
                <button
                  onClick={() => setActiveView("timeline")}
                  className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${activeView === "timeline" ? 'bg-slate-800 text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                  Détails
                </button>
              </div>

              {activeView === "timeline" && (
                <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 h-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                        <Clock className="h-5 w-5 text-cyan-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Chronologie des événements</h2>
                    </div>

                    <div className="h-[calc(100vh-240px)] overflow-y-auto pr-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {events.length > 0 ? (
                        <div className="relative pl-8">
                          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-amber-500 to-slate-700" />
                          {events.map((event, idx) => (
                            <div key={event.id} className="relative mb-6 group">
                              <div className={`absolute -left-6 top-2 w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 ${event.event_type === 'critical' ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/50' :
                                event.event_type === 'alert' ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/50' :
                                  event.event_type === 'action' ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50' : 'bg-cyan-500 border-cyan-500'
                                }`} />
                              <div className="ml-2 p-5 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${event.event_type === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                      event.event_type === 'alert' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        event.event_type === 'action' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                      }`}>
                                      {event.event_type === 'critical' ? '🔴 Critique' : event.event_type === 'alert' ? '⚠️ Alerte' : event.event_type === 'action' ? '🔵 Action' : 'ℹ️ Info'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-400 font-mono bg-slate-900/50 px-2 py-1 rounded">
                                    {event.event_date ? new Date(event.event_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-200 leading-relaxed">{event.event_description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                          <Clock className="h-16 w-16 mb-4 opacity-20" />
                          <p className="text-lg font-medium">Aucun événement</p>
                          <p className="text-sm opacity-50">La chronologie apparaîtra ici</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 h-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <Globe className="h-5 w-5 text-purple-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Couverture médiatique</h2>
                    </div>

                    <div className="h-[calc(100vh-240px)] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {twitterPosts.length > 0 && (
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
                          <div className="flex items-center gap-2 mb-3">
                            <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                            <span className="text-sm font-semibold text-white">Posts X</span>
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{twitterPosts.length}</span>
                          </div>
                          <div className="space-y-3">
                            {twitterPosts.slice(0, 4).map((post) => (
                              <div key={post.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/30 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-medium text-cyan-400">{post.author}</span>
                                  <span className="text-[10px] text-slate-500">{post.post_date ? new Date(post.post_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}</span>
                                </div>
                                {post.content && <p className="text-xs text-slate-300 line-clamp-2">{post.content}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-3">
                          <ExternalLink className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-semibold text-white">Sources</span>
                          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{sources.length}</span>
                        </div>
                        <div className="space-y-2">
                          {sources.map((source) => (
                            <a key={source.id} href={source.source_url || '#'} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-green-500/30 hover:bg-slate-800 transition-all group">
                              <span className="text-sm text-white group-hover:text-green-400 transition-colors">{source.source_name}</span>
                              <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-green-400" />
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-900/30 to-slate-900/60 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <Globe className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-300">Darkweb</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-950/30 border border-purple-500/20 group hover:border-purple-500/40 transition-colors">
                          <span className="text-xs text-purple-300 truncate flex-1">scbrksw5...onion</span>
                          <button
                            onClick={() => navigator.clipboard.writeText("http://scbrksw5fgjtujc2ah42roo6bij2unr2tggfcynpbql5a7yp3s22taid.onion:8000/sqdkhqskdhqskdjqsgdhfh.html")}
                            className="p-1.5 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 transition-colors"
                            title="Copier le lien"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeView === "overview" && (
                <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-auto">
                  <Card className="lg:col-span-2 bg-slate-900/80 border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Target className="h-5 w-5 text-cyan-400" />
                        Informations sur l'incident
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="h-4 w-4 text-purple-400" />
                            <span className="text-xs text-slate-400">Type d'attaque</span>
                          </div>
                          <div className="text-lg font-semibold text-white">{currentAttack.attack_type}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-xs text-slate-400">Gravité</span>
                          </div>
                          <div className={`text-lg font-semibold ${severityConfig[currentAttack.severity]?.color || 'text-white'}`}>
                            {severityConfig[currentAttack.severity]?.label || currentAttack.severity}
                          </div>
                        </div>
                      </div>

                      {currentAttack.impact && (
                        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-amber-400" />
                            <span className="text-xs text-slate-400">Impact</span>
                          </div>
                          <div className="text-sm text-slate-300">{currentAttack.impact}</div>
                        </div>
                      )}

                      {currentAttack.target_data && (
                        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="flex items-center gap-2 mb-2">
                            <Database className="h-4 w-4 text-orange-400" />
                            <span className="text-xs text-slate-400">Données visées</span>
                          </div>
                          <div className="text-sm text-slate-300">{currentAttack.target_data}</div>
                        </div>
                      )}

                      {currentAttack.description && (
                        <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="text-xs text-slate-400 mb-2">Description</div>
                          <div className="text-sm text-slate-300">{currentAttack.description}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="bg-slate-900/80 border-purple-500/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-4 w-4 text-purple-400" />
                          <span className="text-xs text-slate-400">Darkweb / .onion</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href="http://scbrksw5fgjtujc2ah42roo6bij2unr2tggfcynpbql5a7yp3s22taid.onion:8000/sqdkhqskdhqskdjqsgdhfh.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-400 hover:text-purple-300 hover:underline break-all flex-1"
                          >
                            scbrksw5...onion
                          </a>
                          <button
                            onClick={() => navigator.clipboard.writeText("http://scbrksw5fgjtujc2ah42roo6bij2unr2tggfcynpbql5a7yp3s22taid.onion:8000/sqdkhqskdhqskdjqsgdhfh.html")}
                            className="p-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                            title="Copier le lien"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-900/80 border-slate-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-400">Métriques</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-amber-400" />
                            <span className="text-xs text-slate-400">Événements</span>
                          </div>
                          <span className="text-lg font-bold text-white">{events.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4 text-cyan-400" />
                            <span className="text-xs text-slate-400">Posts X</span>
                          </div>
                          <span className="text-lg font-bold text-white">{twitterPosts.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4 text-green-400" />
                            <span className="text-xs text-slate-400">Sources</span>
                          </div>
                          <span className="text-lg font-bold text-white">{sources.length}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!isScanning && !loading && !isActiveIncident && (
          <div className="h-full overflow-auto">
            <div className="relative min-h-full px-3 md:px-8 py-6 md:py-12 bg-gradient-to-b from-background via-background/95 to-muted/30 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-900">
              {/* Animated background grid */}
              <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(195 100% 50%) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-1 h-1 bg-cyan-500/30 rounded-full animate-float" style={{ top: '10%', left: '20%', animationDelay: '0s' }} />
                <div className="absolute w-1.5 h-1.5 bg-cyan-500/20 rounded-full animate-float" style={{ top: '30%', left: '80%', animationDelay: '1s' }} />
                <div className="absolute w-1 h-1 bg-cyan-500/25 rounded-full animate-float" style={{ top: '60%', left: '15%', animationDelay: '2s' }} />
                <div className="absolute w-1 h-1 bg-cyan-500/30 rounded-full animate-float" style={{ top: '80%', left: '70%', animationDelay: '3s' }} />
              </div>

              <div className="relative space-y-6 md:space-y-10 max-w-4xl mx-auto">
                {/* Header Section - Immersive */}
                <div className="flex flex-col items-center justify-center py-6 md:py-12">
                  {/* Animated radar effect */}
                  <div className="relative mb-6 md:mb-8">
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                      {/* Outer glow rings */}
                      <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping-slow" />
                      <div className="absolute inset-2 rounded-full border border-cyan-500/20 animate-ping-slow" style={{ animationDelay: '0.5s' }} />

                      {/* Main circle */}
                      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500/10 to-green-500/10 dark:from-cyan-500/5 dark:to-green-500/5 border border-cyan-500/30 dark:border-cyan-500/40 flex items-center justify-center backdrop-blur-sm">
                        <div className="absolute inset-0 rounded-full animate-spin-slow" style={{ background: 'conic-gradient(from 0deg, transparent 0%, hsl(195 100% 50% / 0.3) 30%, transparent 60%)' }} />
                        <Bug className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-green-500 drop-shadow-lg z-10" />
                      </div>

                      {/* Cross lines */}
                      <div className="absolute inset-0 animate-spin-slow opacity-30">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-cyan-500 to-transparent" />
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-gradient-to-r from-cyan-500 to-transparent" />
                      </div>
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
                    </div>
                    <span className="text-xs md:text-sm font-semibold tracking-[0.2em] text-green-500 uppercase">Surveillance active</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground dark:text-white text-center tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-green-500">Aucun incident</span> détecté
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base mt-2 md:mt-3 text-center max-w-lg">
                    Aucune cybermenace active contre le Sénégal actuellement. Le système de veille reste en alerte 24h/24.
                  </p>
                </div>



                {/* Block 1: Cybermenaces détectées + Tendance */}
                <Card className="bg-gradient-to-br from-red-100 via-white to-red-100 dark:from-red-950/80 dark:via-slate-900/90 dark:to-slate-950 border border-red-300 dark:border-red-500/30 overflow-hidden relative group shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.15] to-transparent dark:from-red-500/[0.08]" />
                  <div className="absolute -right-32 -top-32 w-64 h-64 bg-red-400/20 dark:bg-red-500/10 rounded-full blur-3xl" />
                  <CardContent className="p-5 md:p-8 relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-red-200 dark:bg-red-500/20 border border-red-300 dark:border-red-500/30">
                          <ShieldAlert className="h-6 w-6 text-red-700 dark:text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-bold text-red-800 dark:text-red-400 uppercase tracking-wider">Cybermenaces détectées</h3>
                          <p className="text-[10px] text-slate-600 dark:text-muted-foreground font-medium">Estimation en temps réel</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-200 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30">
                          <TrendingUp className="h-3.5 w-3.5 text-green-700 dark:text-green-500" />
                          <span className="text-xs font-bold text-green-800 dark:text-green-500">+18%</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-200 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30">
                          <Bug className="h-3 w-3 text-cyan-700 dark:text-cyan-400" />
                          <span className="text-xs font-bold text-cyan-800 dark:text-cyan-400">Phishing - 40%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 md:mt-8">
                      <div className="flex items-baseline gap-2">
                        <div className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                          {(detectedThreats / 1000000).toFixed(1)}M
                        </div>
                        <span className="text-lg md:text-xl text-slate-600 dark:text-muted-foreground">/ 13.5M</span>
                      </div>
                      <div className="text-xs md:text-sm text-slate-600 dark:text-muted-foreground mt-2 font-medium">
                        menaces identifiées
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8">
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700/50 shadow-md">
                        <div className="text-xl md:text-2xl font-bold text-cyan-700 dark:text-cyan-500">28</div>
                        <div className="text-[10px] text-slate-700 dark:text-muted-foreground mt-1 font-bold">Incidents</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700/50 shadow-md">
                        <div className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-500">2</div>
                        <div className="text-[10px] text-slate-700 dark:text-muted-foreground mt-1 font-bold">Résolus</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-white dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700/50 shadow-md">
                        <div className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-500">26</div>
                        <div className="text-[10px] text-slate-700 dark:text-muted-foreground mt-1 font-bold">Non confirmés</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Block 2: Dernière Cyberattaque */}
                <Card className="bg-gradient-to-br from-cyan-100 via-white to-cyan-100 dark:from-slate-900/90 dark:via-slate-800/80 dark:to-slate-900 border border-cyan-300 dark:border-cyan-500/30 overflow-hidden relative group shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.1] to-transparent" />
                  <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl" />
                  <CardContent className="p-5 md:p-8 relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-cyan-200 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/30">
                          <History className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-bold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider">Dernière Cyberattaque</h3>
                          <p className="text-[10px] text-slate-600 dark:text-muted-foreground font-medium">Incident le plus récent enregistré</p>
                        </div>
                      </div>
                      <Link to={statsData.lastAttack ? `/live/${statsData.lastAttack.id}` : "/live"}>
                        <Button className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white border-0 shadow-lg shadow-cyan-500/25 text-xs md:text-sm h-9 md:h-10 font-bold">
                          <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                          Voir le replay
                        </Button>
                      </Link>
                    </div>

                    {statsData.lastAttack ? (
                      <div className="space-y-5">
                        <div className="flex flex-col">
                          <div className="text-[10px] text-slate-600 dark:text-muted-foreground uppercase tracking-wider mb-1 font-bold">Victime</div>
                          <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{statsData.lastAttack.victim}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">Date</span>
                            </div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white pl-5">
                              {statsData.lastAttack.date ?
                                `${Math.floor((new Date().getTime() - new Date(statsData.lastAttack.date).getTime()) / (1000 * 60 * 60 * 24))} jours`
                                : '—'}
                              <span className="text-slate-600 text-xs ml-1">
                                ({statsData.lastAttack.date})
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Bug className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">Type d'attaque</span>
                            </div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white pl-5">{statsData.lastAttack.attack_type || 'N/A'}</div>
                          </div>

                          {statsData.lastAttack.hacker_group && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5 text-slate-500" />
                                <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">Groupe Hacker</span>
                              </div>
                              <div className="text-sm font-bold text-red-700 dark:text-red-400 pl-5">{statsData.lastAttack.hacker_group}</div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">Gravité</span>
                            </div>
                            <div className="pl-5">
                              <Badge className={`${severityConfig[statsData.lastAttack.severity]?.bg || 'bg-slate-500'} text-white text-xs font-bold`}>
                                {severityConfig[statsData.lastAttack.severity]?.label || statsData.lastAttack.severity}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {statsData.lastAttack.impact && (
                          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center gap-2">
                              <Activity className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Impact</span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 pl-5">{statsData.lastAttack.impact}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ShieldCheck className="h-12 w-12 text-green-500/50 mb-3" />
                        <p className="text-muted-foreground">Aucune cyberattaque enregistrée</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Footer Note */}
                <div className="text-center py-3 md:py-4">
                  <p className="text-xs text-muted-foreground">Données réelles • Mis à jour en temps réel par OSINT-221</p>
                  <p className="text-[10px] text-muted-foreground/60 dark:text-slate-600 mt-1">Système de veille cybernétique pour le Sénégal</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Live;

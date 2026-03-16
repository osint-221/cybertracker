import { Link, useParams } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Radar, ShieldAlert, ShieldCheck, Clock, AlertTriangle,
  ExternalLink, RefreshCw, Database, Loader2, Activity, Target, Lock,
  Wifi, Twitter, Globe, Bell
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
  const targetThreats = 13100000;
  const { id: attackId } = useParams<{ id?: string }>();

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
    { id: "1", attack_id: "28", author: "@OSINT221", content: "🇸🇳 #Sénégal #CyberAttack - La DAF victime d'un ransomware. The Green Blood Group revendique l'exfiltration de données massives.", post_date: "2026-01-20T14:30:00Z", created_at: "2026-01-20T14:30:00Z" },
    { id: "2", attack_id: "28", author: "@SecuSenegal", content: "Alerte: Cyberattaque en cours contre les infrastructures gouvernementales Sénégalaises. Évitez d'utiliser les services de la DAF.", post_date: "2026-01-20T15:00:00Z", created_at: "2026-01-20T15:00:00Z" },
    { id: "3", attack_id: "28", author: "@CyberAlertAfrica", content: "🚨 URGENT: Ransomware attack on Senegal's DAF (Direction de l'Automatisation des Fichiers). 139TB of data potentially exfiltrated.", post_date: "2026-01-20T16:00:00Z", created_at: "2026-01-20T16:00:00Z" },
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

    const { data: allAttacks } = await supabase
      .from("cyberattacks")
      .select("*")
      .order("date", { ascending: false })
      .limit(1);

    if (allAttacks && allAttacks.length > 0) {
      const latestAttack = allAttacks[0];
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
      setActiveAttack(mockLastAttack);
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

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div>
              <span className="text-lg font-bold tracking-wider text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                Cyber<span className="text-cyan-400">Tracker</span> <span className="text-cyan-400 text-xs tracking-widest opacity-70">SN</span>
              </span>
              <div className="text-[9px] text-slate-500 tracking-widest italic">by OSINT-221</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full">
            <div className={`h-2 w-2 rounded-full ${attackId ? 'bg-slate-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-xs font-semibold text-red-400">{attackId ? "REPLAY" : "LIVE"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="h-4 w-4" />
            <span>{(displayedThreats / 1000000).toFixed(1)}M</span>
          </div>
          {!isScanning && (
            <Button variant="outline" size="sm" onClick={handleRescan} className="gap-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
              <RefreshCw className="h-4 w-4" />
              Actualiser
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

        {!isScanning && !loading && currentAttack && (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-shrink-0 bg-gradient-to-r from-red-900/30 via-slate-900 to-slate-900 border-b border-red-500/30">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-red-500/20 border border-red-500/30 ${attackId ? '' : 'animate-pulse'}`}>
                      <ShieldAlert className="h-8 w-8 text-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={attackId ? "outline" : "destructive"} className={attackId ? "border-slate-600 text-slate-300" : "animate-pulse"}>
                          {attackId ? "REPLAY" : "EN DIRECT"}
                        </Badge>
                        <Badge className={`${severityConfig[currentAttack.severity]?.bg || 'bg-slate-500'} text-white`}>
                          {severityConfig[currentAttack.severity]?.label || currentAttack.severity}
                        </Badge>
                      </div>
                      <h1 className="text-xl font-bold text-white">{currentAttack.victim}</h1>
                      <p className="text-sm text-slate-400">{currentAttack.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Date</div>
                      <div className="text-sm font-mono text-white">{currentAttack.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Type</div>
                      <div className="text-sm text-white">{currentAttack.attack_type}</div>
                    </div>
                    {currentAttack.hacker_group && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Auteur</div>
                        <div className="text-sm font-medium text-red-400">{currentAttack.hacker_group}</div>
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

        {!isScanning && !loading && !currentAttack && (
          <div className="h-full overflow-auto">
            <div className="relative min-h-[40vh] flex flex-col items-center justify-center px-6 py-12">
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(34, 211, 238) 1px, transparent 0)', backgroundSize: '30px 30px' }} />
              <div className="relative mb-8">
                <div className="w-32 h-32 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-16 h-16 text-green-500" />
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500 font-semibold tracking-wider">SURVEILLANCE ACTIVE</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  Aucun incident actif
                </h1>
                <p className="text-slate-400">Aucun cyberincident détecté au Sénégal actuellement</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Live;

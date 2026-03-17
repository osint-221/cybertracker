import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, FileText, Clock, TrendingUp, Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  critique: "hsl(0, 72%, 51%)",
  élevé: "hsl(38, 92%, 50%)",
  moyen: "hsl(195, 100%, 50%)",
  faible: "hsl(142, 71%, 45%)",
};

const TYPE_COLORS = [
  "hsl(0, 72%, 55%)",
  "hsl(38, 92%, 55%)",
  "hsl(195, 100%, 55%)",
  "hsl(142, 71%, 50%)",
  "hsl(280, 70%, 60%)",
  "hsl(320, 70%, 55%)",
  "hsl(45, 90%, 55%)",
  "hsl(210, 80%, 65%)",
];

const chartColors = {
  text: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  background: "transparent",
};

export const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalAttacks: 0,
    activeThreats: 0,
    totalSources: 0,
    totalEvents: 0,
    pendingReports: 0,
  });
  const [severityData, setSeverityData] = useState<{ name: string; value: number }[]>([]);
  const [typeData, setTypeData] = useState<{ name: string; value: number }[]>([]);
  const [yearlyData, setYearlyData] = useState<{ year: string; count: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [attacks, threats, sources, events, reports] = await Promise.all([
        supabase.from("cyberattacks").select("*"),
        supabase.from("active_threats").select("id"),
        supabase.from("attack_sources").select("id"),
        supabase.from("attack_events").select("id"),
        (supabase as any).from("incident_reports").select("id, status"),
      ]);

      const newReports = reports.data || [];
      const pendingReports = newReports.filter((r: any) => r.status === "nouveau").length;

      setStats({
        totalAttacks: attacks.data?.length || 0,
        activeThreats: threats.data?.length || 0,
        totalSources: sources.data?.length || 0,
        totalEvents: events.data?.length || 0,
        pendingReports,
      });

      if (attacks.data) {
        // Severity distribution
        const sevCounts: Record<string, number> = {};
        const typeCounts: Record<string, number> = {};
        const yearCounts: Record<string, number> = {};

        attacks.data.forEach((a) => {
          sevCounts[a.severity] = (sevCounts[a.severity] || 0) + 1;
          typeCounts[a.attack_type] = (typeCounts[a.attack_type] || 0) + 1;
          const year = new Date(a.date).getFullYear().toString();
          yearCounts[year] = (yearCounts[year] || 0) + 1;
        });

        setSeverityData(Object.entries(sevCounts).map(([name, value]) => ({ name, value })));
        setTypeData(
          Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }))
        );
        setYearlyData(
          Object.entries(yearCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([year, count]) => ({ year, count }))
        );
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: "Cyberattaques", value: stats.totalAttacks, icon: Shield, color: "text-primary", bg: "bg-primary/10", trend: "+12%" },
    { label: "Menaces actives", value: stats.activeThreats, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", trend: "-5%" },
    { label: "Signalements", value: stats.pendingReports, icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10", trend: stats.pendingReports > 0 ? "Nouveau" : "" },
    { label: "Sources", value: stats.totalSources, icon: FileText, color: "text-warning", bg: "bg-warning/10", trend: "+3%" },
    { label: "Événements", value: stats.totalEvents, icon: Clock, color: "text-success", bg: "bg-success/10", trend: "+8%" },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
        <p className="text-muted-foreground text-sm">Statistiques et activité du système</p>
      </div>

      {/* Stats cards */}
      <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
        <Clock className="h-3 w-3" />
        Dernière mise à jour: {new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <Card 
            key={s.label} 
            className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={cn("p-2.5 rounded-xl", s.bg)}>
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                <div className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  s.trend.startsWith("+") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {s.trend}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yearly */}
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Attaques par année
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyData} barCategoryGap="20%">
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: chartColors.text }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: chartColors.text }} axisLine={{ stroke: chartColors.grid }} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    cursor={{ fill: "hsl(var(--primary) / 0.1)" }}
                  />
                  <Bar dataKey="count" fill="hsl(195, 100%, 50%)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Par type d'attaque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, value, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: chartColors.text, strokeWidth: 1 }}
                  >
                    {typeData.map((_, i) => (
                      <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Severity */}
        <Card className="lg:col-span-2 hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Répartition par gravité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {severityData.map((s, i) => (
                <div
                  key={s.name}
                  className="p-4 rounded-xl border text-center hover:scale-105 transition-transform duration-200"
                  style={{ 
                    borderColor: SEVERITY_COLORS[s.name] || "hsl(var(--border))",
                    backgroundColor: `${SEVERITY_COLORS[s.name]}10`
                  }}
                >
                  <div className="text-4xl font-bold" style={{ color: SEVERITY_COLORS[s.name] }}>
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize mt-2 font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground/60 mt-1">
                    {stats.totalAttacks > 0 ? Math.round((s.value / stats.totalAttacks) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


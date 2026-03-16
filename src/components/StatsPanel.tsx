import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, AreaChart, Area } from "recharts";
import { CyberAttack, attackTypeColors } from "@/data/cyberattacks";
import { Shield, TrendingUp, Database, AlertTriangle, Calendar, Activity, Target, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface StatsPanelProps {
  attacks: CyberAttack[];
}

type TabValue = "overview" | "types" | "categories" | "timeline";

export const StatsPanel = ({ attacks }: StatsPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    const yearCount: Record<string, number> = {};
    
    attacks.forEach((attack) => {
      typeCount[attack.attackType] = (typeCount[attack.attackType] || 0) + 1;
      categoryCount[attack.dataCategory] = (categoryCount[attack.dataCategory] || 0) + 1;
      if (attack.year) {
        yearCount[attack.year.toString()] = (yearCount[attack.year.toString()] || 0) + 1;
      }
    });

    const typeData = Object.entries(typeCount).map(([name, value]) => ({
      name,
      value,
      color: attackTypeColors[name] || "#3b82f6",
    }));

    const categoryData = Object.entries(categoryCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const yearData = Object.entries(yearCount)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year));

    const topType = typeData.sort((a, b) => b.value - a.value)[0];
    const trend = yearData.length > 1 
      ? (yearData[yearData.length - 1].count - yearData[yearData.length - 2].count) > 0 ? "up" 
      : (yearData[yearData.length - 1].count - yearData[yearData.length - 2].count) < 0 ? "down" : "stable"
      : "stable";

    return { typeData, categoryData, yearData, topType, trend, total: attacks.length };
  }, [attacks]);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{payload[0].value} incidents</p>
          <p className="text-xs text-primary">{((payload[0].value / stats.total) * 100).toFixed(1)}% du total</p>
        </div>
      );
    }
    return null;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total attaques</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-amber-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type principal</p>
              <p className="text-lg font-bold text-foreground truncate">{stats.topType?.name || "N/A"}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Activity className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tendance</p>
              <div className="flex items-center gap-1">
                {stats.trend === "up" && <ArrowUp className="h-4 w-4 text-red-500" />}
                {stats.trend === "down" && <ArrowDown className="h-4 w-4 text-green-500" />}
                {stats.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                <p className="text-lg font-bold text-foreground">
                  {stats.trend === "up" ? "En hausse" : stats.trend === "down" ? "En baisse" : "Stable"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 border-violet-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Calendar className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Période</p>
              <p className="text-lg font-bold text-foreground">2006-2026</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mini Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-card/50">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Répartition par type</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats.typeData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {stats.typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 bg-card/50">
          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Évolution annuelle</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.yearData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );

  const renderTypes = () => (
    <Card className="p-6 bg-card/50">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Répartition par type d'attaque</h3>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={stats.typeData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {stats.typeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderCategories = () => (
    <Card className="p-6 bg-card/50">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Catégories de données ciblées</h3>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={stats.categoryData} layout="vertical">
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
          <YAxis 
            type="category" 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            width={120}
            fontSize={11}
            tickFormatter={(value) => value.length > 15 ? value.slice(0, 15) + '...' : value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderTimeline = () => (
    <Card className="p-6 bg-card/50">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Évolution temporelle</h3>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={stats.yearData}>
          <defs>
            <linearGradient id="colorCountFull" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCountFull)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
      <div className="flex items-center justify-between mb-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="overview" className="gap-1">
            <Shield className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-1">
            <Target className="h-4 w-4" />
            Types
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1">
            <Database className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1">
            <TrendingUp className="h-4 w-4" />
            Évolution
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0">
        {renderOverview()}
      </TabsContent>
      <TabsContent value="types" className="mt-0">
        {renderTypes()}
      </TabsContent>
      <TabsContent value="categories" className="mt-0">
        {renderCategories()}
      </TabsContent>
      <TabsContent value="timeline" className="mt-0">
        {renderTimeline()}
      </TabsContent>
    </Tabs>
  );
};

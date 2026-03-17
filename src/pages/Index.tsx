import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ThreatMap } from "@/components/ThreatMap";
import { Timeline } from "@/components/Timeline";
import { StatsPanel } from "@/components/StatsPanel";
import { AboutDialog } from "@/components/AboutDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SidePanel } from "@/components/SidePanel";
import { AttackDetailSheet } from "@/components/AttackDetailSheet";
import { ReportIncidentDialog } from "@/components/ReportIncident";
import { supabase } from "@/integrations/supabase/client";
import { cyberAttacksData, CyberAttack, SeverityLevel } from "@/data/cyberattacks";
import { Calendar, X, Radar, AlertTriangle, Activity, TrendingUp, Shield, Globe, Target, Loader2, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const severityColors: Record<SeverityLevel, string> = {
  critique: "bg-red-500",
  élevé: "bg-orange-500",
  moyen: "bg-blue-500",
  faible: "bg-green-500",
};

const attackTypeColors: Record<string, string> = {
  Ransomware: "bg-purple-500",
  Phishing: "bg-yellow-500",
  DDoS: "bg-red-500",
  "Défiguration": "bg-pink-500",
  "Intrusion interne": "bg-blue-500",
  Malware: "bg-gray-500",
  Fraude: "bg-amber-500",
  "Extorsion": "bg-red-600",
  "Phishing/Arnaque": "bg-yellow-600",
};

const Index = () => {
  const [reportOpen, setReportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [yearRange, setYearRange] = useState<[number, number]>([2005, 2026]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedAttack, setSelectedAttack] = useState<CyberAttack | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [cyberThreats, setCyberThreats] = useState(13500000);
  const [loading, setLoading] = useState(true);
  const [attacks, setAttacks] = useState<CyberAttack[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  useEffect(() => {
    const fetchAttacks = async () => {
      setLoading(true);
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        // Use local data if Supabase is not configured
        setAttacks(cyberAttacksData);
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.from("cyberattacks").select("*").order("date", { ascending: false });
        
        if (data && data.length > 0) {
          // Default sources based on attack characteristics
          const getDefaultSources = (attackType: string, severity: string) => {
            const defaultSources = [
              { country: "Nigeria", countryCode: "NG", lat: 9.082, lng: 8.6753, percentage: 35 },
              { country: "Cameroun", countryCode: "CM", lat: 7.3697, lng: 12.3547, percentage: 20 },
              { country: "International", countryCode: "INT", lat: 0, lng: 0, percentage: 45 },
            ];
            
            // Adjust sources based on attack type
            if (attackType.toLowerCase().includes('ransomware')) {
              return [
                { country: "Russie", countryCode: "RU", lat: 61.524, lng: 105.3188, percentage: 40 },
                { country: "USA", countryCode: "US", lat: 37.0902, lng: -95.7129, percentage: 30 },
                { country: "Nigeria", countryCode: "NG", lat: 9.082, lng: 8.6753, percentage: 30 },
              ];
            }
            if (attackType.toLowerCase().includes('ddos')) {
              return [
                { country: "Chine", countryCode: "CN", lat: 35.8617, lng: 104.1954, percentage: 45 },
                { country: "USA", countryCode: "US", lat: 37.0902, lng: -95.7129, percentage: 35 },
                { country: "Russie", countryCode: "RU", lat: 61.524, lng: 105.3188, percentage: 20 },
              ];
            }
            return defaultSources;
          };
          
          const mapped: CyberAttack[] = data.map((item) => {
            const dateStr = item.date;
            let year = 2024;
            let month = 1;
            
            // Handle format jj/mm/aaaa (e.g., "31/01/2026")
            if (dateStr.includes("/")) {
              const parts = dateStr.split("/");
              if (parts.length === 3) {
                month = parseInt(parts[1]) || 1;
                year = parseInt(parts[2]) || 2024;
              }
            } else if (dateStr.includes(" ")) {
              const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
              const monthIdx = monthNames.findIndex(m => dateStr.toLowerCase().includes(m.toLowerCase()));
              if (monthIdx >= 0) month = monthIdx + 1;
              const yearMatch = dateStr.match(/\d{4}/);
              if (yearMatch) year = parseInt(yearMatch[0]);
            } else if (!isNaN(parseInt(dateStr))) {
              year = parseInt(dateStr);
            }
            
            const severityMap: Record<string, SeverityLevel> = {
              "critique": "critique",
              "élevé": "élevé",
              "moyen": "moyen",
              "faible": "faible"
            };
            
            const lat = item.lat || (14.7167 + (Math.random() - 0.5) * 0.15);
            const lng = item.lng || (-17.4677 + (Math.random() - 0.5) * 0.15);
            
            return {
              id: item.id,
              victim: item.victim,
              attackType: item.attack_type,
              severity: severityMap[item.severity] || "moyen",
              date: item.date,
              year,
              month,
              hackers: item.hacker_group || "Inconnu",
              impact: item.impact || "",
              dataCategory: "Données sensibles" as const,
              sourceName: "CyberTracker SN",
              sourceUrl: "",
              lat: lat,
              lng: lng,
              icon: "📍",
              sources: getDefaultSources(item.attack_type || '', item.severity || ''),
              isActive: item.is_active,
              // Handle CVE as array or string
              cve: item.cve ? (Array.isArray(item.cve) ? item.cve.join(', ') : item.cve) : undefined,
              cveSource: item.cve_source ? (Array.isArray(item.cve_source) ? item.cve_source.join(', ') : item.cve_source) : undefined,
              cveNotes: item.cve_notes ? (Array.isArray(item.cve_notes) ? item.cve_notes.join(', ') : item.cve_notes) : undefined,
            };
          });
          setAttacks(mapped);
        } else {
          setAttacks(cyberAttacksData);
        }
      } catch (error) {
        console.warn("Supabase connection failed, using local data:", error);
        setAttacks(cyberAttacksData);
      }
      setLoading(false);
    };
    
    fetchAttacks();
  }, []);
  
  const cyberAttacks = attacks.length > 0 ? attacks : cyberAttacksData;
  
  // Calculate stats from actual data
  const totalIncidents = cyberAttacks.length;
  
  // Count resolved incidents based on impact keywords
  const resolvedCount = cyberAttacks.filter(attack => {
    const impact = attack.impact.toLowerCase();
    return (
      impact.includes("résolu") ||
      impact.includes("restauré") ||
      impact.includes("corrigé") ||
      impact.includes("pas de paiement") ||
      impact.includes("aucune donnée perdue") ||
      impact.includes("non confirmé")
    );
  }).length;
  
  const unconfirmedCount = totalIncidents - resolvedCount;
  
  // Get unique countries of origin
  const uniqueCountries = new Set(
    cyberAttacks.flatMap(a => a.sources?.map(s => s.country) || []).filter(c => c !== "International")
  ).size;
  
  // Most common attack type - based on Kaspersky 2024 report for West Africa
  const mostCommonAttack = "Phishing/Ingénierie sociale";
  const mostCommonPercentage = 40; // 35-45% estimated for 2026
  
  const liveStats = {
    incidents: totalIncidents,
    resolved: resolvedCount,
    unconfirmed: unconfirmedCount,
    countries: uniqueCountries,
  };

  const sectorKeywords: Record<string, string[]> = {
    Gouvernement: [
      "gouvernement", "ministère", "dgid", "impôts", "ageroute", "anacim",
      "prodac", "daf", "automatisation", "état", "gouvernemental", "sites gouvernementaux",
      "agence de l'état", "agence pour la sécurité", "asecna",
    ],
    "Banque / Finance": [
      "banque", "bank", "sgbs", "société générale", "wari", "transfert",
      "transpay", "habitat", "wave", "orange money", "financ",
    ],
    Télécoms: [
      "télécom", "artp", "régulateur télécom", "multinationale télécom",
      "poste sénégal", "la poste",
    ],
    Santé: [
      "santé", "hôpital", "sesam", "médic", "clinique",
    ],
  };

  const classifySector = (victim: string): string => {
    const v = victim.toLowerCase();
    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      if (keywords.some((kw) => v.includes(kw))) return sector;
    }
    return "Autre";
  };

  // Simulated cyber threats counter based on Kaspersky 2024 report (~10M threats in 2024, projected ~16M for 2026)
  useEffect(() => {
    const baseThreats = 12400000; // ~12.4M at start of 2026
    const targetThreats = 16000000; // ~16M projected for end of 2026
    const daysInYear = 366;
    const daysPassed = 73; // March 14, 2026
    const dailyIncrease = (targetThreats - baseThreats) / daysInYear;
    
    const initialValue = Math.floor(baseThreats + (dailyIncrease * daysPassed));
    setCyberThreats(initialValue);

    const interval = setInterval(() => {
      setCyberThreats(prev => prev + Math.floor(Math.random() * 3));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const filteredAttacks = useMemo(() => {
    return cyberAttacks.filter((attack) => {
      // Date filtering from SidePanel
      let matchesDate = true;
      if (startDate || endDate) {
        const attackDate = new Date(attack.year, (attack.month || 1) - 1, 1);
        if (startDate && attackDate < startDate) matchesDate = false;
        if (endDate && attackDate > endDate) matchesDate = false;
      }
      
      // Year range from Timeline
      const matchesYearRange = attack.year >= yearRange[0] && attack.year <= yearRange[1];
      
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(attack.attackType);
      const matchesSeverity = selectedSeverities.length === 0 || selectedSeverities.includes(attack.severity);
      const matchesSector = selectedSector === null || classifySector(attack.victim) === selectedSector;
      
      const matchesSearch =
        searchQuery === "" ||
        attack.victim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attack.hackers.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attack.attackType.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDate && matchesYearRange && matchesType && matchesSeverity && matchesSector && matchesSearch;
    });
  }, [startDate, endDate, yearRange, selectedTypes, selectedSeverities, selectedSector, searchQuery]);

  const displayedAttacks = useMemo(() => {
    const yearToFilter = selectedYear ?? hoveredYear;
    if (yearToFilter !== null) {
      return filteredAttacks.filter(attack => attack.year === yearToFilter);
    }
    return filteredAttacks;
  }, [filteredAttacks, hoveredYear, selectedYear]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Minimal Header */}
      <div className="h-12 flex items-center justify-between px-2 md:px-4 border-b border-border bg-card/50 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <a href="/" className="flex flex-col">
            <span className="text-base md:text-lg font-bold tracking-wider text-foreground hover:text-foreground/80 transition-colors" style={{ fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 10px hsl(var(--primary) / 0.5)" }}>
              Cyber<span className="text-primary">Tracker</span> <span className="text-primary text-[10px] md:text-xs tracking-widest opacity-70">SN</span>
            </span>
            <span className="text-[8px] md:text-[10px] text-muted-foreground/60 italic hidden sm:inline">by OSINT-221</span>
          </a>
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-background/80 backdrop-blur border border-border rounded-lg">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-red-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Cybermenaces:</span>
              <span className="text-sm font-bold text-red-500">{(cyberThreats / 1000000).toFixed(1)}M</span>
              <span className="text-[10px] text-green-500">+18%</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full">
              <span className="text-xs text-red-400">⚠️</span>
              <span className="text-xs text-muted-foreground">{mostCommonAttack}:</span>
              <span className="text-sm font-bold text-red-400">{mostCommonPercentage}%</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden h-8 w-8 p-0" title="Filtres">
                <ListFilter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 overflow-hidden">
              <SidePanel
                attacks={displayedAttacks}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedTypes={selectedTypes}
                onTypeChange={setSelectedTypes}
                selectedSeverities={selectedSeverities}
                onSeverityChange={setSelectedSeverities}
          onAttackClick={(attack) => { 
            setSelectedAttack(attack); 
            setMobileFiltersOpen(false); 
          }}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                selectedSector={selectedSector}
                onSectorChange={setSelectedSector}
                defaultCollapsed={false}
                forceExpanded={true}
              />
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            className="h-8"
            title="Signaler une cybermenace"
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="hidden md:inline ml-1">Signaler</span>
          </Button>
          <Link to="/live">
            <Button variant="outline" size="sm" className="h-8" title="Voir les attaques en direct">
              <Radar className="h-4 w-4 text-red-500 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="hidden md:inline ml-1">Live</span>
            </Button>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <AboutDialog />
            <ThemeToggle />
          </div>
          <div className="md:hidden">
            <AboutDialog />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Chargement des données...</p>
            </div>
          </div>
        ) : (
        <>
          {/* Side Panel */}
        <SidePanel
          attacks={displayedAttacks}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTypes={selectedTypes}
          onTypeChange={setSelectedTypes}
          selectedSeverities={selectedSeverities}
          onSeverityChange={setSelectedSeverities}
          onAttackClick={setSelectedAttack}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          selectedSector={selectedSector}
          onSectorChange={setSelectedSector}
        />

        {/* Map */}
        <div className="flex-1 relative min-h-[400px] md:min-h-0">
          <ThreatMap 
            attacks={displayedAttacks} 
            onAttackClick={setSelectedAttack}
            allAttacks={filteredAttacks}
            selectedSector={selectedSector}
            resolvedCount={liveStats.resolved}
            unconfirmedCount={liveStats.unconfirmed}
          />

          {/* Timeline Overlay */}
          {showTimeline && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/20 backdrop-blur-sm border-t border-border/30 p-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTimeline(false)}
                className="absolute top-2 right-2 h-6 w-6 z-20"
              >
                <X className="h-4 w-4" />
              </Button>
              <Timeline 
                attacks={cyberAttacks} 
                yearRange={yearRange} 
                onYearRangeChange={setYearRange}
                onYearHover={setHoveredYear}
                onYearClick={setSelectedYear}
              />
            </div>
          )}

          {/* Timeline Toggle Button - Only show when timeline is hidden */}
          {!showTimeline && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowTimeline(true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-3 z-20 gap-1.5 shadow-lg animate-pulse"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Afficher Timeline</span>
              <span className="sm:hidden">Timeline</span>
            </Button>
          )}
        </div>
        </>
        )}
      </div>

      {/* Attack Details Dialog */}
      <AttackDetailSheet attack={selectedAttack} onClose={() => setSelectedAttack(null)} />
      <ReportIncidentDialog open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
};

export default Index;
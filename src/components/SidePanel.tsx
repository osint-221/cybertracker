import { useState, useEffect } from "react";
import { CyberAttack, severityColors, SeverityLevel } from "@/data/cyberattacks";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, ChevronDown, CalendarIcon, List, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SidePanelProps {
  attacks: CyberAttack[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
  selectedSeverities: SeverityLevel[];
  onSeverityChange: (severities: SeverityLevel[]) => void;
  onAttackClick: (attack: CyberAttack) => void;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  selectedSector: string | null;
  onSectorChange: (sector: string | null) => void;
}

const severityLevels: SeverityLevel[] = ["critique", "élevé", "moyen", "faible"];
const attackTypes = [
  "Phishing/Arnaque",
  "Malware",
  "Défiguration",
  "Intrusion interne",
  "Ransomware",
  "DDoS",
  "Fraude",
  "Extorsion",
];

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

export const SidePanel = ({
  attacks,
  searchQuery,
  onSearchChange,
  selectedTypes,
  onTypeChange,
  selectedSeverities,
  onSeverityChange,
  onAttackClick,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedSector,
  onSectorChange,
}: SidePanelProps) => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const onTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onTypeChange(newTypes);
  };

  const onSeverityToggle = (severity: SeverityLevel) => {
    const newSeverities = selectedSeverities.includes(severity)
      ? selectedSeverities.filter((s) => s !== severity)
      : [...selectedSeverities, severity];
    onSeverityChange(newSeverities);
  };

  const onClearFilters = () => {
    onTypeChange([]);
    onSeverityChange([]);
    onSearchChange("");
    onStartDateChange(undefined);
    onEndDateChange(undefined);
    onSectorChange(null);
  };

  const formatAttackDate = (attack: CyberAttack) => {
    // If date is in jj/mm/aaaa format, use it directly
    if (attack.date && attack.date.includes("/")) {
      const parts = attack.date.split("/");
      if (parts.length === 3) {
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
    }
    // Otherwise use month/year
    const month = attack.month ? String(attack.month).padStart(2, '0') : '';
    const year = attack.year;
    if (month) {
      return `${month}/${year}`;
    }
    return String(year);
  };

  const sortedAttacks = [...attacks].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (b.month || 0) - (a.month || 0);
  });

  const hasFilters = selectedTypes.length > 0 || selectedSeverities.length > 0 || searchQuery !== "" || startDate !== undefined || endDate !== undefined || selectedSector !== null;



  return (
    <div
      className={cn(
        "h-full bg-background/95 backdrop-blur border-r border-border flex flex-col transition-all duration-300 relative shadow-xl",
        isCollapsed ? "w-14" : "w-80"
      )}
      style={{
        overflow: isCollapsed ? 'hidden' : 'auto',
      }}
    >
      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 p-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Rechercher"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Filtres"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Secteurs"
          >
            <Building2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={cn(
        "flex items-center justify-between px-2 py-2 border-b border-border bg-muted/20",
        isCollapsed && "flex-col gap-1"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filtres
            </div>
            {hasFilters && (
              <button
                onClick={onClearFilters}
                className="text-[10px] text-primary hover:underline"
              >
                Tout effacer
              </button>
            )}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center justify-center rounded-lg transition-all duration-200",
            isCollapsed
              ? "h-8 w-8 hover:bg-primary/10 hover:text-primary"
              : "h-7 px-2 gap-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-label={isCollapsed ? "Étendre le panneau" : "Réduire le panneau"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher victimes ou mots-clés"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-9 text-sm bg-secondary/50 border-0"
              />
            </div>
          </div>

          {/* Sector Filters - right after search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => onSectorChange(null)}
                className={cn(
                  "px-2 py-1 text-[10px] rounded-full transition-colors",
                  selectedSector === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                Tous
              </button>
              {Object.keys(sectorKeywords).map((sector) => (
                <button
                  key={sector}
                  onClick={() => onSectorChange(sector)}
                  className={cn(
                    "px-2 py-1 text-[10px] rounded-full transition-colors",
                    selectedSector === sector
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-b border-border space-y-2">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 flex-1 justify-between text-xs">
                    <span>Gravité</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {severityLevels.map((severity) => (
                    <DropdownMenuCheckboxItem
                      key={severity}
                      checked={selectedSeverities.includes(severity)}
                      onCheckedChange={() => onSeverityToggle(severity)}
                      className="capitalize"
                    >
                      <span
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: severityColors[severity] }}
                      />
                      {severity}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 flex-1 justify-between text-xs">
                    <span>Type</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {attackTypes.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => onTypeToggle(type)}
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 flex-1 justify-start text-xs gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{startDate ? format(startDate, "dd/MM/yy", { locale: fr }) : "Début"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={onStartDateChange}
                    initialFocus
                    className="pointer-events-auto"
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-xs text-muted-foreground">→</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm" className="h-8 flex-1 justify-start text-xs gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{endDate ? format(endDate, "dd/MM/yy", { locale: fr }) : "Fin"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={onEndDateChange}
                    initialFocus
                    className="pointer-events-auto"
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>

              {(startDate || endDate) && (
                <button
                  onClick={() => { onStartDateChange(undefined); onEndDateChange(undefined); }}
                  className="text-xs text-muted-foreground hover:text-foreground p-1"
                  title="Réinitialiser les dates"
                >
                  ×
                </button>
              )}
            </div>

            {hasFilters && (
              <div className="flex flex-wrap gap-1 pt-1">
                {selectedSeverities.map((severity) => (
                  <Badge
                    key={severity}
                    className="text-xs px-1.5 py-0 h-5 capitalize cursor-pointer"
                    style={{ backgroundColor: severityColors[severity] }}
                    onClick={() => onSeverityToggle(severity)}
                  >
                    {severity} <X className="h-2.5 w-2.5 ml-0.5" />
                  </Badge>
                ))}
                {selectedTypes.map((type) => (
                  <Badge
                    key={type}
                    className="text-xs px-1.5 py-0 h-5 cursor-pointer bg-muted text-foreground hover:bg-muted/80"
                    onClick={() => onTypeToggle(type)}
                  >
                    {type} <X className="h-2.5 w-2.5 ml-0.5" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {sortedAttacks.map((attack) => (
                  <div
                    key={attack.id}
                    onClick={() => onAttackClick(attack)}
                    className="p-2.5 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: severityColors[attack.severity] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors max-w-[180px]" title={attack.victim}>
                            {attack.victim}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap font-mono flex-shrink-0">
                            {formatAttackDate(attack)}
                          </span>
                        </div>
                        {/* {attack.sources && attack.sources.length > 0 && (
                          <span className="text-[10px] text-muted-foreground/70">
                            {attack.sources.map(s => s.country).join(", ")}
                          </span>
                        )} */}
                      </div>
                    </div>
                  </div>
                ))}
                {sortedAttacks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Aucun incident trouvé</p>
                    <button
                      onClick={onClearFilters}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="px-3 py-2 border-t border-border flex-shrink-0">
            <span className="text-[10px] text-muted-foreground/70">
              Dernière mise à jour : {sortedAttacks.length > 0 ? formatAttackDate(sortedAttacks[0]) : "—"}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { CyberAttack, severityColors, SeverityLevel } from "@/data/cyberattacks";
import { Calendar, ChevronLeft, ChevronRight, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimelineProps {
  attacks: CyberAttack[];
  yearRange: [number, number];
  onYearRangeChange: (range: [number, number]) => void;
  onYearHover?: (year: number | null) => void;
  onYearClick?: (year: number) => void;
}

const minYear = 2005;
const maxYear = 2026;

const criticalYears = [2016, 2021, 2022, 2023, 2024, 2025, 2026];

export const Timeline = ({ attacks, yearRange, onYearRangeChange, onYearHover, onYearClick }: TimelineProps) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const yearData = useMemo(() => {
    const counts: Record<number, { count: number; critique: number; élevé: number; moyen: number; faible: number }> = {};
    for (let year = minYear; year <= maxYear; year++) {
      counts[year] = { count: 0, critique: 0, élevé: 0, moyen: 0, faible: 0 };
    }
    attacks.forEach((attack) => {
      if (counts[attack.year]) {
        counts[attack.year].count++;
        counts[attack.year][attack.severity]++;
      }
    });
    
    const data = Object.entries(counts)
      .map(([year, d]) => ({ year: parseInt(year), ...d }))
      .sort((a, b) => a.year - b.year);
    
    // Calculate cumulative
    let cumulative = 0;
    return data.map(d => {
      cumulative += d.count;
      return { ...d, cumulative };
    });
  }, [attacks]);

  const maxCount = Math.max(...yearData.map(d => d.count), 1);
  const maxCumulative = yearData[yearData.length - 1]?.cumulative || 1;

  const totalInRange = useMemo(() => {
    return yearData
      .filter(d => d.year >= yearRange[0] && d.year <= yearRange[1])
      .reduce((sum, d) => sum + d.count, 0);
  }, [yearData, yearRange]);

  const handleSliderChange = (value: number[]) => {
    onYearRangeChange([value[0], value[1]]);
  };

  const handleYearClick = (year: number) => {
    const data = yearData.find(d => d.year === year);
    if (data && data.count > 0) {
      onYearClick?.(year);
    }
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const currentIndex = yearData.findIndex(d => d.year === yearRange[0]);
    if (direction === 'prev' && currentIndex > 0) {
      onYearRangeChange([yearData[currentIndex - 1].year, yearData[currentIndex - 1].year]);
    } else if (direction === 'next' && currentIndex < yearData.length - 1) {
      onYearRangeChange([yearData[currentIndex + 1].year, yearData[currentIndex + 1].year]);
    }
  };

  const getBarColor = (count: number, isActive: boolean, isHovered: boolean) => {
    if (!isActive || count === 0) return 'hsl(var(--muted) / 0.4)';
    if (isHovered) return 'hsl(var(--primary))';
    return 'hsl(var(--primary) / 0.85)';
  };

  const getSeverityLabel = (severity: SeverityLevel) => {
    const labels: Record<SeverityLevel, string> = {
      critique: 'Critique',
      élevé: 'Élevé',
      moyen: 'Moyen',
      faible: 'Faible'
    };
    return labels[severity];
  };

  const getSeverityColor = (severity: SeverityLevel) => severityColors[severity];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-foreground/80" />
          <span className="text-sm text-foreground/80">Période:</span>
          <span className="text-sm font-semibold text-foreground">{yearRange[0]} - {yearRange[1]}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => navigateYear('prev')}
            disabled={yearRange[0] <= minYear}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => navigateYear('next')}
            disabled={yearRange[1] >= maxYear}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-md">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">{totalInRange}</span>
          </div>
        </div>
      </div>

      {/* Timeline with Cumulative Overlay */}
      <div className="relative px-1">
        {/* Cumulative Line */}
        <svg className="absolute inset-0 pointer-events-none" style={{ height: '100%', width: '100%' }}>
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary) / 0.3)" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.05)" />
            </linearGradient>
          </defs>
          <path
            d={`M ${yearData.map((d, i) => {
              const x = (i / (yearData.length - 1)) * 100;
              const y = 100 - (d.cumulative / maxCumulative) * 100;
              return `${x}% ${y}%`;
            }).join(' L ')}`}
            fill="none"
            stroke="hsl(var(--primary) / 0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={`M 0 100 L ${yearData.map((d, i) => {
              const x = (i / (yearData.length - 1)) * 100;
              const y = 100 - (d.cumulative / maxCumulative) * 100;
              return `${x}% ${y}%`;
            }).join(' L ')} L 100% 100% L 0% 100% Z`}
            fill="url(#cumulativeGradient)"
          />
        </svg>

        {/* Bars */}
        <div className="relative flex items-end justify-between gap-px h-20 pt-4">
          {yearData.map((data) => {
            const isActive = data.year >= yearRange[0] && data.year <= yearRange[1];
            const isHovered = hoveredYear === data.year;
            const hasData = data.count > 0;
            const height = hasData ? Math.max((data.count / maxCount) * 100, 20) : 8;
            const isCriticalYear = criticalYears.includes(data.year);
            
            return (
              <button
                key={data.year}
                className={cn(
                  "flex-1 relative rounded-t-sm transition-all duration-300 ease-out",
                  isHovered && "ring-2 ring-primary/60 ring-offset-1 ring-offset-background z-10"
                )}
                style={{ 
                  height: `${height}%`,
                  backgroundColor: getBarColor(data.count, isActive, isHovered),
                  minHeight: '8px',
                }}
                onClick={() => hasData && handleYearClick(data.year)}
                onMouseEnter={() => { setHoveredYear(data.year); onYearHover?.(data.year); }}
                onMouseLeave={() => { setHoveredYear(null); onYearHover?.(null); }}
              >
                {/* Critical Year Indicator */}
                {isCriticalYear && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Enhanced Tooltip */}
        {hoveredYear && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mt-[-8px] z-20 bg-background/95 backdrop-blur border border-border rounded-lg px-3 py-2.5 shadow-xl min-w-[140px]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{hoveredYear}</span>
              {criticalYears.includes(hoveredYear) && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold">{yearData.find(d => d.year === hoveredYear)?.count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cumul:</span>
                <span className="font-semibold text-primary">{yearData.find(d => d.year === hoveredYear)?.cumulative || 0}</span>
              </div>
              {Object.entries(severityColors).map(([sev, color]) => {
                const count = yearData.find(d => d.year === hoveredYear)?.[sev as SeverityLevel] || 0;
                if (count === 0) return null;
                return (
                  <div key={sev} className="flex justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-muted-foreground">{getSeverityLabel(sev as SeverityLevel)}</span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-background border-r border-b border-border rotate-45" />
          </div>
        )}
        
        {/* Year Labels */}
        <div className="flex justify-between mt-3 text-[9px] text-foreground/60 font-medium">
          <span>{minYear}</span>
          <span>2010</span>
          <span>2015</span>
          <span>2020</span>
          <span className="text-destructive">{maxYear}</span>
        </div>
      </div>

      {/* Range Slider */}
      <div className="space-y-2">
        <Slider
          min={minYear}
          max={maxYear}
          step={1}
          value={yearRange}
          onValueChange={handleSliderChange}
          className="w-full"
        />
        
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onYearRangeChange([minYear, maxYear])}
              className="h-6 text-[11px] px-2 bg-muted/50 hover:bg-muted"
            >
              Tout
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onYearRangeChange([2020, maxYear])}
              className="h-6 text-[11px] px-2 bg-muted/50 hover:bg-muted"
            >
              2020+
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onYearRangeChange([2023, maxYear])}
              className="h-6 text-[11px] px-2 bg-muted/50 hover:bg-muted"
            >
              2023+
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onYearRangeChange([2025, maxYear])}
              className="h-6 text-[11px] px-2 bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              2025+
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
            <span>Année critique</span>
          </div>
        </div>
      </div>
    </div>
  );
};
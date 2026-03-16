import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { CyberAttack, severityColors, SeverityLevel } from "@/data/cyberattacks";
import { Button } from "@/components/ui/button";
import { Info, Download, BarChart3, Target, Globe, Map, MapIcon, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatsPanel } from "@/components/StatsPanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

interface ThreatMapProps {
  attacks: CyberAttack[];
  onAttackClick?: (attack: CyberAttack) => void;
  allAttacks?: CyberAttack[];
  selectedSector?: string | null;
  resolvedCount?: number;
  unconfirmedCount?: number;
}

const SENEGAL_CENTER = { lng: -17.444, lat: 14.716 };
const WORLD_CENTER = { lng: 10, lat: 15 };

const SEVERITY_CONFIG: Record<SeverityLevel, { color: string; bg: string; label: string }> = {
  critique: { color: "#ef4444", bg: "bg-red-500", label: "Critique" },
  élevé: { color: "#f97316", bg: "bg-orange-500", label: "Élevé" },
  moyen: { color: "#06b6d4", bg: "bg-cyan-500", label: "Moyen" },
  faible: { color: "#22c55e", bg: "bg-green-500", label: "Faible" },
};

function createArcCoordinates(
  sourceLng: number,
  sourceLat: number,
  targetLng: number,
  targetLat: number,
  numPoints: number = 50
): [number, number][] {
  const coords: [number, number][] = [];
  const distance = Math.sqrt(Math.pow(targetLng - sourceLng, 2) + Math.pow(targetLat - sourceLat, 2));

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = sourceLng + (targetLng - sourceLng) * t;
    const lat = sourceLat + (targetLat - sourceLat) * t;
    const arcHeight = Math.sin(t * Math.PI) * Math.min(distance * 0.18, 2);
    coords.push([lng, lat + arcHeight]);
  }
  return coords;
}

function generateMapData(attacks: CyberAttack[], filterSeverity?: SeverityLevel) {
  const arcFeatures: GeoJSON.Feature[] = [];
  const sourceFeatures: GeoJSON.Feature[] = [];

  const countryData: Record<string, { attacks: number; severities: SeverityLevel[]; attacksList: CyberAttack[] }> = {};

  const filteredAttacks = filterSeverity
    ? attacks.filter(a => a.severity === filterSeverity)
    : attacks;

  filteredAttacks.forEach((attack) => {
    if (attack.sources && attack.sources.length > 0) {
      attack.sources.forEach((source) => {
        if (source.lat !== 0 && source.lng !== 0) {
          const arcCoords = createArcCoordinates(source.lng, source.lat, attack.lng, attack.lat);

          const severityConfig = SEVERITY_CONFIG[attack.severity];

          arcFeatures.push({
            type: "Feature",
            properties: {
              severity: attack.severity,
              color: severityConfig.color,
              sourceCountry: source.country,
              sourceCode: source.countryCode,
              target: attack.victim,
              attackId: attack.id,
            },
            geometry: { type: "LineString", coordinates: arcCoords },
          });

          if (!countryData[source.countryCode]) {
            countryData[source.countryCode] = { attacks: 0, severities: [], attacksList: [] };
          }
          countryData[source.countryCode].attacks++;
          countryData[source.countryCode].severities.push(attack.severity);
          countryData[source.countryCode].attacksList.push(attack);
        }
      });
    }
  });

  Object.entries(countryData).forEach(([code, data]) => {
    const maxSeverity = data.severities.reduce((max, s) => {
      const scores: Record<SeverityLevel, number> = { critique: 4, élevé: 3, moyen: 2, faible: 1 };
      return scores[s] > scores[max] ? s : max;
    }, 'faible' as SeverityLevel);

    const attack = filteredAttacks.find(a => a.sources?.some(s => s.countryCode === code));
    const source = attack?.sources?.find(s => s.countryCode === code);

    if (source && attack) {
      sourceFeatures.push({
        type: "Feature",
        properties: {
          country: source.country,
          countryCode: code,
          attackCount: data.attacks,
          severity: maxSeverity,
          color: SEVERITY_CONFIG[maxSeverity].color,
          attacksList: JSON.stringify(data.attacksList.map(a => a.id)),
        },
        geometry: { type: "Point", coordinates: [source.lng, source.lat] },
      });
    }
  });

  return {
    arcs: { type: "FeatureCollection" as const, features: arcFeatures },
    sources: { type: "FeatureCollection" as const, features: sourceFeatures },
  };
}

export const ThreatMap = ({ attacks, onAttackClick, allAttacks = [], resolvedCount = 0, unconfirmedCount = 0 }: ThreatMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | "all">("all");
  const [viewMode, setViewMode] = useState<"globe" | "carte" | "senegal">("carte");
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const stats = {
    total: severityFilter === "all" ? attacks.length : attacks.filter(a => a.severity === severityFilter).length,
    critique: attacks.filter(a => a.severity === "critique").length,
    élevé: attacks.filter(a => a.severity === "élevé").length,
    moyen: attacks.filter(a => a.severity === "moyen").length,
    faible: attacks.filter(a => a.severity === "faible").length,
  };

  const filterBySeverity = useCallback((severity: SeverityLevel | "all") => {
    setSeverityFilter(severity);
  }, []);

  const addLayers = useCallback(() => {
    if (!map.current) return;

    const { arcs, sources } = generateMapData(attacks, severityFilter === "all" ? undefined : severityFilter);

    if (map.current.getSource("arcs")) {
      (map.current.getSource("arcs") as mapboxgl.GeoJSONSource).setData(arcs);
    } else {
      map.current.addSource("arcs", { type: "geojson", data: arcs });
      map.current.addLayer({
        id: "arcs-line",
        type: "line",
        source: "arcs",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.2,
          "line-opacity": 0.5,
        },
      });
    }

    if (map.current.getSource("sources")) {
      (map.current.getSource("sources") as mapboxgl.GeoJSONSource).setData(sources);
    } else {
      map.current.addSource("sources", { type: "geojson", data: sources });
      map.current.addLayer({
        id: "source-points",
        type: "circle",
        source: "sources",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "attackCount"], 1, 4, 10, 8],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });
      map.current.addLayer({
        id: "source-labels",
        type: "symbol",
        source: "sources",
        layout: {
          "text-field": ["get", "country"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, 1.6],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#e2e8f0",
          "text-halo-color": "#0f172a",
          "text-halo-width": 2,
        },
      });
    }

    if (map.current.getSource("senegal")) {
      (map.current.getSource("senegal") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: { name: "Sénégal" },
          geometry: { type: "Point", coordinates: [SENEGAL_CENTER.lng, SENEGAL_CENTER.lat] },
        }],
      });
    } else {
      map.current.addSource("senegal", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: { name: "Sénégal" },
            geometry: { type: "Point", coordinates: [SENEGAL_CENTER.lng, SENEGAL_CENTER.lat] },
          }],
        },
      });

      map.current.addLayer({
        id: "senegal-point",
        type: "circle",
        source: "senegal",
        paint: {
          "circle-radius": 8,
          "circle-color": "#ef4444",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.current.addLayer({
        id: "senegal-label",
        type: "symbol",
        source: "senegal",
        layout: {
          "text-field": "SÉNÉGAL",
          "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
          "text-offset": [0, -1.8],
          "text-anchor": "bottom",
        },
        paint: {
          "text-color": "#ef4444",
          "text-halo-color": "#0f172a",
          "text-halo-width": 3,
        },
      });
    }
  }, [attacks, severityFilter]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if Mapbox token is available
    if (!mapboxToken) {
      console.warn("Mapbox token not configured. Map will not load.");
      setMapError(true);
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 10],
      zoom: 1.2,
      pitch: 0,
      bearing: 0,
      projection: "mercator",
      attributionControl: false,
    });

    map.current.on("style.load", () => addLayers());

    map.current.on("click", "source-points", (e) => {
      if (e.features && e.features[0]?.properties?.attacksList) {
        const attackIds = JSON.parse(e.features[0].properties.attacksList) as string[];
        const relatedAttacks = attacks.filter(a => attackIds.includes(a.id));
        if (relatedAttacks.length > 0 && onAttackClick) {
          onAttackClick(relatedAttacks[0]);
        }
      }
    });

    map.current.on("mouseenter", "source-points", () => {
      const canvas = map.current?.getCanvas();
      if (canvas) canvas.style.cursor = "pointer";
    });

    map.current.on("mouseleave", "source-points", () => {
      const canvas = map.current?.getCanvas();
      if (canvas) canvas.style.cursor = "";
    });

    const handleResize = () => {
      if (map.current) map.current.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current?.isStyleLoaded()) return;
    addLayers();
  }, [attacks, severityFilter, addLayers]);

  const handleDownloadPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - 2 * margin;
    let y = 0;

    // Colors
    const primaryColor: [number, number, number] = [15, 23, 42];
    const accentColor: [number, number, number] = [220, 38, 38];
    const secondaryColor: [number, number, number] = [100, 116, 139];
    const lightGray: [number, number, number] = [248, 250, 252];

    // Helper function for safe text
    const safeText = (text: string, maxWidth: number): string => {
      if (!text) return '';
      const lines = pdf.splitTextToSize(text, maxWidth);
      return lines[0] || '';
    };

    // Helper to check page overflow and add new page
    const checkPageBreak = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight - 30) {
        pdf.addPage();
        y = 25;
        // Add continuation header
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, pageWidth, 18, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text("Suite du rapport - CyberTracker SN", margin, 12);
        y = 28;
      }
    };

    // Calculate period
    const years = attacks.map(a => a.year).filter(y => y > 0);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const periodCovered = minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;

    // Find most critical attack
    const criticalAttacks = attacks.filter(a => a.severity === 'critique');
    const mostCritical = criticalAttacks.length > 0 ? criticalAttacks[0] : null;

    // ==================== PAGE 1 ====================

    // Header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text("CYBERTRACKER", margin, 18);

    pdf.setFontSize(12);
    pdf.setTextColor(220, 38, 38);
    pdf.text("SENEGAL", margin, 28);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(200, 200, 200);
    pdf.text("Plateforme nationale de veille des cybermenaces", margin, 36);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("RAPPORT D'ANALYSE", pageWidth - margin, 16, { align: "right" });
    pdf.setFontSize(10);
    pdf.setTextColor(220, 38, 38);
    pdf.text("CYBERATTAQUES & INCIDENTS", pageWidth - margin, 24, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(180, 180, 180);
    pdf.text(`Période: ${periodCovered}`, pageWidth - margin, 32, { align: "right" });
    pdf.text(`${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`, pageWidth - margin, 40, { align: "right" });

    y = 55;

    // Executive Summary
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.text("RÉSUMÉ EXÉCUTIF", margin, y);
    y += 6;
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    const totalAttacks = attacks.length;
    const criticalCount = attacks.filter(a => a.severity === 'critique').length;
    const activeAttacks = attacks.filter(a => a.isActive).length;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...secondaryColor);
    const summaryText = `Ce rapport présente l'analyse des cyberattaques documentées au Sénégal sur la période ${periodCovered}. ` +
      `Notre base de données recense ${totalAttacks} incidents vérifiés, dont ${criticalCount} classés critiques. ` +
      `${activeAttacks} incidents demeurent actifs à ce jour.`;
    const summaryLines = pdf.splitTextToSize(summaryText, contentWidth);
    pdf.text(summaryLines, margin, y);
    y += summaryLines.length * 5 + 12;

    // Key Statistics
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...primaryColor);
    pdf.text("INDICATEURS CLÉS", margin, y);
    y += 6;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    const statsData = [
      { label: "Total incidents", value: totalAttacks },
      { label: "Incidents critiques", value: criticalCount },
      { label: "Incidents actifs", value: activeAttacks },
      { label: "Ransomwares", value: attacks.filter(a => a.attackType.toLowerCase().includes('ransomware')).length },
    ];

    const boxWidth = (contentWidth - 15) / 4;
    statsData.forEach((stat, i) => {
      const x = margin + i * (boxWidth + 5);
      pdf.setFillColor(...lightGray);
      pdf.roundedRect(x, y, boxWidth, 22, 2, 2, 'F');
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(...primaryColor);
      pdf.text(stat.value.toString(), x + boxWidth / 2, y + 10, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(...secondaryColor);
      pdf.text(stat.label.toUpperCase(), x + boxWidth / 2, y + 17, { align: "center" });
    });

    y += 32;

    // Most Critical Attack
    if (mostCritical) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...accentColor);
      pdf.text("ATTAQUE LA PLUS CRITIQUE", margin, y);
      y += 6;

      pdf.setFillColor(255, 245, 245);
      pdf.roundedRect(margin, y, contentWidth, 30, 2, 2, 'F');
      pdf.setDrawColor(220, 38, 38);
      pdf.roundedRect(margin, y, contentWidth, 30, 2, 2, 'S');

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(220, 38, 38);
      pdf.text(safeText(mostCritical.victim, contentWidth - 10), margin + 5, y + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...primaryColor);
      pdf.text(`${mostCritical.date} | ${mostCritical.attackType}`, margin + 5, y + 15);
      pdf.text(`Groupe: ${mostCritical.hackers || 'Non identifié'}`, margin + 5, y + 21);

      const impactText = safeText(mostCritical.impact || 'Impact non spécifié', contentWidth - 60);
      pdf.text(`Impact: ${impactText}`, margin + 5, y + 27);

      y += 40;
    }

    // Severity Distribution
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.text("RÉPARTITION PAR GRAVITÉ", margin, y);
    y += 6;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    const severityCounts = {
      'critique': attacks.filter(a => a.severity === 'critique').length,
      'élevé': attacks.filter(a => a.severity === 'élevé').length,
      'moyen': attacks.filter(a => a.severity === 'moyen').length,
      'faible': attacks.filter(a => a.severity === 'faible').length,
    };

    const sevConfig: Record<string, { label: string; color: [number, number, number] }> = {
      'critique': { label: 'CRITIQUE', color: [220, 38, 38] },
      'élevé': { label: 'ÉLEVÉ', color: [249, 115, 22] },
      'moyen': { label: 'MOYEN', color: [59, 130, 246] },
      'faible': { label: 'FAIBLE', color: [34, 197, 94] },
    };

    Object.entries(severityCounts).forEach(([sev, count]) => {
      const barMaxWidth = contentWidth - 40;
      const barWidth = totalAttacks > 0 ? (count / totalAttacks) * barMaxWidth : 0;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...secondaryColor);
      pdf.text(sevConfig[sev].label, margin, y + 4);

      pdf.setFillColor(230, 230, 230);
      pdf.roundedRect(margin + 40, y, barMaxWidth, 6, 1, 1, 'F');

      pdf.setFillColor(...sevConfig[sev].color);
      pdf.roundedRect(margin + 40, y, barWidth, 6, 1, 1, 'F');

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...primaryColor);
      pdf.text(count.toString(), pageWidth - margin, y + 4, { align: "right" });

      y += 10;
    });

    y += 10;

    // Recent Incidents Table
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.text("INCIDENTS RÉCENTS", margin, y);
    y += 6;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Table header
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, y, contentWidth, 6, 'F');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    pdf.text("DATE", margin + 2, y + 4);
    pdf.text("CIBLE", margin + 20, y + 4);
    pdf.text("TYPE", margin + 70, y + 4);
    pdf.text("GRAVITÉ", margin + 105, y + 4);
    pdf.text("STATUT", margin + 130, y + 4);
    y += 6;

    // Table rows
    const recentAttacks = attacks.slice(0, 8);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);

    recentAttacks.forEach((attack, i) => {
      checkPageBreak(6);

      if (i % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y, contentWidth, 6, 'F');
      }

      pdf.setTextColor(...primaryColor);
      pdf.text(safeText(attack.date, 15), margin + 2, y + 4);
      pdf.text(safeText(attack.victim, 45), margin + 20, y + 4);
      pdf.text(safeText(attack.attackType, 30), margin + 70, y + 4);

      const sevColors: Record<string, [number, number, number]> = {
        'critique': [220, 38, 38], 'élevé': [249, 115, 22],
        'moyen': [59, 130, 246], 'faible': [34, 197, 94],
      };
      const severityColor = sevColors[attack.severity] || secondaryColor;
      pdf.setTextColor(severityColor[0], severityColor[1], severityColor[2]);
      pdf.text(attack.severity.toUpperCase(), margin + 105, y + 4);

      const activeColor: [number, number, number] = attack.isActive ? [220, 38, 38] : [34, 197, 94];
      pdf.setTextColor(activeColor[0], activeColor[1], activeColor[2]);
      pdf.text(attack.isActive ? 'ACTIF' : 'PASSIF', margin + 130, y + 4);

      y += 6;
    });

    // Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...secondaryColor);
    pdf.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')} | CyberTracker SN`, margin, pageHeight - 12);
    pdf.text("Données publiques vérifiées - Usage informatif", margin, pageHeight - 7);

    // ==================== PAGE 2 ====================
    pdf.addPage();

    // Header
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 20, 'F');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text("ANALYSE DÉTAILLÉE", margin, 14);

    y = 30;

    // Sectors
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.text("SECTEURS CIBLÉS", margin, y);
    y += 6;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    const sectorKeywords: Record<string, string[]> = {
      'Gouvernement': ['gouvernement', 'ministère', 'dgid', 'impôts', 'ageroute', 'anacim', 'daf', 'état'],
      'Banque/Finance': ['banque', 'bank', 'sgbs', 'wari', 'habitat', 'wave', 'money'],
      'Télécoms': ['télécom', 'artp', 'poste'],
      'Transport': ['asena', 'air', 'aérien'],
    };

    const sectorCounts: Record<string, number> = {};
    Object.keys(sectorKeywords).forEach(s => sectorCounts[s] = 0);
    attacks.forEach(a => {
      const v = a.victim.toLowerCase();
      Object.entries(sectorKeywords).forEach(([sector, keywords]) => {
        if (keywords.some(kw => v.includes(kw))) sectorCounts[sector]++;
      });
    });

    Object.entries(sectorCounts)
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .forEach(([sector, count]) => {
        pdf.setFillColor(...lightGray);
        pdf.roundedRect(margin, y, contentWidth - 25, 8, 1, 1, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(...primaryColor);
        pdf.text(sector, margin + 3, y + 5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...secondaryColor);
        pdf.text(`${count} incident(s)`, pageWidth - margin - 25, y + 5);
        y += 10;
      });

    y += 8;

    // Timeline
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.text("ÉVOLUTION TEMPORELLE", margin, y);
    y += 6;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    const yearCounts: Record<number, number> = {};
    attacks.forEach(a => { yearCounts[a.year] = (yearCounts[a.year] || 0) + 1; });

    Object.entries(yearCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([year, count]) => {
        checkPageBreak(8);
        const barWidth = Math.min((count / 15) * (contentWidth - 25), contentWidth - 25);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(...primaryColor);
        pdf.text(year, margin, y + 4);
        pdf.setFillColor(220, 38, 38);
        pdf.roundedRect(margin + 20, y, barWidth, 5, 1, 1, 'F');
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...secondaryColor);
        pdf.text(count.toString(), pageWidth - margin, y + 4, { align: 'right' });
        y += 8;
      });

    y += 10;

    // Top attacks details
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.text("PRINCIPAUX INCIDENTS", margin, y);
    y += 6;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    attacks.slice(0, 4).forEach((attack, i) => {
      checkPageBreak(35);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...accentColor);
      pdf.text(`${i + 1}. ${safeText(attack.victim, contentWidth - 10)}`, margin, y);
      y += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(...secondaryColor);
      pdf.text(`${attack.date} | ${attack.attackType} | Gravité: ${attack.severity}`, margin, y);
      y += 4;

      pdf.text(`Groupe: ${attack.hackers || 'Non identifié'}`, margin, y);
      y += 4;

      if (attack.impact) {
        const impactLines = pdf.splitTextToSize(`Impact: ${attack.impact}`, contentWidth - 5);
        pdf.setTextColor(...primaryColor);
        impactLines.forEach(line => {
          pdf.text(line, margin, y);
          y += 4;
        });
      }
      y += 6;
    });

    // Recommendations
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...primaryColor);
    pdf.text("RECOMMANDATIONS", margin, y);
    y += 6;
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    const recommendations = [
      "Renforcer la formation aux bonnes pratiques de sécurité",
      "Mettre en place une stratégie de sauvegarde robuste",
      "Déployer des solutions EDR sur les systèmes critiques",
      "Établir un plan de réponse aux incidents (IRP)",
      "Effectuer des audits de sécurité réguliers",
      "Sensibiliser au phishing et ingénierie sociale"
    ];

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    recommendations.forEach(rec => {
      checkPageBreak(5);
      pdf.setFillColor(220, 38, 38);
      pdf.circle(margin + 2, y - 1, 1, 'F');
      pdf.setTextColor(...primaryColor);
      pdf.text(rec, margin + 6, y);
      y += 6;
    });

    // Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...secondaryColor);
    pdf.text("Page 2/2", pageWidth - margin, pageHeight - 10, { align: "right" });

    // Save
    pdf.save(`CyberTracker-Rapport-${periodCovered.replace(' - ', '-')}.pdf`);
  };

  return (
    <div className="relative w-full h-full">
      {mapError ? (
        <div className="absolute inset-0 bg-background flex items-center justify-center">
          <div className="text-center p-8">
            <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Carte non disponible</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              La carte interactive nécessite une clé API Mapbox.
              Configurez VITE_MAPBOX_TOKEN dans votre fichier .env pour l'activer.
            </p>
          </div>
        </div>
      ) : (
        <div ref={mapContainer} className="absolute inset-0 bg-background" />
      )}

      {/* Top Left - Stats Card - Optimized */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-background/60 backdrop-blur-md border border-border/50 rounded-lg w-44">
          {/* Main stats */}
          <div className="p-2.5 space-y-2">
            <div className="flex items-end gap-1.5">
              <span className="text-2xl font-bold text-foreground leading-none">{stats.total}</span>
              <span className="text-sm text-muted-foreground pb-0.5">incidents</span>
            </div>
            <div className="text-[10px] text-muted-foreground/70">vérifiés et sourcés</div>

            {/* Status row */}
            <div className="flex gap-3 pt-1 text-[10px] border-t border-border/30">
              <span className="text-green-500 font-medium">{resolvedCount} résolus</span>
              <span className="text-cyan-500 font-medium">{unconfirmedCount} non confirmés</span>
            </div>
          </div>

          {/* Color palette + cancel */}
          <div className="px-2.5 pb-2 flex items-center gap-2">
            <div className="flex h-1.5 rounded-sm overflow-hidden w-28 shadow-sm">
              {Object.entries(SEVERITY_CONFIG).map(([sev, config]) => (
                <button
                  key={sev}
                  onClick={(e) => { e.stopPropagation(); filterBySeverity(sev as SeverityLevel); }}
                  className={cn(
                    "flex-1 transition-all relative",
                    severityFilter === sev ? "ring-1 ring-white/50 z-10" : "opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: config.color }}
                  title={`${config.label}: ${stats[sev as SeverityLevel]}`}
                />
              ))}
            </div>
            {severityFilter !== "all" && (
              <button
                onClick={(e) => { e.stopPropagation(); filterBySeverity("all"); }}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>

          {/* Collapsible info */}
          <Collapsible className="border-t border-border/50">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full px-2.5 py-1.5 text-[9px] text-muted-foreground hover:bg-secondary/30 transition-colors">
                <span>Pourquoi ce chiffre ?</span>
                <ChevronDown className="h-3 w-3 transition-transform [[data-state=open]_&]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2.5 pb-2">
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                En Afrique de l'Ouest, la majorité des cyberattaques ne sont jamais rendues publiques. Seuls les incidents confirmés par une source publique figurent ici.
              </p>
              <p className="text-[9px] text-muted-foreground/60 italic mt-1">
                Source : Rapport Kaspersky 2024
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Top Right - Actions */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-background/95 backdrop-blur border-border" title="Légende">
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left" className="w-60 p-4">
            <h4 className="font-semibold text-sm mb-3">Légende</h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white" />
                <div>
                  <div className="font-medium">Sénégal</div>
                  <div className="text-muted-foreground">Cible des attaques</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-white" />
                <div>
                  <div className="font-medium">Pays source</div>
                  <div className="text-muted-foreground">Cliquer pour voir les détails</div>
                </div>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="text-muted-foreground mb-2">Gravité</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(SEVERITY_CONFIG).map(([sev, c]) => (
                    <div key={sev} className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="capitalize text-[10px]">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Map Display Options */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 bg-background/95 backdrop-blur border-border" title="Options d'affichage">
              <Map className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="left" className="w-48 p-3">
            <div className="space-y-1.5">
              <button
                onClick={() => { setViewMode("carte"); map.current?.flyTo({ center: [0, 10], zoom: 1.2, pitch: 0, duration: 1200 }); map.current?.setProjection({ name: "equirectangular" }); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all", viewMode === "carte" ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <MapIcon className="h-4 w-4" />
                <span className="font-medium">Carte</span>
              </button>
              <button
                onClick={() => { setViewMode("globe"); map.current?.flyTo({ center: [-17, 18], zoom: 2.2, pitch: 20, bearing: 0, duration: 1200 }); map.current?.setProjection({ name: "globe" }); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all", viewMode === "globe" ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <Globe className="h-4 w-4" />
                <span className="font-medium">Globe</span>
              </button>
              <button
                onClick={() => { setViewMode("senegal"); map.current?.flyTo({ center: [-17.444, 14.716], zoom: 6, pitch: 25, duration: 1200 }); }}
                className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all", viewMode === "senegal" ? "bg-primary/10 text-primary" : "hover:bg-muted")}
              >
                <Target className="h-4 w-4" />
                <span className="font-medium">Locale</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" onClick={() => setShowStats(true)} className="h-9 w-9 p-0 bg-background/95 backdrop-blur border-border" title="Statistiques">
          <BarChart3 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPdfLoading(true);
            handleDownloadPDF();
            setTimeout(() => setPdfLoading(false), 1000);
          }}
          disabled={pdfLoading}
          className="h-9 w-9 p-0 bg-background/95 backdrop-blur border-border"
          title="Exporter PDF"
        >
          {pdfLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Statistiques des cyberattaques
            </DialogTitle>
          </DialogHeader>
          <StatsPanel attacks={allAttacks.length > 0 ? allAttacks : attacks} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThreatMap;
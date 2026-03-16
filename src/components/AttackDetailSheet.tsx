import { CyberAttack, attackTypeColors, severityColors } from "@/data/cyberattacks";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Calendar,
  Users,
  Database,
  ExternalLink,
  AlertTriangle,
  Crosshair,
  Bug,
  Activity,
  Globe,
} from "lucide-react";

interface AttackDetailSheetProps {
  attack: CyberAttack | null;
  onClose: () => void;
}

const severityToScore: Record<string, number> = {
  critique: 90,
  élevé: 70,
  moyen: 45,
  faible: 20,
};

const severityToVector: Record<string, string> = {
  Ransomware: "Email / Exploit Kit",
  "Phishing/Arnaque": "Email / Ingénierie sociale",
  Malware: "Email / Téléchargement",
  DDoS: "Réseau / Botnet",
  Défiguration: "Vulnérabilité web",
  "Intrusion interne": "Accès interne / VPN",
  Fraude: "Ingénierie sociale",
  Extorsion: "RDP / Réseau",
};

const statusConfig = {
  resolved: { label: "Résolu", className: "bg-emerald-600 text-white border-0" },
  ongoing: { label: "En cours", className: "bg-amber-500 text-white border-0" },
  unknown: { label: "Inconnu", className: "bg-muted-foreground/60 text-white border-0" },
};

function getStatus(attack: CyberAttack) {
  const impact = attack.impact.toLowerCase();
  // Check for resolved indicators
  if (
    impact.includes("résolu") ||
    impact.includes("restauré") ||
    impact.includes("rétabli") ||
    impact.includes("corrigé") ||
    impact.includes("pas de paiement") ||
    impact.includes("non confirmé") ||
    impact.includes("aucune donnée perdue")
  ) {
    return "resolved";
  }
  // Check for ongoing indicators
  if (
    impact.includes("en cours") ||
    impact.includes("toujours") ||
    impact.includes("menace de")
  ) {
    return "ongoing";
  }
  return "unknown";
}

function getScoreColor(score: number) {
  if (score >= 75) return "hsl(0, 85%, 55%)";
  if (score >= 50) return "hsl(35, 90%, 50%)";
  return "hsl(142, 70%, 45%)";
}

export const AttackDetailSheet = ({ attack, onClose }: AttackDetailSheetProps) => {
  if (!attack) return null;

  const status = getStatus(attack);
  const statusInfo = statusConfig[status];
  const threatScore = severityToScore[attack.severity] ?? 50;
  const vector = severityToVector[attack.attackType] ?? "Non déterminé";
  const scoreColor = getScoreColor(threatScore);

  return (
    <Sheet open={!!attack} onOpenChange={() => onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 border-l border-primary/20 overflow-y-auto"
        style={{ backgroundColor: "hsl(210, 55%, 13%)" }}
      >
        {/* Header */}
        <SheetHeader className="p-5 pb-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base font-bold text-white leading-tight">
                {attack.victim}
              </SheetTitle>
              <p className="text-xs text-white/50 mt-1 font-mono">{attack.date}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-5 space-y-5">
          {/* Status + Severity Row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                className={statusInfo.className}
                title={status === "unknown" ? "Statut indéterminé - aucune information officielle confirmée" : ""}
              >
                {statusInfo.label}
              </Badge>
              <Badge
                className="border-0 text-white capitalize"
                style={{ backgroundColor: severityColors[attack.severity] }}
              >
                {attack.severity}
              </Badge>
              <Badge
                className="border-0 text-white"
                style={{ backgroundColor: attackTypeColors[attack.attackType] }}
              >
                {attack.attackType}
              </Badge>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-4">
            <DetailField
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Date"
              value={attack.date}
            />
            <DetailField
              icon={<Shield className="h-3.5 w-3.5" />}
              label="Type d'attaque"
              value={attack.attackType}
            />
            <DetailField
              icon={<Crosshair className="h-3.5 w-3.5" />}
              label="Vecteur d'attaque"
              value={vector}
            />
            <DetailField
              icon={<Users className="h-3.5 w-3.5" />}
              label="Auteurs"
              value={attack.hackers}
            />
            {attack.sources && attack.sources.length > 0 && (
              <DetailField
                icon={<Globe className="h-3.5 w-3.5" />}
                label="Origine"
                value={attack.sources.map(s => s.country).join(", ")}
              />
            )}
            <DetailField
              icon={<Database className="h-3.5 w-3.5" />}
              label="Données ciblées"
              value={attack.dataCategory}
              span
            />
          </div>

          <Separator className="bg-white/10" />

          {/* Impact */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white/50">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Impact estimé</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{attack.impact}</p>
          </div>

          {/* CVE */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white/50">
              <Bug className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">CVE associés</span>
            </div>
            <p className="text-sm text-white/40 italic">Aucun CVE référencé</p>
          </div>

          <Separator className="bg-white/10" />

          {/* Threat Score */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/50">
                <Activity className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Score de menace</span>
              </div>
              <span className="text-lg font-bold" style={{ color: scoreColor }}>
                {threatScore}/100
              </span>
            </div>
            <div className="relative">
              <Progress
                value={threatScore}
                className="h-2.5 bg-white/10 rounded-full"
              />
              {/* Color overlay */}
              <div
                className="absolute inset-0 h-2.5 rounded-full transition-all"
                style={{
                  width: `${threatScore}%`,
                  background: `linear-gradient(90deg, hsl(142, 70%, 45%), ${scoreColor})`,
                }}
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Source */}
          {attack.sourceUrl && (
            <a
              href={attack.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <ExternalLink className="h-4 w-4 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <p className="text-xs text-white/50 mb-0.5">Source</p>
                <p className="text-sm text-primary truncate">{attack.sourceName}</p>
              </div>
            </a>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function DetailField({
  icon,
  label,
  value,
  span,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5 text-white/40 mb-1">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-white/90">{value}</p>
    </div>
  );
}

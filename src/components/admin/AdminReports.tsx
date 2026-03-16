import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Search, Loader2, AlertTriangle, CheckCircle, Clock, XCircle, Mail, Building, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type IncidentReport = {
  id: string;
  attack_type: string;
  description: string;
  incident_date: string;
  organisation: string;
  reporter_email: string | null;
  source_url: string | null;
  status: string;
  created_at: string;
};

const ATTACK_TYPES = ["Ransomware", "DDoS", "Phishing", "Malware", "Fuite de données", "Piratage", "Autre"];
const STATUS_OPTIONS = ["nouveau", "en_cours", "traité", "rejeté"];

const STATUS_COLORS: Record<string, string> = {
  nouveau: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  en_cours: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  traité: "bg-green-500/10 text-green-500 border-green-500/30",
  rejeté: "bg-red-500/10 text-red-500 border-red-500/30",
};

export const AdminReports = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const { toast } = useToast();
  const isGuest = typeof window !== "undefined" && localStorage.getItem("admin_guest_mode") === "true";

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("incident_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") {
        setReports(getDemoReports());
      } else if (data) {
        setReports(data);
      } else {
        setReports(getDemoReports());
      }
    } catch {
      setReports(getDemoReports());
    }
    setLoading(false);
  };

  const getDemoReports = (): IncidentReport[] => [
    { id: "1", attack_type: "Ransomware", description: "Les serveurs de l'organisation ont été chiffrés par un ransomware. Demande de rançon de 50 BTC.", incident_date: "2025-03-10", organisation: "Ministère de la Santé", reporter_email: "contact@sante.gouv.sn", source_url: "https://example.com", status: "nouveau", created_at: "2025-03-10T10:30:00Z" },
    { id: "2", attack_type: "Phishing", description: "Campagne de phishing ciblant les employés de la banque. Faux emails de mise à jour de mot de passe.", incident_date: "2025-03-08", organisation: "Banque Internationale", reporter_email: "secu@banque.sn", source_url: null, status: "traité", created_at: "2025-03-08T14:20:00Z" },
    { id: "3", attack_type: "DDoS", description: "Attaque DDoS massive sur le site gouvernemental pendant 6 heures.", incident_date: "2025-03-05", organisation: "Services Publics", reporter_email: "admin@service-public.sn", source_url: "https://news..sn", status: "en_cours", created_at: "2025-03-05T09:00:00Z" },
    { id: "4", attack_type: "Fuite de données", description: "Base de données clients exposée sur le dark web après intrusion.", incident_date: "2025-03-01", organisation: "Société de Téléphonie", reporter_email: "dpo@telecom.sn", source_url: null, status: "rejeté", created_at: "2025-03-01T16:45:00Z" },
    { id: "5", attack_type: "Malware", description: "Virus informatique détecté dans le réseau interne. Propagation rapide.", incident_date: "2025-02-28", organisation: "Université Cheikh Anta Diop", reporter_email: "it@university.sn", source_url: "https://univ.sn", status: "nouveau", created_at: "2025-02-28T11:30:00Z" },
  ];

  useEffect(() => { fetchReports(); }, []);

  const filtered = reports.filter((r) => {
    const matchesSearch = r.organisation.toLowerCase().includes(search.toLowerCase()) ||
                         r.description.toLowerCase().includes(search.toLowerCase()) ||
                         r.attack_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id: string, status: string) => {
    if (isGuest) {
      toast({ title: "Mode lecture seule", description: "Impossible de modifier en mode invité", variant: "destructive" });
      return;
    }
    try {
      await (supabase as any).from("incident_reports").update({ status }).eq("id", id);
      toast({ title: "Statut mis à jour" });
      fetchReports();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (isGuest || !confirm("Supprimer ce signalement ?")) return;
    try {
      await (supabase as any).from("incident_reports").delete().eq("id", id);
      toast({ title: "Signalement supprimé" });
      fetchReports();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Signalements
          </h1>
          <p className="text-sm text-muted-foreground">{reports.length} signalements reçus</p>
        </div>
        {isGuest && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full">
            <Loader2 className="h-3 w-3" />
            Lecture seule
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="nouveau">Nouveau</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="traité">Traité</SelectItem>
            <SelectItem value="rejeté">Rejeté</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUS_OPTIONS.map((status) => {
          const count = reports.filter((r) => r.status === status).length;
          return (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(status)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground capitalize">{status.replace("_", " ")}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
                <div className={cn("p-2 rounded-lg", STATUS_COLORS[status])}>
                  {status === "nouveau" && <AlertTriangle className="h-4 w-4" />}
                  {status === "en_cours" && <Clock className="h-4 w-4" />}
                  {status === "traité" && <CheckCircle className="h-4 w-4" />}
                  {status === "rejeté" && <XCircle className="h-4 w-4" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report, index) => (
            <Card 
              key={report.id} 
              className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => { setSelectedReport(report); setDetailOpen(true); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-medium text-sm">{report.organisation}</h3>
                      <Badge variant="outline" className={STATUS_COLORS[report.status] + " capitalize text-xs"}>
                        {report.status.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{report.attack_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {report.reporter_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {report.reporter_email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(report.incident_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </div>
                  {!isGuest && (
                    <div className="flex items-center gap-1">
                      <Select value={report.status} onValueChange={(v) => updateStatus(report.id, v)}>
                        <SelectTrigger className="h-8 w-32" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucun signalement trouvé</p>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du signalement</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedReport.organisation}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{selectedReport.attack_type}</Badge>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <p className="text-sm mt-1">{selectedReport.description}</p>
              </div>
              {selectedReport.reporter_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedReport.reporter_email}</span>
                </div>
              )}
              {selectedReport.source_url && (
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a href={selectedReport.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Source
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Date: {new Date(selectedReport.incident_date).toLocaleDateString("fr-FR")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Statut:</span>
                <Badge variant="outline" className={STATUS_COLORS[selectedReport.status]}>
                  {selectedReport.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
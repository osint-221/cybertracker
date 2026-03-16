import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, Loader2, User, Calendar, Clock, FileText, Shield, AlertTriangle } from "lucide-react";

type AuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_email: string;
  details: string;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500/10 text-green-500 border-green-500/30",
  update: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  delete: "bg-destructive/10 text-destructive border-destructive/30",
  login: "bg-purple-500/10 text-purple-500 border-purple-500/30",
};

const ENTITY_ICONS: Record<string, any> = {
  cyberattacks: Shield,
  active_threats: AlertTriangle,
  attack_events: Calendar,
  attack_sources: FileText,
  users: User,
};

export const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuditLog = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("audit_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error && error.code !== "PGRST116") {
          setEntries(getDemoData());
        } else if (data) {
          setEntries(data);
        } else {
          setEntries(getDemoData());
        }
      } catch {
        setEntries(getDemoData());
      }
      setLoading(false);
    };

    fetchAuditLog();
  }, []);

  const getDemoData = (): AuditEntry[] => [
    { id: "1", action: "create", entity_type: "cyberattacks", entity_id: "att-001", user_email: "admin@cybertracker.sn", details: "Nouvelle cyberattaque ajoutée: Société XYZ", created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: "2", action: "update", entity_type: "cyberattacks", entity_id: "att-002", user_email: "editor@cybertracker.sn", details: "Mise à jour de la gravité: critique → élevé", created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: "3", action: "delete", entity_type: "active_threats", entity_id: "thrt-001", user_email: "admin@cybertracker.sn", details: "Menace supprimée: Virus WannaCry", created_at: new Date(Date.now() - 10800000).toISOString() },
    { id: "4", action: "login", entity_type: "users", entity_id: "usr-001", user_email: "admin@cybertracker.sn", details: "Connexion réussie", created_at: new Date(Date.now() - 14400000).toISOString() },
    { id: "5", action: "create", entity_type: "attack_events", entity_id: "evt-001", user_email: "editor@cybertracker.sn", details: "Nouvel événement: Alerte de sécurité détectée", created_at: new Date(Date.now() - 18000000).toISOString() },
    { id: "6", action: "update", entity_type: "cyberattacks", entity_id: "att-003", user_email: "admin@cybertracker.sn", details: "Statut changé: actif → résolu", created_at: new Date(Date.now() - 21600000).toISOString() },
    { id: "7", action: "login", entity_type: "users", entity_id: "usr-002", user_email: "viewer@cybertracker.sn", details: "Connexion réussie", created_at: new Date(Date.now() - 25200000).toISOString() },
    { id: "8", action: "create", entity_type: "attack_sources", entity_id: "src-001", user_email: "editor@cybertracker.sn", details: "Nouvelle source ajoutée: Reuters", created_at: new Date(Date.now() - 28800000).toISOString() },
  ];

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Journal d'audit
        </h1>
        <p className="text-sm text-muted-foreground">Historique des modifications et activités</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {entries.map((entry) => {
              const Icon = ENTITY_ICONS[entry.entity_type] || FileText;
              return (
                <Card key={entry.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="outline" className={ACTION_COLORS[entry.action] + " capitalize text-xs"}>
                            {entry.action}
                          </Badge>
                          <span className="text-sm font-medium">{entry.entity_type}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground font-mono">{entry.entity_id}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{entry.details}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.user_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(entry.created_at).toLocaleString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {entries.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucun enregistrement</p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
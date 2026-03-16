import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Threat = Tables<"active_threats">;
type AttackRef = { id: string; victim: string; name: string };

const THREAT_LEVELS = ["critical", "high", "medium", "low"];
const STATUSES = ["active", "monitoring", "contained", "resolved"];

const emptyForm = { threat_name: "", threat_level: "high", status: "active", details: "", attack_id: "" };

export const AdminThreats = () => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [attacks, setAttacks] = useState<AttackRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([
      supabase.from("active_threats").select("*").order("last_update", { ascending: false }),
      supabase.from("cyberattacks").select("id, victim, name").order("date", { ascending: false }),
    ]);
    setThreats(t.data || []);
    setAttacks(a.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = threats.filter(
    (t) => t.threat_name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = (threat: Threat) => {
    setForm({
      threat_name: threat.threat_name,
      threat_level: threat.threat_level,
      status: threat.status,
      details: threat.details || "",
      attack_id: threat.attack_id || "",
    });
    setEditingId(threat.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      threat_name: form.threat_name,
      threat_level: form.threat_level,
      status: form.status,
      details: form.details || null,
      attack_id: form.attack_id || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("active_threats").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("active_threats").insert(payload));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Modifié" : "Créé" });
      setDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette menace ?")) return;
    const { error } = await supabase.from("active_threats").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Supprimé" }); fetchData(); }
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const levelColor: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/30",
    high: "bg-warning/10 text-warning border-warning/30",
    medium: "bg-primary/10 text-primary border-primary/30",
    low: "bg-success/10 text-success border-success/30",
  };

  const statusColor: Record<string, string> = {
    active: "bg-destructive text-destructive-foreground",
    monitoring: "bg-warning text-warning-foreground",
    contained: "bg-primary text-primary-foreground",
    resolved: "bg-success text-success-foreground",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Menaces actives
          </h1>
          <p className="text-sm text-muted-foreground">{threats.length} menaces</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Ajouter</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-2">
            {filtered.map((threat) => (
              <Card key={threat.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{threat.threat_name}</h3>
                      <Badge variant="outline" className={levelColor[threat.threat_level] + " text-xs capitalize"}>
                        {threat.threat_level}
                      </Badge>
                      <Badge className={statusColor[threat.status] + " text-xs capitalize"}>
                        {threat.status}
                      </Badge>
                    </div>
                    {threat.details && <p className="text-xs text-muted-foreground line-clamp-2">{threat.details}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Mis à jour : {new Date(threat.last_update).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(threat)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(threat.id)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun résultat</p>}
          </div>
        </ScrollArea>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Modifier" : "Nouvelle"} menace</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nom de la menace *</label>
              <Input value={form.threat_name} onChange={(e) => updateField("threat_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Niveau *</label>
              <Select value={form.threat_level} onValueChange={(v) => updateField("threat_level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {THREAT_LEVELS.map((l) => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Statut *</label>
              <Select value={form.status} onValueChange={(v) => updateField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Attaque associée</label>
              <Select value={form.attack_id} onValueChange={(v) => updateField("attack_id", v)}>
                <SelectTrigger><SelectValue placeholder="Optionnel..." /></SelectTrigger>
                <SelectContent>
                  {attacks.map((a) => <SelectItem key={a.id} value={a.id}>{a.victim}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Détails</label>
              <Textarea value={form.details} onChange={(e) => updateField("details", e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.threat_name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

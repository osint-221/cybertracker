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
import { Plus, Pencil, Trash2, Search, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"attack_events">;
type AttackRef = { id: string; victim: string; name: string };

const EVENT_TYPES = ["alert", "critical", "action", "info", "success"];

const emptyForm = { attack_id: "", event_date: "", event_type: "info", event_description: "" };

export const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
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
    const [e, a] = await Promise.all([
      supabase.from("attack_events").select("*").order("event_date", { ascending: false }),
      supabase.from("cyberattacks").select("id, victim, name").order("date", { ascending: false }),
    ]);
    setEvents(e.data || []);
    setAttacks(a.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getAttackName = (id: string) => attacks.find((a) => a.id === id)?.victim || id;

  const filtered = events.filter(
    (e) => e.event_description.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = (event: Event) => {
    setForm({
      attack_id: event.attack_id,
      event_date: event.event_date,
      event_type: event.event_type,
      event_description: event.event_description,
    });
    setEditingId(event.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      attack_id: form.attack_id,
      event_date: form.event_date,
      event_type: form.event_type,
      event_description: form.event_description,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("attack_events").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("attack_events").insert(payload));
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
    if (!confirm("Supprimer cet événement ?")) return;
    const { error } = await supabase.from("attack_events").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Supprimé" }); fetchData(); }
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const typeColor: Record<string, string> = {
    alert: "bg-warning/10 text-warning",
    critical: "bg-destructive/10 text-destructive",
    action: "bg-primary/10 text-primary",
    info: "bg-secondary text-foreground",
    success: "bg-success/10 text-success",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-success" />
            Événements
          </h1>
          <p className="text-sm text-muted-foreground">{events.length} événements</p>
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
            {filtered.map((event) => (
              <Card key={event.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={typeColor[event.event_type] + " text-xs capitalize"}>
                        {event.event_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{event.event_date}</span>
                    </div>
                    <p className="text-sm">{event.event_description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getAttackName(event.attack_id)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(event)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? "Modifier" : "Nouvel"} événement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Attaque associée *</label>
              <Select value={form.attack_id} onValueChange={(v) => updateField("attack_id", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {attacks.map((a) => <SelectItem key={a.id} value={a.id}>{a.victim}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date *</label>
              <Input type="date" value={form.event_date} onChange={(e) => updateField("event_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Type *</label>
              <Select value={form.event_type} onValueChange={(v) => updateField("event_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description *</label>
              <Textarea value={form.event_description} onChange={(e) => updateField("event_description", e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.attack_id || !form.event_date || !form.event_description}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

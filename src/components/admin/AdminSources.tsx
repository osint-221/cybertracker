import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, FileText, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Source = Tables<"attack_sources">;
type AttackRef = { id: string; victim: string; name: string };

const emptyForm = { attack_id: "", source_name: "", source_type: "", source_url: "" };

export const AdminSources = () => {
  const [sources, setSources] = useState<Source[]>([]);
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
    const [s, a] = await Promise.all([
      supabase.from("attack_sources").select("*").order("created_at", { ascending: false }),
      supabase.from("cyberattacks").select("id, victim, name").order("date", { ascending: false }),
    ]);
    setSources(s.data || []);
    setAttacks(a.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getAttackName = (id: string) => attacks.find((a) => a.id === id)?.victim || id;

  const filtered = sources.filter(
    (s) => s.source_name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };

  const openEdit = (source: Source) => {
    setForm({
      attack_id: source.attack_id,
      source_name: source.source_name,
      source_type: source.source_type || "",
      source_url: source.source_url || "",
    });
    setEditingId(source.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      attack_id: form.attack_id,
      source_name: form.source_name,
      source_type: form.source_type || null,
      source_url: form.source_url || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("attack_sources").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("attack_sources").insert(payload));
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
    if (!confirm("Supprimer cette source ?")) return;
    const { error } = await supabase.from("attack_sources").delete().eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Supprimé" }); fetchData(); }
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-warning" />
            Sources
          </h1>
          <p className="text-sm text-muted-foreground">{sources.length} sources enregistrées</p>
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
            {filtered.map((source) => (
              <Card key={source.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{source.source_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{getAttackName(source.attack_id)}</span>
                      {source.source_type && <><span>•</span><span>{source.source_type}</span></>}
                    </div>
                    {source.source_url && (
                      <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="h-3 w-3" />Voir
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(source)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(source.id)} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editingId ? "Modifier" : "Nouvelle"} source</DialogTitle></DialogHeader>
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
              <label className="text-xs font-medium">Nom de la source *</label>
              <Input value={form.source_name} onChange={(e) => updateField("source_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Type</label>
              <Input value={form.source_type} onChange={(e) => updateField("source_type", e.target.value)} placeholder="Article, Rapport, Tweet..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">URL</label>
              <Input value={form.source_url} onChange={(e) => updateField("source_url", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.attack_id || !form.source_name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Loader2, FileText, Clock, ExternalLink, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Source = Tables<"attack_sources">;
type Event = Tables<"attack_events">;
type AttackRef = { id: string; victim: string };

const SOURCE_TYPES = ["news", "government", "security", "social", "other"];
const EVENT_TYPES = ["alert", "critical", "action", "info", "success"];

const SOURCE_TYPE_COLORS: Record<string, string> = {
  news: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  government: "bg-purple-500/10 text-purple-500 border-purple-500/30",
  security: "bg-green-500/10 text-green-500 border-green-500/30",
  social: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  other: "bg-muted text-muted-foreground",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  alert: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  critical: "bg-red-500/10 text-red-500 border-red-500/30",
  action: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  info: "bg-muted text-muted-foreground",
  success: "bg-green-500/10 text-green-500 border-green-500/30",
};

const emptySourceForm = { source_name: "", source_type: "news", source_url: "" };
const emptyEventForm = { attack_id: "", event_date: "", event_type: "info", event_description: "" };

export const AdminActivity = () => {
  const [activeTab, setActiveTab] = useState("sources");
  const [sources, setSources] = useState<Source[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [attacks, setAttacks] = useState<AttackRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState(emptySourceForm);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const isGuest = typeof window !== "undefined" && localStorage.getItem("admin_guest_mode") === "true";

  const fetchData = async () => {
    setLoading(true);
    const [s, e, a] = await Promise.all([
      supabase.from("attack_sources").select("*").order("created_at", { ascending: false }),
      supabase.from("attack_events").select("*").order("event_date", { ascending: false }),
      supabase.from("cyberattacks").select("id, victim").order("date", { ascending: false }),
    ]);
    if (s.error) console.error("Error fetching sources:", s.error);
    if (e.error) console.error("Error fetching events:", e.error);
    if (a.error) console.error("Error fetching attacks:", a.error);
    setSources(s.data || []);
    setEvents(e.data || []);
    setAttacks(a.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredSources = sources.filter((s) =>
    s.source_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEvents = events.filter((e) =>
    e.event_description?.toLowerCase().includes(search.toLowerCase()) ||
    e.event_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveSource = async () => {
    if (isGuest) return;
    setSaving(true);
    try {
        if (editingSourceId) {
        await supabase.from("attack_sources").update(sourceForm).eq("id", editingSourceId);
        toast({ title: "Source mise à jour" });
      } else {
        await (supabase as any).from("attack_sources").insert({ ...sourceForm, created_at: new Date().toISOString() });
        toast({ title: "Source créée" });
      }
      setSourceDialogOpen(false);
      setSourceForm(emptySourceForm);
      setEditingSourceId(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleSaveEvent = async () => {
    if (isGuest) return;
    setSaving(true);
    try {
      if (editingEventId) {
        await supabase.from("attack_events").update(eventForm).eq("id", editingEventId);
        toast({ title: "Événement mis à jour" });
      } else {
        await supabase.from("attack_events").insert({ ...eventForm, created_at: new Date().toISOString() });
        toast({ title: "Événement créé" });
      }
      setEventDialogOpen(false);
      setEventForm(emptyEventForm);
      setEditingEventId(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDeleteSource = async (id: string) => {
    if (isGuest || !confirm("Supprimer cette source ?")) return;
    await supabase.from("attack_sources").delete().eq("id", id);
    toast({ title: "Source supprimée" });
    fetchData();
  };

  const handleDeleteEvent = async (id: string) => {
    if (isGuest || !confirm("Supprimer cet événement ?")) return;
    await supabase.from("attack_events").delete().eq("id", id);
    toast({ title: "Événement supprimé" });
    fetchData();
  };

  const openEditSource = (source: Source) => {
    setSourceForm({ source_name: source.source_name, source_type: source.source_type, source_url: source.source_url || "" });
    setEditingSourceId(source.id);
    setSourceDialogOpen(true);
  };

  const openEditEvent = (event: Event) => {
    setEventForm({ 
      attack_id: event.attack_id || "", 
      event_date: event.event_date || "", 
      event_type: event.event_type, 
      event_description: event.event_description || "" 
    });
    setEditingEventId(event.id);
    setEventDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Flux de données
          </h1>
          <p className="text-sm text-muted-foreground">Sources et événements</p>
        </div>
        {isGuest && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full">
            Lecture seule
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sources" className="gap-2">
            <FileText className="h-4 w-4" />
            Sources ({sources.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Clock className="h-4 w-4" />
            Événements ({events.length})
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Sources Tab */}
        <TabsContent value="sources" className="mt-4">
          {!isGuest && (
            <Button onClick={() => { setSourceForm(emptySourceForm); setEditingSourceId(null); setSourceDialogOpen(true); }} className="gap-2 mb-4">
              <Plus className="h-4 w-4" />
              Ajouter une source
            </Button>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSources.map((source, index) => (
                <Card key={source.id} className="hover:shadow-md transition-all duration-200" style={{ animationDelay: `${index * 30}ms` }}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{source.source_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={SOURCE_TYPE_COLORS[source.source_type] + " text-xs capitalize"}>
                            {source.source_type}
                          </Badge>
                          {source.source_url && (
                            <a href={source.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Lien
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isGuest && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditSource(source)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSource(source.id)} className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredSources.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucune source trouvée</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4">
          {!isGuest && (
            <Button onClick={() => { setEventForm(emptyEventForm); setEditingEventId(null); setEventDialogOpen(true); }} className="gap-2 mb-4">
              <Plus className="h-4 w-4" />
              Ajouter un événement
            </Button>
          )}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents.map((event, index) => (
                <Card key={event.id} className="hover:shadow-md transition-all duration-200" style={{ animationDelay: `${index * 30}ms` }}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={EVENT_TYPE_COLORS[event.event_type] + " text-xs capitalize"}>
                            {event.event_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{event.event_date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{event.event_description}</p>
                      </div>
                    </div>
                    {!isGuest && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditEvent(event)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEvent(event.id)} className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {filteredEvents.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucun événement trouvé</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Source Dialog */}
      <Dialog open={sourceDialogOpen} onOpenChange={setSourceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSourceId ? "Modifier" : "Nouvelle"} source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nom *</label>
              <Input value={sourceForm.source_name} onChange={(e) => setSourceForm({ ...sourceForm, source_name: e.target.value })} placeholder="Nom de la source" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Type *</label>
              <Select value={sourceForm.source_type} onValueChange={(v) => setSourceForm({ ...sourceForm, source_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">URL (optionnel)</label>
              <Input value={sourceForm.source_url} onChange={(e) => setSourceForm({ ...sourceForm, source_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSourceDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveSource} disabled={saving || !sourceForm.source_name}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEventId ? "Modifier" : "Nouvel"} événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Attaque liée</label>
              <Select value={eventForm.attack_id} onValueChange={(v) => setEventForm({ ...eventForm, attack_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une attaque" /></SelectTrigger>
                <SelectContent>
                  {attacks.map((a) => <SelectItem key={a.id} value={a.id}>{a.victim}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Type *</label>
              <Select value={eventForm.event_type} onValueChange={(v) => setEventForm({ ...eventForm, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date</label>
              <Input type="date" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <Textarea value={eventForm.event_description} onChange={(e) => setEventForm({ ...eventForm, event_description: e.target.value })} placeholder="Description de l'événement" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveEvent} disabled={saving || !eventForm.event_type}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
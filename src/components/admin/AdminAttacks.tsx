import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Search, Shield, Loader2, Filter, X, Twitter, ChevronUp, ChevronDown, Download, CheckSquare, Square, Trash, ToggleLeft, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { AdminTwitterPosts } from "./AdminTwitterPosts";

type Attack = Tables<"cyberattacks">;

const ATTACK_TYPES = [
  "Phishing/Arnaque", "Malware", "Défiguration", "Intrusion interne",
  "Ransomware", "DDoS", "Fraude", "Extorsion",
];
const SEVERITIES = ["critique", "élevé", "moyen", "faible"];

const emptyForm = {
  name: "", victim: "", attack_type: "Ransomware", severity: "moyen",
  date: "", lat: "14.7", lng: "-17.45", description: "",
  hacker_group: "", impact: "", target_data: "", is_active: false,
};

export const AdminAttacks = () => {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [twitterDialogOpen, setTwitterDialogOpen] = useState(false);
  const [selectedAttackForTwitter, setSelectedAttackForTwitter] = useState<Attack | null>(null);
  const { toast } = useToast();
  const isGuest = typeof window !== "undefined" && localStorage.getItem("admin_guest_mode") === "true";
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");

  const fetchAttacks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cyberattacks")
      .select("*");
    if (error) {
      console.error("Error fetching attacks:", error);
    }
    
    // Sort by date (most recent first) - handle various date formats
    const sortedData = (data || []).sort((a, b) => {
      const parseDate = (dateStr: string) => {
        if (!dateStr) return 0;
        
        // Extract year
        const yearMatch = dateStr.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0]) : 0;
        
        // Extract month - if no month specified, use 12 (end of year) so it sorts first
        const monthNames: Record<string, number> = {
          'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4, 'Mai': 5, 'Juin': 6,
          'Juillet': 7, 'Août': 8, 'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12,
          'Jan': 1, 'Fév': 2, 'Fev': 2, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Sept': 9, 'Oct': 10, 'Nov': 11, 'Déc': 12, 'Dec': 12
        };
        
        const lowerDate = dateStr.toLowerCase();
        const monthMatch = Object.keys(monthNames).find(m => lowerDate.includes(m.toLowerCase()));
        // If no month found in the string, use 12 (December - end of year for sorting)
        const month = monthMatch ? monthNames[monthMatch] : 12;
        
        // Create a sortable value - higher = more recent
        // Format: YYYYMM (e.g., 202602 for Feb 2026)
        return year * 100 + month;
      };
      
      // Sort descending (most recent first)
      return parseDate(b.date) - parseDate(a.date);
    });
    
    setAttacks(sortedData);
    setLoading(false);
  };

  useEffect(() => { fetchAttacks(); }, []);

  const years = [...new Set(attacks.map((a) => a.date?.substring(0, 4)).filter(Boolean))].sort().reverse();

  const filtered = attacks.filter((a) => {
    const matchesSearch =
      a.victim.toLowerCase().includes(search.toLowerCase()) ||
      (a.hacker_group && a.hacker_group.toLowerCase().includes(search.toLowerCase())) ||
      a.attack_type.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || a.severity === filterSeverity;
    const matchesType = filterType === "all" || a.attack_type === filterType;
    const matchesYear = filterYear === "all" || a.date?.startsWith(filterYear);
    return matchesSearch && matchesSeverity && matchesType && matchesYear;
  });

  const hasActiveFilters = filterSeverity !== "all" || filterType !== "all" || filterYear !== "all";

  // Helper function to parse French dates
  const parseDateValue = (dateStr: string): number => {
    if (!dateStr) return 0;
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : 0;
    const monthNames: Record<string, number> = {
      'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4, 'Mai': 5, 'Juin': 6,
      'Juillet': 7, 'Août': 8, 'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12,
      'Jan': 1, 'Fév': 2, 'Fev': 2, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'Jun': 6, 'Jul': 7, 'Aug': 8, 'Sep': 9, 'Sept': 9, 'Oct': 10, 'Nov': 11, 'Déc': 12, 'Dec': 12
    };
    const lowerDate = dateStr.toLowerCase();
    const monthMatch = Object.keys(monthNames).find(m => lowerDate.includes(m.toLowerCase()));
    const month = monthMatch ? monthNames[monthMatch] : 12;
    return year * 100 + month;
  };

  const sortedAndFiltered = [...filtered].sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    if (sortColumn === "date") {
      // Use numeric date parsing for French dates
      aVal = parseDateValue(a.date || "");
      bVal = parseDateValue(b.date || "");
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    
    aVal = a[sortColumn as keyof Attack];
    bVal = b[sortColumn as keyof Attack];
    
    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";
    
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedAndFiltered.length / itemsPerPage);
  const paginatedAttacks = sortedAndFiltered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Victime", "Type", "Gravité", "Date", "Groupe hacker", "Actif"];
    const rows = sortedAndFiltered.map(a => [
      a.victim,
      a.attack_type,
      a.severity,
      a.date,
      a.hacker_group || "",
      a.is_active ? "Oui" : "Non"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cyberattacks_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedAttacks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedAttacks.map(a => a.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedIds.size} attaques ?`)) return;
    setLoading(true);
    for (const id of selectedIds) {
      await supabase.from("cyberattacks").delete().eq("id", id);
    }
    setSelectedIds(new Set());
    fetchAttacks();
    setCurrentPage(1);
  };

  const handleBulkToggleActive = async (active: boolean) => {
    for (const id of selectedIds) {
      await supabase.from("cyberattacks").update({ is_active: active }).eq("id", id);
    }
    setSelectedIds(new Set());
    fetchAttacks();
  };

  const clearFilters = () => {
    setFilterSeverity("all");
    setFilterType("all");
    setFilterYear("all");
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (attack: Attack) => {
    setForm({
      name: attack.name,
      victim: attack.victim,
      attack_type: attack.attack_type,
      severity: attack.severity,
      date: attack.date,
      lat: String(attack.lat),
      lng: String(attack.lng),
      description: attack.description || "",
      hacker_group: attack.hacker_group || "",
      impact: attack.impact || "",
      target_data: attack.target_data || "",
      is_active: attack.is_active || false,
    });
    setEditingId(attack.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      victim: form.victim,
      attack_type: form.attack_type,
      severity: form.severity,
      date: form.date,
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      description: form.description || null,
      hacker_group: form.hacker_group || null,
      impact: form.impact || null,
      target_data: form.target_data || null,
      is_active: form.is_active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("cyberattacks").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("cyberattacks").insert(payload));
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Modifié" : "Créé", description: "Cyberattaque enregistrée." });
      setDialogOpen(false);
      fetchAttacks();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette cyberattaque ?")) return;
    const { error } = await supabase.from("cyberattacks").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Supprimé" });
      fetchAttacks();
    }
  };

  const toggleActive = async (attack: Attack) => {
    const { error } = await supabase
      .from("cyberattacks")
      .update({ is_active: !attack.is_active })
      .eq("id", attack.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      fetchAttacks();
    }
  };

  const updateField = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const severityColor: Record<string, string> = {
    critique: "bg-destructive/10 text-destructive border-destructive/30",
    élevé: "bg-warning/10 text-warning border-warning/30",
    moyen: "bg-primary/10 text-primary border-primary/30",
    faible: "bg-success/10 text-success border-success/30",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Cyberattaques
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-medium">{sortedAndFiltered.length}</span>
            <span>sur {attacks.length} incidents</span>
          </p>
        </div>
        {!isGuest && (
          <Button onClick={openCreate} className="gap-2 hover:shadow-md transition-shadow">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
        {isGuest && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-full">
            <EyeOff className="h-3 w-3" />
            Lecture seule
          </div>
        )}
      </div>

      {/* Search + Filters */}
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

        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Gravité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes gravités</SelectItem>
            {SEVERITIES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            {ATTACK_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]">
            <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes années</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </Button>
        )}
        
        {!isGuest && (
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5 ml-auto">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {!isGuest && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 border rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} sélectionné(s)</span>
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleActive(true)} className="gap-1">
            <ToggleLeft className="h-4 w-4" />
            Activer
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBulkToggleActive(false)} className="gap-1">
            <ToggleLeft className="h-4 w-4" />
            Désactiver
          </Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1">
            <Trash className="h-4 w-4" />
            Supprimer
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Annuler
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-auto">
          {/* Table Header for sorting */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b sticky top-0 bg-background z-10">
            <div className="col-span-1 flex items-center gap-1">
              <button onClick={toggleSelectAll} className="p-1 hover:text-primary">
                {selectedIds.size === paginatedAttacks.length && paginatedAttacks.length > 0 ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="col-span-3">
              <button onClick={() => handleSort("victim")} className="flex items-center gap-1 hover:text-primary">
                Victime
                {sortColumn === "victim" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </button>
            </div>
            <div className="col-span-2">
              <button onClick={() => handleSort("attack_type")} className="flex items-center gap-1 hover:text-primary">
                Type
                {sortColumn === "attack_type" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </button>
            </div>
            <div className="col-span-2">
              <button onClick={() => handleSort("severity")} className="flex items-center gap-1 hover:text-primary">
                Gravité
                {sortColumn === "severity" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </button>
            </div>
            <div className="col-span-2">
              <button onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-primary">
                Date
                {sortColumn === "date" && (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </button>
            </div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          <div className="space-y-2 mt-2">
            {paginatedAttacks.map((attack, index) => (
              <Card 
                key={attack.id} 
                className={`hover:border-primary/30 hover:shadow-md transition-all duration-200 group ${selectedIds.has(attack.id) ? 'border-primary bg-primary/5' : ''}`}
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {!isGuest && (
                    <button 
                      onClick={() => toggleSelect(attack.id)} 
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {selectedIds.has(attack.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground group-hover:text-primary/50" />
                      )}
                    </button>
                  )}
                  <div className="flex-1 min-w-0 grid grid-cols-11 gap-2 items-center">
                    <div className="col-span-3 min-w-0">
                      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{attack.victim}</h3>
                      {attack.hacker_group && (
                        <p className="text-xs text-muted-foreground truncate">{attack.hacker_group}</p>
                      )}
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground truncate">{attack.attack_type}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className={severityColor[attack.severity] + " capitalize text-xs"}>
                        {attack.severity}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">{attack.date}</div>
                    <div className="col-span-2 flex items-center gap-2 justify-end">
                      {isGuest ? (
                        <span className="text-xs text-muted-foreground">{attack.is_active ? "Active" : "Inactive"}</span>
                      ) : (
                        <>
                          <Switch
                            checked={attack.is_active || false}
                            onCheckedChange={() => toggleActive(attack)}
                            className="data-[state=checked]:bg-destructive h-5 w-9"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setSelectedAttackForTwitter(attack);
                            setTwitterDialogOpen(true);
                          }}>
                            <Twitter className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(attack)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(attack.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Aucun résultat</p>
            )}
          </div>
        </div>
      )}
      
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between py-3 px-4 border-t">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} sur {totalPages} ({sortedAndFiltered.length} résultats)
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</Button>
            <span className="px-2 text-xs">{currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier" : "Nouvelle"} cyberattaque</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nom *</label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Victime *</label>
              <Input value={form.victim} onChange={(e) => updateField("victim", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Type *</label>
              <Select value={form.attack_type} onValueChange={(v) => updateField("attack_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ATTACK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Gravité *</label>
              <Select value={form.severity} onValueChange={(v) => updateField("severity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Date *</label>
              <Input type="date" value={form.date} onChange={(e) => updateField("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Groupe hacker</label>
              <Input value={form.hacker_group} onChange={(e) => updateField("hacker_group", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Latitude</label>
              <Input type="number" step="any" value={form.lat} onChange={(e) => updateField("lat", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Longitude</label>
              <Input type="number" step="any" value={form.lng} onChange={(e) => updateField("lng", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">Impact</label>
              <Input value={form.impact} onChange={(e) => updateField("impact", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">Données ciblées</label>
              <Input value={form.target_data} onChange={(e) => updateField("target_data", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <label className="text-sm font-medium">Attaque active</label>
                <p className="text-xs text-muted-foreground">Marquer cette attaque comme actuellement en cours</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => updateField("is_active", v)}
                className="data-[state=checked]:bg-destructive"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.victim || !form.date}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Twitter Posts Dialog */}
      {selectedAttackForTwitter && (
        <AdminTwitterPosts
          attack={selectedAttackForTwitter}
          open={twitterDialogOpen}
          onOpenChange={setTwitterDialogOpen}
        />
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Search, Users, Loader2, Shield, Calendar, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
};

const ROLES = ["admin", "editor", "viewer"];

const emptyForm = { email: "", role: "viewer" };

export const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") {
        console.log("Table admin_users non trouvée - mode démonstration");
        setUsers([
          { id: "1", email: "admin@cybertracker.sn", role: "admin", created_at: new Date().toISOString() },
          { id: "2", email: "editor@cybertracker.sn", role: "editor", created_at: new Date().toISOString() },
          { id: "3", email: "viewer@cybertracker.sn", role: "viewer", created_at: new Date().toISOString() },
        ]);
      } else if (data) {
        setUsers(data);
      }
    } catch (e) {
      setUsers([
        { id: "1", email: "admin@cybertracker.sn", role: "admin", created_at: new Date().toISOString() },
        { id: "2", email: "editor@cybertracker.sn", role: "editor", created_at: new Date().toISOString() },
        { id: "3", email: "viewer@cybertracker.sn", role: "viewer", created_at: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase()) ||
           u.role.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setForm({ email: user.email, role: user.role });
    setEditingId(user.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("admin_users")
        .upsert({
          id: editingId || crypto.randomUUID(),
          email: form.email,
          role: form.role,
          created_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (error) throw error;
      toast({ title: editingId ? "Modifié" : "Créé" });
      setDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try {
      const { error } = await (supabase as any).from("admin_users").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Supprimé" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const updateField = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const roleColor: Record<string, string> = {
    admin: "bg-destructive/10 text-destructive border-destructive/30",
    editor: "bg-warning/10 text-warning border-warning/30",
    viewer: "bg-primary/10 text-primary border-primary/30",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">{users.length} utilisateurs</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          La gestion des utilisateurs nécessite la table <code>admin_users</code> dans Supabase. 
          Ajoutez cette table via la console Supabase pour activer la gestion complète des utilisateurs.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <Card key={user.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{user.email}</h3>
                    <Badge variant="outline" className={roleColor[user.role] + " capitalize text-xs"}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Créé: {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucun résultat</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier" : "Nouvel"} utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Email *</label>
              <Input
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="email@exemple.com"
                disabled={!!editingId}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Rôle *</label>
              <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {r}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.email}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
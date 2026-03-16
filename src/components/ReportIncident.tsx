import { useState } from "react";
import { Send, AlertTriangle, CheckCircle, ArrowRight, Shield, Globe, Calendar, FileText, Link2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportIncidentDialog = ({ open, onOpenChange }: ReportIncidentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    victim: "",
    date: "",
    description: "",
    source_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setForm({
      victim: "",
      date: "",
      description: "",
      source_url: "",
    });
    setErrors({});
    setSubmitted(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.victim.trim()) newErrors.victim = "Ce champ est requis";
    if (!form.date) newErrors.date = "La date est requise";
    if (!form.description.trim() || form.description.length < 10) newErrors.description = "Décrivez en quelques mots (minimum 10 caractères)";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("incident_reports").insert({
        organisation: form.victim.trim(),
        incident_date: form.date,
        attack_type: "À catégoriser",
        description: form.description.trim(),
        source_url: form.source_url.trim() || null,
        reporter_email: null,
      });

      if (error) throw error;

      setSubmitted(true);
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
      }, 3000);
    } catch (err: any) {
      toast.error("Erreur d'envoi", {
        description: err.message || "Veuillez réessayer plus tard.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-md bg-card border-green-500/20 p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-bold">Merci pour votre signalement !</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Votre contribution aide à protéger la communauté numérique sénégalaise.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Traitement anonyme - Aucune donnée personnelle collectée
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-md bg-card border-primary/20 p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Signaler une cybermenace
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-1">
            Anonyme • Rapide • Sans inscription
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Victim */}
          <div className="space-y-1.5">
            <Label htmlFor="victim" className="text-sm font-medium">
              Qui est concerné ?
            </Label>
            <Input
              id="victim"
              placeholder="Entreprise, particulier, site web..."
              value={form.victim}
              onChange={(e) => updateField("victim", e.target.value)}
              className={cn(
                "bg-secondary/50 border-0",
                errors.victim && "border-destructive"
              )}
            />
            {errors.victim && <p className="text-xs text-destructive">{errors.victim}</p>}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-medium">
              Quand ?
            </Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => updateField("date", e.target.value)}
              className={cn(
                "bg-secondary/50 border-0",
                errors.date && "border-destructive"
              )}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Que s'est-il passé ?
            </Label>
            <Textarea
              id="description"
              placeholder="Décrivez simplement ce que vous avez vécu ou constaté..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className={cn(
                "bg-secondary/50 border-0 resize-none",
                errors.description && "border-destructive"
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{form.description.length} caractères</span>
              <span>Min. 10</span>
            </div>
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Source URL - Optional */}
          <div className="space-y-1.5">
            <Label htmlFor="source_url" className="text-sm font-medium text-muted-foreground">
              Une source ? (optionnel)
            </Label>
            <Input
              id="source_url"
              type="url"
              placeholder="https://..."
              value={form.source_url}
              onChange={(e) => updateField("source_url", e.target.value)}
              className="bg-secondary/50 border-0"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 gap-2"
          >
            {loading ? (
              "Envoi..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer anonymement
              </>
            )}
          </Button>

          {/* Privacy note */}
          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" />
            Signalement anonyme - Aucune donnée personnelle requise
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

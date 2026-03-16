import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Chercher l'utilisateur dans admin_users
      const { data: users, error: userError } = await (supabase as any)
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true);

      if (userError) throw userError;
      if (!users || users.length === 0) {
        throw new Error("Utilisateur non trouvé ou désactivé");
      }

      const user = users[0];

      // Note: En production, utiliser un hash de mot de passe (bcrypt)
      // Pour simplifier, on compare directement (à améliorer avec hash)
      if (user.password_hash === password) {
        // Mettre à jour last_login
        await (supabase as any)
          .from("admin_users")
          .update({ last_login: new Date().toISOString() })
          .eq("id", user.id);

        // Stocker les infos utilisateur
        localStorage.setItem("admin_user", JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
          full_name: user.full_name
        }));

        toast({ title: "Connexion réussie", description: `Bienvenue ${user.full_name}` });
        navigate("/admin/dashboard");
      } else {
        throw new Error("Mot de passe incorrect");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-destructive/5" />
      
      <Card className="relative w-full max-w-md border-primary/20 shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto">
            <a href="/" className="flex flex-col items-center">
              <span className="text-2xl font-bold tracking-wider text-foreground" style={{ fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 10px hsl(var(--primary) / 0.5)" }}>
                Cyber<span className="text-primary">Tracker</span> <span className="text-primary text-lg tracking-widest opacity-70">SN</span>
              </span>
              <span className="text-[10px] text-muted-foreground/60 italic mt-1">Administration</span>
            </a>
          </div>
          <CardDescription>
            Connectez-vous pour accéder au tableau de bord
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="admin@cybertracker.sn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mot de passe</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary/50"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;

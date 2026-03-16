import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AdminUser {
  user: User | null;
  isAdmin: boolean;
  isGuest: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  signInAsGuest: () => void;
  adminUser: { id: string; email: string; role: string; full_name: string } | null;
}

export const useAdminAuth = (): AdminUser => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; role: string; full_name: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier d'abord si on est en mode admin_user (connexion simple)
    const storedAdmin = localStorage.getItem("admin_user");
    if (storedAdmin) {
      try {
        const admin = JSON.parse(storedAdmin);
        setAdminUser(admin);
        setIsAdmin(admin.role === "admin");
        setUser({
          id: admin.id,
          email: admin.email,
          app_metadata: {},
          user_metadata: { full_name: admin.full_name },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("admin_user");
      }
    }

    // Sinon, vérifier le mode guest
    const isGuest = localStorage.getItem("admin_guest_mode") === "true";
    if (isGuest) {
      setIsGuest(true);
      setUser({
        id: "guest-user",
        email: "invite@cybertracker.sn",
        app_metadata: {},
        user_metadata: { full_name: "Invité" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      setLoading(false);
      return;
    }

    // Pas connecté
    setUser(null);
    setIsAdmin(false);
    setIsGuest(false);
    setLoading(false);
  }, []);

  const signOut = async () => {
    setIsGuest(false);
    setAdminUser(null);
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_guest_mode");
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const signInAsGuest = () => {
    setIsGuest(true);
    setAdminUser(null);
    setUser({
      id: "guest-user",
      email: "invite@cybertracker.sn",
      app_metadata: {},
      user_metadata: { full_name: "Invité" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User);
    setIsAdmin(false);
    setLoading(false);
  };

  return { user, isAdmin, isGuest, loading, signOut, signInAsGuest, adminUser };
};
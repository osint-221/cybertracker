import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, ExternalLink, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Attack = Tables<"cyberattacks">;

interface Props {
  attack: Attack;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TwitterPost {
  id: string;
  attack_id: string;
  post_url: string;
  author: string;
  content: string | null;
  post_date: string | null;
  created_at: string;
}

export const AdminTwitterPosts = ({ attack, open, onOpenChange }: Props) => {
  const [posts, setPosts] = useState<TwitterPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPost, setNewPost] = useState({ post_url: "", author: "", content: "" });
  const { toast } = useToast();

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("attack_twitter_posts")
      .select("*")
      .eq("attack_id", attack.id)
      .order("created_at", { ascending: false });
    setPosts((data as TwitterPost[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchPosts();
  }, [open, attack.id]);

  const handleAdd = async () => {
    if (!newPost.post_url || !newPost.author) return;
    setSaving(true);
    const { error } = await supabase.from("attack_twitter_posts").insert({
      attack_id: attack.id,
      post_url: newPost.post_url,
      author: newPost.author,
      content: newPost.content || null,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setNewPost({ post_url: "", author: "", content: "" });
      fetchPosts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("attack_twitter_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      fetchPosts();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            Posts X — {attack.victim}
          </DialogTitle>
        </DialogHeader>

        {/* Add new post */}
        <div className="space-y-2 border rounded-lg p-3">
          <Input
            placeholder="@auteur (ex: @_saxx_)"
            value={newPost.author}
            onChange={(e) => setNewPost((p) => ({ ...p, author: e.target.value }))}
          />
          <Input
            placeholder="URL du post (https://x.com/...)"
            value={newPost.post_url}
            onChange={(e) => setNewPost((p) => ({ ...p, post_url: e.target.value }))}
          />
          <Textarea
            placeholder="Contenu / résumé du post (optionnel)"
            value={newPost.content}
            onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))}
            rows={2}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={saving || !newPost.post_url || !newPost.author}
            className="gap-1"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Ajouter
          </Button>
        </div>

        {/* List posts */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">Aucun post lié à cette attaque</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 border rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{post.author}</p>
                  {post.content && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.content}</p>
                  )}
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir le post
                  </a>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="hover:text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

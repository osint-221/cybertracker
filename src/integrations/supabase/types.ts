export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      active_threats: {
        Row: {
          attack_id: string | null
          created_at: string
          details: string | null
          id: string
          last_update: string
          status: string
          threat_level: string
          threat_name: string
        }
        Insert: {
          attack_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          last_update?: string
          status: string
          threat_level: string
          threat_name: string
        }
        Update: {
          attack_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          last_update?: string
          status?: string
          threat_level?: string
          threat_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_threats_attack_id_fkey"
            columns: ["attack_id"]
            isOneToOne: false
            referencedRelation: "cyberattacks"
            referencedColumns: ["id"]
          },
        ]
      }
      attack_events: {
        Row: {
          attack_id: string
          created_at: string
          event_date: string
          event_description: string
          event_type: string
          id: string
        }
        Insert: {
          attack_id: string
          created_at?: string
          event_date: string
          event_description: string
          event_type: string
          id?: string
        }
        Update: {
          attack_id?: string
          created_at?: string
          event_date?: string
          event_description?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attack_events_attack_id_fkey"
            columns: ["attack_id"]
            isOneToOne: false
            referencedRelation: "cyberattacks"
            referencedColumns: ["id"]
          },
        ]
      }
      attack_sources: {
        Row: {
          attack_id: string
          created_at: string
          id: string
          source_name: string
          source_type: string | null
          source_url: string | null
        }
        Insert: {
          attack_id: string
          created_at?: string
          id?: string
          source_name: string
          source_type?: string | null
          source_url?: string | null
        }
        Update: {
          attack_id?: string
          created_at?: string
          id?: string
          source_name?: string
          source_type?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attack_sources_attack_id_fkey"
            columns: ["attack_id"]
            isOneToOne: false
            referencedRelation: "cyberattacks"
            referencedColumns: ["id"]
          },
        ]
      }
      attack_twitter_posts: {
        Row: {
          attack_id: string
          author: string
          content: string | null
          created_at: string
          id: string
          post_date: string | null
          post_url: string
        }
        Insert: {
          attack_id: string
          author: string
          content?: string | null
          created_at?: string
          id?: string
          post_date?: string | null
          post_url: string
        }
        Update: {
          attack_id?: string
          author?: string
          content?: string | null
          created_at?: string
          id?: string
          post_date?: string | null
          post_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "attack_twitter_posts_attack_id_fkey"
            columns: ["attack_id"]
            isOneToOne: false
            referencedRelation: "cyberattacks"
            referencedColumns: ["id"]
          },
        ]
      }
      cyberattacks: {
        Row: {
          attack_type: string
          created_at: string
          date: string
          description: string | null
          hacker_group: string | null
          id: string
          impact: string | null
          is_active: boolean | null
          lat: number
          lng: number
          name: string
          severity: string
          target_data: string | null
          updated_at: string
          victim: string
        }
        Insert: {
          attack_type: string
          created_at?: string
          date: string
          description?: string | null
          hacker_group?: string | null
          id?: string
          impact?: string | null
          is_active?: boolean | null
          lat: number
          lng: number
          name: string
          severity: string
          target_data?: string | null
          updated_at?: string
          victim: string
        }
        Update: {
          attack_type?: string
          created_at?: string
          date?: string
          description?: string | null
          hacker_group?: string | null
          id?: string
          impact?: string | null
          is_active?: boolean | null
          lat?: number
          lng?: number
          name?: string
          severity?: string
          target_data?: string | null
          updated_at?: string
          victim?: string
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          attack_type: string
          created_at: string
          description: string
          id: string
          incident_date: string
          organisation: string
          reporter_email: string | null
          source_url: string | null
          status: string
        }
        Insert: {
          attack_type: string
          created_at?: string
          description: string
          id?: string
          incident_date: string
          organisation: string
          reporter_email?: string | null
          source_url?: string | null
          status?: string
        }
        Update: {
          attack_type?: string
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          organisation?: string
          reporter_email?: string | null
          source_url?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

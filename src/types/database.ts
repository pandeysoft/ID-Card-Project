/**
 * Temporary hand-maintained Supabase Database type.
 *
 * This is a foundation for stricter service typing until generated Supabase
 * types are added. Later, replace this file with official generated types:
 *
 *   npx supabase gen types typescript --project-id <project-id> --schema public > src/types/database.ts
 */
export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          onboarding_completed: boolean;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          onboarding_completed?: boolean;
          onboarding_completed_at?: string | null;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          type: 'personal' | 'professional' | 'acquaintance' | 'business';
          public_slug: string;
          name: string;
          headline: string | null;
          company: string | null;
          bio: string | null;
          email: string | null;
          phone: string | null;
          location: string | null;
          avatar_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          type: 'personal' | 'professional' | 'acquaintance' | 'business';
          public_slug: string;
          name: string;
          headline?: string | null;
          company?: string | null;
          bio?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          is_public?: boolean;
        };
        Update: {
          type?: 'personal' | 'professional' | 'acquaintance' | 'business';
          public_slug?: string;
          name?: string;
          headline?: string | null;
          company?: string | null;
          bio?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          is_public?: boolean;
        };
      };
      profile_links: {
        Row: {
          id: string;
          profile_id: string;
          label: string;
          url: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          label: string;
          url: string;
          display_order?: number;
        };
        Update: {
          label?: string;
          url?: string;
          display_order?: number;
        };
      };
      public_profiles: {
        Row: {
          id: string;
          profile_id: string;
          user_id: string;
          public_slug: string;
          name: string;
          headline: string | null;
          bio: string | null;
          avatar_url: string | null;
          published_data: unknown;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          user_id: string;
          public_slug: string;
          name: string;
          headline?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          published_data?: unknown;
          is_public?: boolean;
        };
        Update: {
          id?: string;
          profile_id?: string;
          user_id?: string;
          public_slug?: string;
          name?: string;
          headline?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          published_data?: unknown;
          is_public?: boolean;
        };
      };
    };
  };
};

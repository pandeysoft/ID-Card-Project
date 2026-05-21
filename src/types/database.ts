import type { BusinessProfile, ProfileLink, ProfileType, ProfileVisibility } from './cardiq';

export type PublicProfilePublishedData = {
  type?: ProfileType;
  links?: readonly ProfileLink[];
  business?: BusinessProfile;
};

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
      account_settings: {
        Row: {
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          updated_at?: string;
        };
      };
      privacy_settings: {
        Row: {
          user_id: string;
          profile_visibility: ProfileVisibility;
          searchable_by_email: boolean;
          searchable_by_phone: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          profile_visibility?: ProfileVisibility;
          searchable_by_email?: boolean;
          searchable_by_phone?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_visibility?: ProfileVisibility;
          searchable_by_email?: boolean;
          searchable_by_phone?: boolean;
          updated_at?: string;
        };
      };
      sharing_settings: {
        Row: {
          user_id: string;
          contact_sync_enabled: boolean;
          lead_sharing_requires_consent: boolean;
          allow_vcard_export: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          contact_sync_enabled?: boolean;
          lead_sharing_requires_consent?: boolean;
          allow_vcard_export?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_sync_enabled?: boolean;
          lead_sharing_requires_consent?: boolean;
          allow_vcard_export?: boolean;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          source_profile_id: string | null;
          name: string;
          headline: string | null;
          bio: string | null;
          email: string | null;
          phone: string | null;
          location: string | null;
          notes: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          source_profile_id?: string | null;
          name: string;
          headline?: string | null;
          bio?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          notes?: string | null;
          tags?: readonly string[];
        };
        Update: {
          source_profile_id?: string | null;
          name?: string;
          headline?: string | null;
          bio?: string | null;
          email?: string | null;
          phone?: string | null;
          location?: string | null;
          notes?: string | null;
          tags?: readonly string[];
        };
      };
      contact_links: {
        Row: {
          id: string;
          contact_id: string;
          label: string;
          url: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          contact_id: string;
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
      leads: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string | null;
          profile_id: string | null;
          lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          source: string | null;
          notes: string | null;
          next_follow_up_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          contact_id?: string | null;
          profile_id?: string | null;
          lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          source?: string | null;
          notes?: string | null;
          next_follow_up_at?: string | null;
        };
        Update: {
          contact_id?: string | null;
          profile_id?: string | null;
          lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          source?: string | null;
          notes?: string | null;
          next_follow_up_at?: string | null;
        };
      };
      networking_sessions: {
        Row: {
          id: string;
          host_user_id: string;
          status: 'active' | 'ended';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_user_id: string;
          status?: 'active' | 'ended';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'active' | 'ended';
          updated_at?: string;
        };
      };
      session_participants: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          left_at?: string | null;
        };
      };
      nearby_users: {
        Row: {
          id: string;
          display_name: string;
          headline: string | null;
          distance_label: string | null;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          headline?: string | null;
          distance_label?: string | null;
          last_seen_at?: string;
        };
        Update: {
          display_name?: string;
          headline?: string | null;
          distance_label?: string | null;
          last_seen_at?: string;
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
          published_data: PublicProfilePublishedData | null;
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
          published_data?: PublicProfilePublishedData | null;
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
          published_data?: PublicProfilePublishedData | null;
          is_public?: boolean;
        };
      };
    };
  };
};

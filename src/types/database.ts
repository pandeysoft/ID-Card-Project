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
      public_profiles: {
        Row: {
          id: string;
        };
        Insert: {
          id?: string;
        };
        Update: {
          id?: string;
        };
      };
    };
  };
};

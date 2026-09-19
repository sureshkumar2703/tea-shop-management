import { createClient } from "@supabase/supabase-js";

// Read from import.meta.env
const rawUrl = import.meta.env.VITE_SUPABASE_URL || "https://gvpqxpgtpzznzpumsccq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_EBQBG4P9epU4IkFqdM5Ing_ujjQEDGc";

// Normalize URL: Strip trailing /rest/v1 or slashes to ensure Auth and Storage endpoints work properly
export const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

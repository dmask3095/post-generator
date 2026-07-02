import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Reads the caller's session from request cookies, so API routes see who's logged in.
// Service role key (if set) bypasses RLS for privileged writes but still needs the
// cookie-backed client for auth.getUser() to resolve the current user.
export async function getSupabaseServerClient() {
  const cookieStore = cookies();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return createServerClient<Database>(supabaseUrl, serviceRoleKey || supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a context that can't set cookies (e.g. Server Component render) — safe to ignore.
        }
      },
    },
  });
}

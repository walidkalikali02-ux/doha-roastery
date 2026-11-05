import { createClient } from '@supabase/supabase-js'

// Server-side catalog reads must not share the browser auth client or a build
// snapshot. Every request reads the same live table that admin edits update.
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  },
)

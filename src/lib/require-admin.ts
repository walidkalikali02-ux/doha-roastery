import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function requireAdmin(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) return Response.json({ error: 'Please sign in again' }, { status: 401 })
  const supabase = getSupabaseAdmin()
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return Response.json({ error: 'Please sign in again' }, { status: 401 })
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profileError) return Response.json({ error: 'Could not verify permissions' }, { status: 503 })
  if (!profile || !['ADMIN', 'MANAGER'].includes(profile.role)) {
    return Response.json({ error: 'Admin access required' }, { status: 403 })
  }
  return supabase
}

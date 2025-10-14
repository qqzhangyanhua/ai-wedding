import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import type { Profile } from '@/types/database';

/**
 * Verify admin role from Supabase auth
 * Returns user profile if admin, throws error otherwise
 */
export async function verifyAdmin(req: NextRequest): Promise<Profile> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    throw new Error('Missing authorization token');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // Fetch user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  // Check admin role
  if (profile.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }

  return profile as Profile;
}

/**
 * Middleware-style admin check for API routes
 * Returns standardized error response
 */
export async function requireAdmin(req: NextRequest): Promise<{ profile: Profile } | Response> {
  try {
    const profile = await verifyAdmin(req);
    return { profile };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';

    if (message.includes('Forbidden')) {
      return new Response(JSON.stringify({ error: message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

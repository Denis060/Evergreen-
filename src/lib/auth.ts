import { supabase } from './supabase';

export async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

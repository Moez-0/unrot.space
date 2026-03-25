import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export interface SupabaseTopic {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  image_url?: string;
  video_url?: string;
  related_ids: string[];
  created_at: string;
}

export interface SupabaseSession {
  id: string;
  user_id?: string;
  user_name: string;
  time_spent: number;
  depth: number;
  focus_score: number;
  chain: string[];
  created_at: string;
}

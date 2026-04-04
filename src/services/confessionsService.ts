import { supabase } from '../lib/supabase';

export interface Confession {
  id: string;
  confession_text: string;
  created_at: string;
}

const MAX_CONFESSION_LENGTH = 500;
const MIN_CONFESSION_LENGTH = 20;

export async function fetchConfessions(limit = 50): Promise<Confession[]> {
  const { data, error } = await supabase
    .from('confessions')
    .select('id, confession_text, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createConfession(rawText: string): Promise<void> {
  const confessionText = rawText.trim();

  if (confessionText.length < MIN_CONFESSION_LENGTH) {
    throw new Error(`Confession must be at least ${MIN_CONFESSION_LENGTH} characters.`);
  }

  if (confessionText.length > MAX_CONFESSION_LENGTH) {
    throw new Error(`Confession must be ${MAX_CONFESSION_LENGTH} characters or less.`);
  }

  const { error } = await supabase.from('confessions').insert({
    confession_text: confessionText,
    is_approved: false,
    is_flagged: false,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export const confessionLimits = {
  min: MIN_CONFESSION_LENGTH,
  max: MAX_CONFESSION_LENGTH,
};

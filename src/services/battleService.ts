import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type BattleTopic = {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: string;
  is_pro?: boolean;
};

export type BattleMatch = {
  id: string;
  invite_code: string;
  host_user_id: string;
  guest_user_id: string | null;
  topic_id: string;
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  max_rounds: number;
  current_round: number;
  host_hp: number;
  guest_hp: number;
  winner_user_id: string | null;
  round_started_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BattleMatchRound = {
  match_id: string;
  round_number: number;
  topic_id: string;
  passage: string;
  question: string;
  options: string[];
  correct_answer: string;
};

export type BattleRoundAnswer = {
  match_id: string;
  round_number: number;
  user_id: string;
  selected_answer: string | null;
  is_correct: boolean;
  response_ms: number;
  created_at: string;
};

export type BattleRoundResult = {
  match_id: string;
  round_number: number;
  host_score: number;
  guest_score: number;
  host_damage: number;
  guest_damage: number;
  resolved_at: string;
};

const PASSAGE_MAX_LENGTH = 650;

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function cleanPassage(text: string) {
  const stripped = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\-]/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length <= PASSAGE_MAX_LENGTH) return stripped;
  return `${stripped.slice(0, PASSAGE_MAX_LENGTH).trim()}...`;
}

function buildQuestion(roundTopic: BattleTopic, allTopics: BattleTopic[], allCategories: string[]) {
  const useCategoryQuestion = Math.random() > 0.45;

  if (useCategoryQuestion) {
    const distractors = shuffle(allCategories.filter((cat) => cat !== roundTopic.category)).slice(0, 3);
    const options = shuffle(uniqueStrings([roundTopic.category, ...distractors])).slice(0, 4);

    return {
      question: 'Which category best matches this passage?',
      options,
      correctAnswer: roundTopic.category,
    };
  }

  const titlePool = uniqueStrings(allTopics.map((topic) => topic.title));
  const distractors = shuffle(titlePool.filter((title) => title !== roundTopic.title)).slice(0, 3);
  const options = shuffle(uniqueStrings([roundTopic.title, ...distractors])).slice(0, 4);

  return {
    question: 'Which topic title matches what you just read?',
    options,
    correctAnswer: roundTopic.title,
  };
}

export async function fetchBattleTopics(isPro: boolean) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, title, description, content, category, is_pro')
    .limit(400);

  if (error) throw error;

  return ((data || []) as BattleTopic[]).filter((topic) => !topic.is_pro || isPro);
}

export function generateRounds(input: { topics: BattleTopic[]; seedTopicId: string; rounds: number }) {
  const { topics, seedTopicId, rounds } = input;

  if (!topics.length) return [] as BattleMatchRound[];

  const seedTopic = topics.find((topic) => topic.id === seedTopicId) || topics[0];
  const categoryNeighbors = topics.filter((topic) => topic.category === seedTopic.category);
  const fallbackPool = topics;
  const pool = categoryNeighbors.length >= rounds ? categoryNeighbors : fallbackPool;

  const shuffledPool = shuffle(pool);
  const selected: BattleTopic[] = [seedTopic];

  for (const topic of shuffledPool) {
    if (selected.length >= rounds) break;
    if (selected.some((item) => item.id === topic.id)) continue;
    selected.push(topic);
  }

  while (selected.length < rounds) {
    selected.push(selected[selected.length % selected.length]);
  }

  const categories = uniqueStrings(topics.map((topic) => topic.category));

  return selected.map((topic, index) => {
    const passageSource = topic.content?.trim() || topic.description || topic.title;
    const quiz = buildQuestion(topic, topics, categories);

    return {
      match_id: '',
      round_number: index + 1,
      topic_id: topic.id,
      passage: cleanPassage(passageSource),
      question: quiz.question,
      options: quiz.options,
      correct_answer: quiz.correctAnswer,
    };
  });
}

export async function createBattleMatch(topicId: string, maxRounds: number) {
  const { data, error } = await supabase.rpc('create_battle_match', {
    p_topic_id: topicId,
    p_max_rounds: maxRounds,
  });

  if (error) throw error;
  return data as BattleMatch;
}

export async function joinBattleByCode(inviteCode: string) {
  const { data, error } = await supabase.rpc('join_battle_match', {
    p_invite_code: inviteCode,
  });

  if (error) throw error;
  return data as BattleMatch;
}

export async function startBattleMatch(matchId: string) {
  const { data, error } = await supabase.rpc('start_battle_match', {
    p_match_id: matchId,
  });

  if (error) throw error;
  return data as BattleMatch;
}

export async function submitBattleAnswer(input: {
  matchId: string;
  roundNumber: number;
  selectedAnswer: string;
  responseMs: number;
}) {
  const { data, error } = await supabase.rpc('submit_battle_answer', {
    p_match_id: input.matchId,
    p_round_number: input.roundNumber,
    p_selected_answer: input.selectedAnswer,
    p_response_ms: input.responseMs,
  });

  if (error) throw error;
  return data as BattleMatch;
}

export async function insertMatchRounds(matchId: string, rounds: BattleMatchRound[]) {
  if (!rounds.length) return;

  const payload = rounds.map((round) => ({
    ...round,
    match_id: matchId,
    options: round.options,
  }));

  const { error } = await supabase.from('battle_match_rounds').insert(payload);
  if (error) throw error;
}

export async function getBattleMatch(matchId: string) {
  const { data, error } = await supabase
    .from('battle_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) throw error;
  return data as BattleMatch;
}

export async function getBattleRounds(matchId: string) {
  const { data, error } = await supabase
    .from('battle_match_rounds')
    .select('*')
    .eq('match_id', matchId)
    .order('round_number', { ascending: true });

  if (error) throw error;

  return ((data || []) as any[]).map((item) => ({
    ...item,
    options: Array.isArray(item.options) ? item.options : [],
  })) as BattleMatchRound[];
}

export async function getRoundAnswers(matchId: string, roundNumber: number) {
  const { data, error } = await supabase
    .from('battle_round_answers')
    .select('*')
    .eq('match_id', matchId)
    .eq('round_number', roundNumber);

  if (error) throw error;
  return (data || []) as BattleRoundAnswer[];
}

export async function getRoundResults(matchId: string) {
  const { data, error } = await supabase
    .from('battle_round_results')
    .select('*')
    .eq('match_id', matchId)
    .order('round_number', { ascending: true });

  if (error) throw error;
  return (data || []) as BattleRoundResult[];
}

export function subscribeToBattle(matchId: string, handlers: {
  onMatchUpdate?: (match: BattleMatch) => void;
  onAnswer?: (answer: BattleRoundAnswer) => void;
  onRoundResult?: (result: BattleRoundResult) => void;
}) {
  const channel = supabase
    .channel(`battle-${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'battle_matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        handlers.onMatchUpdate?.(payload.new as BattleMatch);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'battle_round_answers',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        handlers.onAnswer?.(payload.new as BattleRoundAnswer);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'battle_round_results',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        handlers.onRoundResult?.(payload.new as BattleRoundResult);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeBattle(channel: RealtimeChannel | null) {
  if (!channel) return;
  supabase.removeChannel(channel);
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { cn } from '../lib/utils';
import { Loader2, Swords, Heart, Shield, Clock3, ChevronRight, RotateCcw, Trophy, Users, Link2 } from 'lucide-react';
import {
  BattleMatch,
  BattleMatchRound,
  BattleRoundAnswer,
  BattleRoundResult,
  BattleTopic,
  createBattleMatch,
  fetchBattleTopics,
  generateRounds,
  getBattleRounds,
  getRoundAnswers,
  getRoundResults,
  insertMatchRounds,
  joinBattleByCode,
  startBattleMatch,
  submitBattleAnswer,
  subscribeToBattle,
  unsubscribeBattle,
} from '../services/battleService';
import { RealtimeChannel } from '@supabase/supabase-js';

type ModeKey = 'blitz' | 'duel' | 'deep';

const ROUND_TIME_MS = 45000;

const GAME_MODES: Record<ModeKey, { name: string; rounds: number }> = {
  blitz: { name: 'Blitz Duel', rounds: 5 },
  duel: { name: 'Standard Duel', rounds: 7 },
  deep: { name: 'Deep Focus Duel', rounds: 9 },
};

export function BattleModePage() {
  const navigate = useNavigate();
  const { user, isPro, profile } = useSession();

  const [topics, setTopics] = useState<BattleTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<ModeKey>('duel');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [inviteInput, setInviteInput] = useState('');

  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [rounds, setRounds] = useState<BattleMatchRound[]>([]);
  const [roundAnswers, setRoundAnswers] = useState<BattleRoundAnswer[]>([]);
  const [roundResults, setRoundResults] = useState<BattleRoundResult[]>([]);

  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_TIME_MS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roundStartRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    async function fetchTopics() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBattleTopics(isPro);
        setTopics(data);
        if (data.length > 0) {
          setSelectedTopicId(data[0].id);
        }
      } catch (error) {
        console.error('Battle mode topic fetch failed:', error);
        setError('Could not load topics for battle mode.');
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [user, navigate, isPro]);

  const myUserId = user?.id || '';
  const isHost = !!match && match.host_user_id === myUserId;
  const hasGuest = !!match?.guest_user_id;
  const inMatch = !!match;
  const isActive = match?.status === 'active';
  const isFinished = match?.status === 'finished';

  const myHp = useMemo(() => {
    if (!match) return 100;
    return isHost ? match.host_hp : match.guest_hp;
  }, [match, isHost]);

  const enemyHp = useMemo(() => {
    if (!match) return 100;
    return isHost ? match.guest_hp : match.host_hp;
  }, [match, isHost]);

  const currentRound = useMemo(() => {
    if (!match) return null;
    return rounds.find((item) => item.round_number === match.current_round) || null;
  }, [rounds, match]);

  const hasAnsweredCurrentRound = useMemo(() => {
    if (!match) return false;
    return roundAnswers.some(
      (answer) =>
        answer.round_number === match.current_round &&
        answer.user_id === myUserId
    );
  }, [roundAnswers, match, myUserId]);

  const myLatestRoundResult = useMemo(() => {
    if (!match || !roundResults.length) return null;
    const targetRound = Math.max(1, match.current_round - 1);
    const result = roundResults.find((item) => item.round_number === targetRound);
    if (!result) return null;

    return isHost
      ? {
          dealt: result.guest_damage,
          taken: result.host_damage,
          myScore: result.host_score,
          enemyScore: result.guest_score,
        }
      : {
          dealt: result.host_damage,
          taken: result.guest_damage,
          myScore: result.guest_score,
          enemyScore: result.host_score,
        };
  }, [match, roundResults, isHost]);

  useEffect(() => {
    if (!match?.id) return;

    let cancelled = false;

    async function loadMatchData() {
      try {
        const [loadedRounds, loadedResults, loadedAnswers] = await Promise.all([
          getBattleRounds(match.id),
          getRoundResults(match.id),
          getRoundAnswers(match.id, match.current_round),
        ]);

        if (cancelled) return;
        setRounds(loadedRounds);
        setRoundResults(loadedResults);
        setRoundAnswers(loadedAnswers);
      } catch (err) {
        console.error('Failed loading match data:', err);
      }
    }

    loadMatchData();

    return () => {
      cancelled = true;
    };
  }, [match?.id]);

  useEffect(() => {
    if (!match?.id) return;

    unsubscribeBattle(channelRef.current);
    channelRef.current = subscribeToBattle(match.id, {
      onMatchUpdate: (nextMatch) => {
        setMatch(nextMatch);
      },
      onAnswer: (answer) => {
        setRoundAnswers((prev) => {
          const exists = prev.some(
            (item) => item.match_id === answer.match_id && item.round_number === answer.round_number && item.user_id === answer.user_id
          );
          if (exists) return prev;
          return [...prev, answer];
        });
      },
      onRoundResult: (result) => {
        setRoundResults((prev) => {
          const exists = prev.some(
            (item) => item.match_id === result.match_id && item.round_number === result.round_number
          );
          if (exists) return prev;
          return [...prev, result];
        });
      },
    });

    return () => {
      unsubscribeBattle(channelRef.current);
      channelRef.current = null;
    };
  }, [match?.id]);

  useEffect(() => {
    if (!match?.id || !isActive) return;

    getRoundAnswers(match.id, match.current_round)
      .then((answers) => setRoundAnswers((prev) => {
        const copy = [...prev];
        for (const answer of answers) {
          const exists = copy.some(
            (item) => item.match_id === answer.match_id && item.round_number === answer.round_number && item.user_id === answer.user_id
          );
          if (!exists) copy.push(answer);
        }
        return copy;
      }))
      .catch((err) => console.error('Failed to load round answers:', err));
  }, [match?.id, match?.current_round, isActive]);

  useEffect(() => {
    if (!isActive || !match?.round_started_at) {
      setTimeLeftMs(ROUND_TIME_MS);
      return;
    }

    const startedAt = new Date(match.round_started_at).getTime();
    roundStartRef.current = startedAt;

    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, ROUND_TIME_MS - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0 && !hasAnsweredCurrentRound && !isSubmitting) {
        handleSubmitAnswer('');
      }
    }, 200);

    return () => clearInterval(timer);
  }, [isActive, match?.round_started_at, hasAnsweredCurrentRound, isSubmitting]);

  useEffect(() => {
    if (!isActive) {
      setSelectedAnswer('');
      return;
    }
    setSelectedAnswer('');
  }, [match?.current_round, isActive]);

  const handleCreateMatch = async () => {
    if (!selectedTopicId) return;

    setError(null);
    try {
      const createdMatch = await createBattleMatch(selectedTopicId, GAME_MODES[mode].rounds);
      const generatedRounds = generateRounds({ topics, seedTopicId: selectedTopicId, rounds: GAME_MODES[mode].rounds });
      await insertMatchRounds(createdMatch.id, generatedRounds);

      setRounds(generatedRounds.map((item) => ({ ...item, match_id: createdMatch.id })));
      setRoundAnswers([]);
      setRoundResults([]);
      setMatch(createdMatch);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not create battle room.');
    }
  };

  const handleJoinMatch = async () => {
    if (!inviteInput.trim()) return;

    setError(null);
    try {
      const joined = await joinBattleByCode(inviteInput.trim().toUpperCase());
      const loadedRounds = await getBattleRounds(joined.id);
      const loadedResults = await getRoundResults(joined.id);

      setMatch(joined);
      setRounds(loadedRounds);
      setRoundResults(loadedResults);
      setRoundAnswers([]);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not join battle room.');
    }
  };

  const handleStartMatch = async () => {
    if (!match) return;

    setError(null);
    try {
      const started = await startBattleMatch(match.id);
      setMatch(started);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not start match.');
    }
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!match || !currentRound || hasAnsweredCurrentRound || isSubmitting) return;

    setSelectedAnswer(answer);
    setIsSubmitting(true);
    setError(null);
    try {
      const startedAt = roundStartRef.current || Date.now();
      const responseMs = Math.max(0, Date.now() - startedAt);

      const nextMatch = await submitBattleAnswer({
        matchId: match.id,
        roundNumber: currentRound.round_number,
        selectedAnswer: answer,
        responseMs,
      });

      setMatch(nextMatch);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not submit answer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveMatch = () => {
    unsubscribeBattle(channelRef.current);
    channelRef.current = null;
    setMatch(null);
    setRounds([]);
    setRoundAnswers([]);
    setRoundResults([]);
    setSelectedAnswer('');
    setInviteInput('');
    setTimeLeftMs(ROUND_TIME_MS);
  };

  const winnerText = useMemo(() => {
    if (!match || !isFinished) return '';
    if (!match.winner_user_id) return 'Draw';
    return match.winner_user_id === myUserId ? 'Victory' : 'Defeat';
  }, [match, isFinished, myUserId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink text-bg flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-bg pt-20 sm:pt-24">
      <Helmet>
        <title>Battle Mode | unrot</title>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10">
        {!inMatch ? (
          <div className="space-y-8 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-9rem)] flex flex-col justify-center">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-accent text-bg px-4 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
                <Swords size={14} />
                Friend PvP Mode
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-display uppercase leading-[0.85] mb-4">Read. Answer. Fight Live.</h1>
              <p className="text-sm sm:text-lg font-bold opacity-70 max-w-2xl mx-auto">
                No bots. No AI. You and a friend read the same passage and race to answer correctly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(GAME_MODES) as ModeKey[]).map((modeKey) => {
                const item = GAME_MODES[modeKey];
                const active = mode === modeKey;
                return (
                  <button
                    key={modeKey}
                    onClick={() => setMode(modeKey)}
                    className={cn(
                      'neo-card text-left p-5 transition-all',
                      active ? 'bg-primary text-ink' : 'bg-white text-ink hover:bg-secondary/20'
                    )}
                  >
                    <div className="text-[10px] uppercase tracking-widest font-black opacity-50 mb-2">{modeKey}</div>
                    <h3 className="font-display text-2xl uppercase mb-3">{item.name}</h3>
                    <div className="text-xs font-bold uppercase opacity-70">Rounds: {item.rounds}</div>
                    <div className="text-xs font-bold uppercase opacity-70">Read + answer timer: 45s</div>
                  </button>
                );
              })}
            </div>

            <div className="neo-card bg-white text-ink p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-widest font-black opacity-50">Topic to read</div>
              <select
                value={selectedTopicId}
                onChange={(event) => setSelectedTopicId(event.target.value)}
                className="w-full neo-border-sm px-3 py-3 font-bold"
              >
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title} · {topic.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="neo-card bg-white text-ink p-5 space-y-4">
                <div className="text-[10px] uppercase tracking-widest font-black opacity-50">Host a room</div>
                <button
                  onClick={handleCreateMatch}
                  disabled={!selectedTopicId}
                  className="neo-button bg-primary text-ink px-6 py-3 text-sm uppercase font-black flex items-center gap-2"
                >
                  <Users size={16} />
                  Create battle room
                </button>
              </div>

              <div className="neo-card bg-white text-ink p-5 space-y-4">
                <div className="text-[10px] uppercase tracking-widest font-black opacity-50">Join friend</div>
                <div className="flex gap-2">
                  <input
                    value={inviteInput}
                    onChange={(event) => setInviteInput(event.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 neo-border-sm px-3 py-3 font-black uppercase tracking-widest"
                  />
                  <button
                    onClick={handleJoinMatch}
                    className="neo-button bg-secondary text-ink px-5 py-3 text-xs uppercase font-black"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-center text-xs font-black uppercase tracking-widest text-accent">{error}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="neo-card bg-white text-ink p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-40">You</span>
                  <Heart size={14} className="text-accent" />
                </div>
                <div className="h-3 bg-ink/10 neo-border-sm overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${myHp}%` }} />
                </div>
                <div className="mt-2 text-xs font-black uppercase">HP {myHp}</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] uppercase tracking-widest font-black opacity-60">
                  {match.status === 'waiting'
                    ? 'Waiting room'
                    : `Round ${Math.min(match.current_round, match.max_rounds)} / ${match.max_rounds}`}
                </div>
                <div className="text-3xl font-display uppercase mt-1">{GAME_MODES[mode].name}</div>
                <div className="text-[10px] uppercase tracking-widest font-black opacity-50 mt-2 inline-flex items-center gap-2">
                  <Link2 size={12} />
                  Code {match.invite_code}
                </div>
              </div>

              <div className="neo-card bg-white text-ink p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-40">Your friend</span>
                  <Shield size={14} className="text-secondary" />
                </div>
                <div className="h-3 bg-ink/10 neo-border-sm overflow-hidden">
                  <div className="h-full bg-secondary transition-all" style={{ width: `${enemyHp}%` }} />
                </div>
                <div className="mt-2 text-xs font-black uppercase">HP {enemyHp}</div>
              </div>
            </div>

            {match.status === 'waiting' && (
              <div className="neo-border-lg bg-white text-ink p-6 sm:p-7 text-center space-y-5">
                <div className="text-[10px] uppercase tracking-widest font-black opacity-50">Invite a friend to this room</div>
                <div className="text-4xl font-display uppercase">{match.invite_code}</div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                  {hasGuest ? 'Friend joined. Ready to start.' : 'Waiting for your friend to join...'}
                </p>

                {isHost ? (
                  <button
                    onClick={handleStartMatch}
                    disabled={!hasGuest}
                    className="neo-button bg-primary text-ink px-8 py-3 text-sm uppercase font-black disabled:opacity-50"
                  >
                    Start live battle
                  </button>
                ) : (
                  <p className="text-xs font-black uppercase tracking-widest">Host will start the match.</p>
                )}
              </div>
            )}

            {isActive && currentRound && (
              <div className="neo-border-lg bg-white text-ink p-5 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="text-[10px] uppercase tracking-widest font-black opacity-40">Read the passage then answer fast</div>
                  <div className="inline-flex items-center gap-2 bg-ink text-bg px-3 py-1 neo-border-sm text-xs font-black uppercase">
                    <Clock3 size={14} />
                    {Math.ceil(timeLeftMs / 1000)}s
                  </div>
                </div>

                <div className="bg-bg neo-border-sm p-4 mb-5">
                  <h2 className="text-xl sm:text-2xl font-display uppercase mb-3">Passage</h2>
                  <p className="text-sm sm:text-base font-bold opacity-85 leading-relaxed whitespace-pre-wrap">{currentRound.passage}</p>
                </div>

                <h3 className="text-lg sm:text-xl font-display uppercase mb-3">{currentRound.question}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentRound.options.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = hasAnsweredCurrentRound && option === currentRound.correct_answer;

                    return (
                      <button
                        key={option}
                        disabled={hasAnsweredCurrentRound || isSubmitting}
                        onClick={() => handleSubmitAnswer(option)}
                        className={cn(
                          'neo-border-sm px-4 py-3 text-left font-black uppercase text-xs tracking-widest transition-all',
                          hasAnsweredCurrentRound
                            ? isCorrect
                              ? 'bg-primary text-ink'
                              : isSelected
                                ? 'bg-accent text-bg'
                                : 'bg-white text-ink/40'
                            : 'bg-white hover:bg-secondary/20 text-ink'
                        )}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {hasAnsweredCurrentRound && (
                  <p className="mt-4 text-xs font-black uppercase tracking-widest opacity-70">Answer locked. Waiting for friend...</p>
                )}

                {myLatestRoundResult && (
                  <div className="mt-4 bg-bg neo-border-sm px-3 py-2 text-xs font-black uppercase tracking-widest">
                    Score {myLatestRoundResult.myScore} vs {myLatestRoundResult.enemyScore} · You dealt {myLatestRoundResult.dealt} · You took {myLatestRoundResult.taken}
                  </div>
                )}
              </div>
            )}

            {isFinished && (
              <div className="neo-border-lg bg-white text-ink p-6 sm:p-8 text-center">
                <div className="inline-flex items-center gap-2 bg-primary text-ink px-4 py-1 neo-border-sm text-[10px] uppercase font-black tracking-widest mb-5">
                  <Trophy size={14} />
                  Live Match Ended
                </div>
                <h3 className="text-4xl sm:text-5xl font-display uppercase mb-3">
                  {winnerText}
                </h3>
                <p className="text-sm font-bold uppercase opacity-60 tracking-widest mb-6">Final HP · You {myHp} — {enemyHp} Rival</p>

                <div className="max-w-xl mx-auto space-y-2 mb-7 text-left">
                  {roundResults.slice(-5).map((result) => {
                    const dealt = isHost ? result.guest_damage : result.host_damage;
                    const taken = isHost ? result.host_damage : result.guest_damage;
                    const myScoreText = isHost ? result.host_score : result.guest_score;
                    const enemyScoreText = isHost ? result.guest_score : result.host_score;

                    return (
                    <div key={result.round_number} className="flex items-center justify-between bg-bg px-3 py-2 neo-border-sm text-xs font-bold">
                      <span>Round {result.round_number}</span>
                      <span>
                        You {myScoreText} · Rival {enemyScoreText}
                        {dealt > 0 && ` · +${dealt} dmg`}
                        {taken > 0 && ` · -${taken} dmg`}
                      </span>
                    </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleLeaveMatch}
                    className="neo-button bg-primary text-ink px-8 py-3 text-sm uppercase font-black flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    New Match
                  </button>
                  <button
                    onClick={() => navigate('/explore')}
                    className="neo-button bg-white text-ink px-8 py-3 text-sm uppercase font-black flex items-center justify-center gap-2"
                  >
                    Back to Explore
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {!isFinished && (
              <div className="flex justify-center">
                <button
                  onClick={handleLeaveMatch}
                  className="neo-button bg-white text-ink px-8 py-3 text-sm uppercase font-black flex items-center justify-center gap-2"
                >
                  Leave Match
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {error && <p className="text-center text-xs font-black uppercase tracking-widest text-accent">{error}</p>}
            {!profile && <p className="text-center text-[10px] font-black uppercase tracking-widest opacity-50">Sign in profile is required for live battle mode.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

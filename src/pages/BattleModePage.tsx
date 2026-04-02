import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../context/SessionContext';
import { cn } from '../lib/utils';
import { Loader2, Swords, Heart, Shield, Clock3, ChevronRight, RotateCcw, Trophy } from 'lucide-react';

type ModeKey = 'blitz' | 'duel' | 'deep';

type BattleTopic = {
  id: string;
  title: string;
  description: string;
  category: string;
  is_pro?: boolean;
};

type RoundResult = {
  round: number;
  playerScore: number;
  botScore: number;
  playerDamage: number;
  botDamage: number;
  correct: boolean;
  answer: string;
  correctAnswer: string;
};

const GAME_MODES: Record<ModeKey, { name: string; rounds: number; roundSeconds: number; botAccuracy: number }> = {
  blitz: { name: 'Blitz Duel', rounds: 5, roundSeconds: 35, botAccuracy: 0.5 },
  duel: { name: 'Standard Duel', rounds: 7, roundSeconds: 50, botAccuracy: 0.62 },
  deep: { name: 'Deep Focus Duel', rounds: 9, roundSeconds: 65, botAccuracy: 0.7 },
};

export function BattleModePage() {
  const navigate = useNavigate();
  const { user, isPro } = useSession();

  const [topics, setTopics] = useState<BattleTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ModeKey>('duel');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [round, setRound] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [botHp, setBotHp] = useState(100);
  const [timeLeft, setTimeLeft] = useState(GAME_MODES.duel.roundSeconds);

  const [currentTopic, setCurrentTopic] = useState<BattleTopic | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [roundResolved, setRoundResolved] = useState(false);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [usedTopicIds, setUsedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    async function fetchTopics() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('id, title, description, category, is_pro')
          .limit(300);

        if (!error && data) {
          const filtered = (data as BattleTopic[]).filter((topic) => !topic.is_pro || isPro);
          setTopics(filtered);
        }
      } catch (error) {
        console.error('Battle mode topic fetch failed:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [user, navigate, isPro]);

  const categories = useMemo(() => {
    return Array.from(new Set(topics.map((topic) => topic.category))).filter(Boolean);
  }, [topics]);

  const remainingTopics = useMemo(() => {
    const used = new Set(usedTopicIds);
    const available = topics.filter((topic) => !used.has(topic.id));
    return available.length > 0 ? available : topics;
  }, [topics, usedTopicIds]);

  const initializeRound = () => {
    if (remainingTopics.length === 0) return;
    const randomTopic = remainingTopics[Math.floor(Math.random() * remainingTopics.length)];
    setCurrentTopic(randomTopic);

    const distractors = categories
      .filter((category) => category !== randomTopic.category)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const answerOptions = [randomTopic.category, ...distractors].sort(() => Math.random() - 0.5);

    setOptions(answerOptions);
    setSelectedAnswer(null);
    setRoundResolved(false);
    setTimeLeft(GAME_MODES[mode].roundSeconds);
    setUsedTopicIds((prev) => [...prev, randomTopic.id]);
  };

  useEffect(() => {
    if (!started || finished) return;
    initializeRound();
  }, [started, mode]);

  useEffect(() => {
    if (!started || finished || roundResolved) return;

    if (timeLeft <= 0) {
      resolveRound(null);
      return;
    }

    const timer = window.setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, started, finished, roundResolved]);

  const resolveRound = (answer: string | null) => {
    if (!currentTopic || roundResolved) return;

    const isCorrect = answer === currentTopic.category;
    const modeConfig = GAME_MODES[mode];

    const playerScore = isCorrect ? Math.max(8, 25 + timeLeft * 2) : Math.max(0, 4 + Math.floor(timeLeft / 5));

    const botCorrect = Math.random() < modeConfig.botAccuracy;
    const botTimeLeft = Math.floor(Math.random() * modeConfig.roundSeconds);
    const botScore = botCorrect ? Math.max(8, 20 + botTimeLeft * 2) : Math.max(0, 3 + Math.floor(botTimeLeft / 6));

    const botDamage = Math.max(0, playerScore - botScore);
    const playerDamage = Math.max(0, botScore - playerScore);

    const nextPlayerHp = Math.max(0, playerHp - playerDamage);
    const nextBotHp = Math.max(0, botHp - botDamage);

    setPlayerHp(nextPlayerHp);
    setBotHp(nextBotHp);

    setRoundResults((prev) => [
      ...prev,
      {
        round,
        playerScore,
        botScore,
        playerDamage,
        botDamage,
        correct: isCorrect,
        answer: answer || 'No answer',
        correctAnswer: currentTopic.category,
      },
    ]);

    setSelectedAnswer(answer);
    setRoundResolved(true);

    const shouldFinish = round >= modeConfig.rounds || nextPlayerHp <= 0 || nextBotHp <= 0;

    window.setTimeout(() => {
      if (shouldFinish) {
        setFinished(true);
        return;
      }

      setRound((prev) => prev + 1);
      initializeRound();
    }, 1700);
  };

  const startBattle = () => {
    setStarted(true);
    setFinished(false);
    setRound(1);
    setPlayerHp(100);
    setBotHp(100);
    setRoundResults([]);
    setUsedTopicIds([]);
    setCurrentTopic(null);
    setSelectedAnswer(null);
    setRoundResolved(false);
    setTimeLeft(GAME_MODES[mode].roundSeconds);
  };

  const winner = playerHp === botHp ? 'draw' : playerHp > botHp ? 'player' : 'bot';

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
        {!started ? (
          <div className="space-y-8 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-9rem)] flex flex-col justify-center">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-accent text-bg px-4 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
                <Swords size={14} />
                New Game Mode
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-display uppercase leading-[0.85] mb-4">Focus Battle Duels</h1>
              <p className="text-sm sm:text-lg font-bold opacity-70 max-w-2xl mx-auto">
                Geoguessr-style head-to-head rounds. Read fast, classify correctly, and destroy your rival HP bar.
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
                    <div className="text-xs font-bold uppercase opacity-70">Timer: {item.roundSeconds}s</div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                onClick={startBattle}
                className="neo-button bg-primary text-ink px-10 py-4 text-lg font-display uppercase flex items-center gap-3"
              >
                <Swords size={20} />
                Start Duel
              </button>
            </div>
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
                  <div className="h-full bg-accent transition-all" style={{ width: `${playerHp}%` }} />
                </div>
                <div className="mt-2 text-xs font-black uppercase">HP {playerHp}</div>
              </div>

              <div className="text-center">
                <div className="text-[10px] uppercase tracking-widest font-black opacity-60">Round {round} / {GAME_MODES[mode].rounds}</div>
                <div className="text-3xl font-display uppercase mt-1">{GAME_MODES[mode].name}</div>
              </div>

              <div className="neo-card bg-white text-ink p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-black opacity-40">Rival Bot</span>
                  <Shield size={14} className="text-secondary" />
                </div>
                <div className="h-3 bg-ink/10 neo-border-sm overflow-hidden">
                  <div className="h-full bg-secondary transition-all" style={{ width: `${botHp}%` }} />
                </div>
                <div className="mt-2 text-xs font-black uppercase">HP {botHp}</div>
              </div>
            </div>

            {!finished && currentTopic && (
              <div className="neo-border-lg bg-white text-ink p-5 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="text-[10px] uppercase tracking-widest font-black opacity-40">Classify this topic fast</div>
                  <div className="inline-flex items-center gap-2 bg-ink text-bg px-3 py-1 neo-border-sm text-xs font-black uppercase">
                    <Clock3 size={14} />
                    {timeLeft}s
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-display uppercase mb-3">{currentTopic.title}</h2>
                <p className="text-sm sm:text-base font-bold opacity-80 mb-6 leading-relaxed">{currentTopic.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((option) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = roundResolved && option === currentTopic.category;

                    return (
                      <button
                        key={option}
                        disabled={roundResolved}
                        onClick={() => resolveRound(option)}
                        className={cn(
                          'neo-border-sm px-4 py-3 text-left font-black uppercase text-xs tracking-widest transition-all',
                          roundResolved
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
              </div>
            )}

            {finished && (
              <div className="neo-border-lg bg-white text-ink p-6 sm:p-8 text-center">
                <div className="inline-flex items-center gap-2 bg-primary text-ink px-4 py-1 neo-border-sm text-[10px] uppercase font-black tracking-widest mb-5">
                  <Trophy size={14} />
                  Duel Ended
                </div>
                <h3 className="text-4xl sm:text-5xl font-display uppercase mb-3">
                  {winner === 'draw' ? 'Draw' : winner === 'player' ? 'Victory' : 'Defeat'}
                </h3>
                <p className="text-sm font-bold uppercase opacity-60 tracking-widest mb-6">Final HP · You {playerHp} — {botHp} Rival</p>

                <div className="max-w-xl mx-auto space-y-2 mb-7 text-left">
                  {roundResults.slice(-5).map((result) => (
                    <div key={result.round} className="flex items-center justify-between bg-bg px-3 py-2 neo-border-sm text-xs font-bold">
                      <span>Round {result.round}: {result.correct ? 'Correct' : 'Wrong'}</span>
                      <span>
                        You {result.playerScore} · Rival {result.botScore}
                        {result.botDamage > 0 && ` · +${result.botDamage} dmg`}
                        {result.playerDamage > 0 && ` · -${result.playerDamage} dmg`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={startBattle}
                    className="neo-button bg-primary text-ink px-8 py-3 text-sm uppercase font-black flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={16} />
                    Rematch
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
          </div>
        )}
      </div>
    </div>
  );
}

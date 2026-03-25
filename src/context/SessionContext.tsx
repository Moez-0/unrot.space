import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SessionStats {
  timeSpent: number;
  depth: number;
  focusScore: number;
  chain: string[];
}

interface SessionContextType {
  isActive: boolean;
  startTime: number | null;
  elapsedTime: number;
  chain: string[]; // Array of topic IDs
  depth: number;
  focusScore: number;
  totalScore: number;
  level: number;
  progressToNextLevel: number;
  userName: string;
  setUserName: (name: string) => void;
  lastSessionStats: SessionStats | null;
  startSession: (initialTopicId?: string) => Promise<void>;
  endSession: () => void;
  saveSession: (name?: string) => Promise<void>;
  addToChain: (topicId: string) => void;
  resetSession: () => void;
  isSaving: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [chain, setChain] = useState<string[]>([]);
  const [depth, setDepth] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSessionStats, setLastSessionStats] = useState<SessionStats | null>(() => {
    const saved = localStorage.getItem('unrot_last_session_stats');
    return saved ? JSON.parse(saved) : null;
  });
  const [userName, setUserNameState] = useState(() => {
    return localStorage.getItem('unrot_user_name') || '';
  });

  const [totalScore, setTotalScore] = useState(() => {
    const saved = localStorage.getItem('unrot_total_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const setUserName = (name: string) => {
    setUserNameState(name);
    localStorage.setItem('unrot_user_name', name);
  };

  useEffect(() => {
    localStorage.setItem('unrot_total_score', totalScore.toString());
  }, [totalScore]);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive) {
      interval = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const [isEnding, setIsEnding] = useState(false);

  const startSession = async (initialTopicId?: string) => {
    // If we were in ending state, reset it now to allow a new session
    if (isEnding) {
      setIsEnding(false);
    }
    
    let topicId = initialTopicId;
    
    if (!topicId) {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('id');
        
        if (data && data.length > 0 && !error) {
          topicId = data[Math.floor(Math.random() * data.length)].id;
        } else {
          topicId = 'philosophy-of-time';
        }
      } catch (err) {
        console.error('Failed to fetch random topic:', err);
        topicId = 'philosophy-of-time';
      }
    }
    
    setIsActive(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setChain([topicId]);
    setDepth(0);
    // Don't clear lastSessionStats here, keep it until we have a new one or it's explicitly reset
  };

  const endSession = () => {
    setIsEnding(true);
    // Capture final stats before stopping
    const finalElapsedTime = elapsedTime;
    const finalDepth = depth;
    const finalFocusScore = finalElapsedTime + (finalDepth * 5);

    const stats = {
      timeSpent: finalElapsedTime,
      depth: finalDepth,
      focusScore: finalFocusScore,
      chain: [...chain]
    };

    setLastSessionStats(stats);
    localStorage.setItem('unrot_last_session_stats', JSON.stringify(stats));

    setIsActive(false);
    
    // Update persistent total score
    setTotalScore(prev => prev + finalFocusScore);
  };

  const saveSession = async (name?: string) => {
    if (!lastSessionStats) return;
    
    const finalName = name || userName || `Thinker_${Math.floor(Math.random() * 9000) + 1000}`;
    if (name) setUserName(name);

    setIsSaving(true);
    try {
      // Save session to Supabase
      const { error } = await supabase
        .from('sessions')
        .insert([
          {
            user_name: finalName,
            time_spent: lastSessionStats.timeSpent,
            depth: lastSessionStats.depth,
            focus_score: lastSessionStats.focusScore,
            chain: lastSessionStats.chain,
          }
        ]);
        
      if (error) throw error;
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addToChain = (topicId: string) => {
    setChain((prev) => {
      if (prev[prev.length - 1] === topicId) return prev;
      setDepth((d) => d + 1);
      return [...prev, topicId];
    });
  };

  const resetSession = () => {
    setIsActive(false);
    setStartTime(null);
    setElapsedTime(0);
    setChain([]);
    setDepth(0);
    setIsEnding(false);
    setLastSessionStats(null);
    localStorage.removeItem('unrot_last_session_stats');
  };

  // focus_score = time_spent + (depth * 5)
  const focusScore = elapsedTime + (depth * 5);

  // Level calculation: Level 1 at 0, Level 2 at 500, Level 3 at 1500, etc.
  // Formula: Level = floor(sqrt(totalScore / 100)) + 1
  const level = Math.floor(Math.sqrt(totalScore / 100)) + 1;
  const nextLevelScore = Math.pow(level, 2) * 100;
  const currentLevelBaseScore = Math.pow(level - 1, 2) * 100;
  const progressToNextLevel = Math.min(100, Math.max(0, ((totalScore - currentLevelBaseScore) / (nextLevelScore - currentLevelBaseScore)) * 100));

  return (
    <SessionContext.Provider
      value={{
        isActive,
        startTime,
        elapsedTime,
        chain,
        depth,
        focusScore,
        totalScore,
        level,
        progressToNextLevel,
        userName,
        setUserName,
        lastSessionStats,
        startSession,
        endSession,
        saveSession,
        addToChain,
        resetSession,
        isSaving,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

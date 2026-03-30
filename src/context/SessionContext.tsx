import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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
  saveSession: () => Promise<string | null>;
  addToChain: (topicId: string) => void;
  resetSession: () => void;
  isSaving: boolean;
  user: User | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  isPro: boolean;
  sessionLimitReached: boolean;
  focusMode: 'default' | 'lofi' | 'nature' | 'deep-focus';
  setFocusMode: (mode: 'default' | 'lofi' | 'nature' | 'deep-focus') => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [chain, setChain] = useState<string[]>([]);
  const [depth, setDepth] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [focusMode, setFocusMode] = useState<'default' | 'lofi' | 'nature' | 'deep-focus'>('default');

  useEffect(() => {
    // Check session count for today
    const lastReset = localStorage.getItem('unrot_session_reset_date');
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      localStorage.setItem('unrot_session_reset_date', today);
      localStorage.setItem('unrot_session_count', '0');
      setSessionCount(0);
    } else {
      const savedCount = localStorage.getItem('unrot_session_count');
      setSessionCount(savedCount ? parseInt(savedCount, 10) : 0);
    }
  }, []);

  const isPro = profile?.subscription_tier === 'pro';
  const sessionLimitReached = !isPro && sessionCount >= 10;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();

      // Listen for real-time changes to the user's profile
      const channel = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Profile updated in real-time:', payload.new);
            setProfile(payload.new as Profile);
            setTotalScore(payload.new.total_score);
            setUserNameState(payload.new.user_name);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setProfile(null);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const name = user.user_metadata.user_name || user.email?.split('@')[0] || 'Thinker';
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              user_name: name,
              total_score: 0,
              subscription_tier: 'free'
            }
          ])
          .select()
          .single();

        if (!createError && newProfile) {
          setProfile(newProfile);
          setUserNameState(newProfile.user_name);
          localStorage.setItem('unrot_user_name', newProfile.user_name);
        }
      } else if (data) {
        setProfile(data);
        setTotalScore(data.total_score);
        setUserNameState(data.user_name);
        localStorage.setItem('unrot_user_name', data.user_name);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const [lastSessionStats, setLastSessionStats] = useState<SessionStats | null>(() => {
    const saved = localStorage.getItem('unrot_last_session_stats');
    return saved ? JSON.parse(saved) : null;
  });
  const [userName, setUserNameState] = useState(() => {
    return localStorage.getItem('unrot_user_name') || '';
  });

  useEffect(() => {
    if (user && !userName) {
      const name = user.user_metadata.user_name || user.email?.split('@')[0] || 'Thinker';
      setUserNameState(name);
      localStorage.setItem('unrot_user_name', name);
    }
  }, [user, userName]);

  const [totalScore, setTotalScore] = useState(() => {
    const saved = localStorage.getItem('unrot_total_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const setUserName = async (name: string) => {
    setUserNameState(name);
    localStorage.setItem('unrot_user_name', name);
    if (user) {
      await supabase.from('profiles').update({ user_name: name }).eq('id', user.id);
      fetchProfile();
    }
  };

  useEffect(() => {
    localStorage.setItem('unrot_total_score', totalScore.toString());
    if (user && profile && totalScore !== profile.total_score) {
      supabase.from('profiles').update({ total_score: totalScore }).eq('id', user.id).then(() => {
        // Optionally refresh profile
      });
    }
  }, [totalScore, user, profile]);

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
    if (!user) {
      throw new Error('Authentication required to start a session.');
    }

    if (sessionLimitReached) {
      throw new Error('Session limit reached. Upgrade to Pro for unlimited sessions.');
    }

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
    
    // Increment session count
    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    localStorage.setItem('unrot_session_count', newCount.toString());
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

  const saveSession = async (): Promise<string | null> => {
    if (!lastSessionStats || !user) return null;
    
    const finalName = profile?.user_name || userName || user.email?.split('@')[0] || 'Thinker';

    setIsSaving(true);
    try {
      // Save session to Supabase
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: user.id,
            user_name: finalName,
            time_spent: lastSessionStats.timeSpent,
            depth: lastSessionStats.depth,
            focus_score: lastSessionStats.focusScore,
            chain: lastSessionStats.chain,
          }
        ])
        .select('id')
        .single();
        
      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Failed to save session:', err);
      return null;
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
        user,
        profile,
        signOut,
        fetchProfile,
        isPro,
        sessionLimitReached,
        focusMode,
        setFocusMode,
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

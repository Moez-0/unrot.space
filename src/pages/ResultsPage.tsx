import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, SupabaseSession } from '../lib/supabase';
import { formatTime, cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Trophy, Award, Zap, ArrowRight, Home, Play } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .single();

        if (data && !error) {
          setSession(data);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin text-accent">
          <Zap size={48} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-bg pt-32 px-6 text-center">
        <div className="neo-card bg-white p-12 inline-block max-w-md">
          <h1 className="text-4xl font-display mb-6 uppercase">Session not found.</h1>
          <p className="font-bold opacity-60 mb-8 uppercase text-xs tracking-widest">This rabbit hole has collapsed or never existed.</p>
          <Link to="/" className="neo-button bg-primary px-8 py-3 inline-block font-display uppercase">Go Home</Link>
        </div>
      </div>
    );
  }

  const achievements = [
    { title: "Focus Warrior", earned: session.time_spent >= 600, icon: <Zap size={16} /> },
    { title: "Deep Thinker", earned: session.time_spent >= 1800, icon: <Trophy size={16} /> },
    { title: "Rabbit Hole Master", earned: session.depth >= 5, icon: <Award size={16} /> },
    { title: "Elite Mind", earned: session.focus_score >= 500, icon: <Zap size={16} /> },
  ].filter(a => a.earned);

  return (
    <div className="min-h-screen bg-bg pt-32 pb-20 px-6">
      <Helmet>
        <title>{session.user_name}'s Focus Session | unrot</title>
        <meta name="description" content={`Check out ${session.user_name}'s focus session on unrot. They reached depth ${session.depth} and earned a score of ${session.focus_score}!`} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Badge / Hero */}
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block bg-ink text-bg px-6 py-2 neo-border-sm text-sm uppercase font-black mb-8 rotate-1"
            >
              Verified Focus Session
            </motion.div>
            
            <div className="relative inline-block mb-12">
              <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative neo-card bg-white p-12 md:p-16 flex flex-col items-center gap-6">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.5 }}
                  animate={{ rotate: 3, scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="w-24 h-24 bg-accent text-bg flex items-center justify-center neo-border-lg"
                >
                  <Trophy size={48} />
                </motion.div>
                <div>
                  <h1 className="text-5xl md:text-7xl font-display uppercase leading-none mb-2">
                    {session.user_name}
                  </h1>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-accent">Master Thinker</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {achievements.map((ach, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 bg-ink text-bg px-3 py-1 neo-border-sm text-[10px] font-black uppercase"
                    >
                      {ach.icon}
                      {ach.title}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="neo-card bg-white p-8 text-center">
              <div className="text-[10px] uppercase font-black opacity-50 mb-2">Time Focused</div>
              <div className="text-3xl font-display uppercase">{formatTime(session.time_spent)}</div>
            </div>
            <div className="neo-card bg-white p-8 text-center">
              <div className="text-[10px] uppercase font-black opacity-50 mb-2">Depth Reached</div>
              <div className="text-3xl font-display uppercase">{session.depth} Levels</div>
            </div>
            <div className="neo-card bg-primary p-8 text-center">
              <div className="text-[10px] uppercase font-black opacity-50 mb-2">Focus Score</div>
              <div className="text-3xl font-display uppercase">{session.focus_score}</div>
            </div>
          </div>

          {/* The Path */}
          <div className="neo-card bg-ink text-bg p-8">
            <h2 className="text-xl font-display uppercase mb-8 flex items-center gap-3">
              <ArrowRight className="text-primary" />
              The Knowledge Path
            </h2>
            <div className="flex flex-wrap gap-3">
              {session.chain.map((topicId, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-white/10 neo-border-sm px-4 py-2 text-xs font-bold uppercase tracking-tight">
                    {topicId.replace(/-/g, ' ')}
                  </div>
                  {i < session.chain.length - 1 && (
                    <span className="text-primary font-black">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-secondary p-12 text-center neo-border-lg">
            <h2 className="text-3xl font-display uppercase mb-6">Want to unrot your brain?</h2>
            <p className="font-bold mb-8 opacity-80">Join {session.user_name} and thousands of others reclaiming their focus.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/" className="neo-button bg-ink text-bg px-8 py-4 flex items-center justify-center gap-3 font-display uppercase text-xl">
                <Play size={24} className="fill-primary text-primary" />
                Start Session
              </Link>
              <Link to="/explore" className="neo-button bg-white text-ink px-8 py-4 flex items-center justify-center gap-3 font-display uppercase text-xl">
                Explore Topics
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

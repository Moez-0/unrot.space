import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, User, Loader2 } from 'lucide-react';
import { supabase, SupabaseSession } from '../lib/supabase';
import { formatTime } from '../lib/utils';

export function LeaderboardPage() {
  const [leaders, setLeaders] = useState<SupabaseSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('focus_score', { ascending: false })
          .limit(100); // Fetch more to filter unique users in memory

        if (data) {
          const uniqueLeaders: SupabaseSession[] = [];
          const seenUsers = new Set();
          
          for (const session of data) {
            if (!seenUsers.has(session.user_name)) {
              uniqueLeaders.push(session);
              seenUsers.add(session.user_name);
            }
            if (uniqueLeaders.length >= 10) break;
          }
          
          setLeaders(uniqueLeaders);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaders();
  }, []);

  return (
    <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center">
          <div className="inline-block bg-primary text-ink px-4 py-1 neo-border-sm text-xs uppercase font-black mb-6">
            Global Ranking
          </div>
          <h1 className="text-6xl md:text-8xl font-display uppercase leading-[0.8] mb-8">
            TOP <span className="text-accent">THINKERS.</span>
          </h1>
          <p className="text-xl font-bold opacity-60 uppercase tracking-widest">
            The quiet elite of the 21st century.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="animate-spin text-accent" size={48} />
          </div>
        ) : (
          <div className="neo-card bg-white overflow-hidden">
            <div className="grid grid-cols-5 bg-ink text-bg p-4 text-[10px] uppercase tracking-widest font-black">
              <div className="col-span-2">Thinker</div>
              <div className="text-center">Depth</div>
              <div className="text-center">Level</div>
              <div className="text-right">Score</div>
            </div>
            <div className="divide-y-4 divide-ink">
              {leaders.length > 0 ? (
                leaders.map((leader, i) => (
                  <div key={leader.id} className="grid grid-cols-5 p-6 items-center hover:bg-primary/5 transition-colors">
                    <div className="col-span-2 flex items-center gap-4">
                      <div className={`w-10 h-10 neo-border-sm flex items-center justify-center font-black ${i < 3 ? 'bg-accent text-bg' : 'bg-white text-ink'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-display uppercase text-xl">{leader.user_name}</div>
                        <div className="text-[10px] font-black opacity-40 uppercase tracking-widest">{formatTime(leader.time_spent)}</div>
                      </div>
                    </div>
                    <div className="text-center font-display text-2xl">{leader.depth}</div>
                    <div className="text-center font-display text-2xl text-primary">{leader.depth + 1}</div>
                    <div className="text-right font-display text-2xl text-accent">{leader.focus_score}</div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center font-bold opacity-40 uppercase">No sessions recorded yet.</div>
              )}
            </div>
          </div>
        )}

        <div className="neo-card bg-secondary/10 p-8 text-center">
          <p className="text-sm font-bold opacity-60 uppercase tracking-widest leading-relaxed">
            No social feeds. No vanity metrics. Just depth. <br />
            Your score is a reflection of your ability to resist the noise.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

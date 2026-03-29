import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { formatTime } from '../lib/utils';
import { motion } from 'motion/react';
import { Share2, Trophy, Home, Award, Zap } from 'lucide-react';

export function SummaryPage() {
  const { lastSessionStats, resetSession, level, progressToNextLevel, totalScore, userName, saveSession, isSaving } = useSession();
  const navigate = useNavigate();
  const [hasSaved, setHasSaved] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Automatically save session to leaderboard if name is set
    if (lastSessionStats && userName && !hasSaved && !isSaving) {
      saveSession(userName).then((id) => {
        setHasSaved(true);
        if (id) setSessionId(id);
      });
    }
  }, [lastSessionStats, userName, hasSaved, isSaving, saveSession]);

  if (!lastSessionStats) {
    return (
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-6 text-center">
        <div className="neo-card bg-white p-12 inline-block">
          <h1 className="text-4xl font-display mb-6 uppercase">No session data.</h1>
          <Link to="/" className="neo-button bg-primary px-8 py-3 inline-block">Go Home</Link>
        </div>
      </div>
    );
  }

  const { timeSpent, depth, focusScore } = lastSessionStats;

  const generateAchievements = () => {
    const allAchievements = [
      { id: 'first-dive', title: "First Dive", desc: "Initiated a focus session", icon: <Award size={20} />, condition: () => true },
      { id: 'focus-warrior', title: "Focus Warrior", desc: "Resisted distraction for 10+ minutes", icon: <Zap size={20} />, condition: () => timeSpent >= 600 },
      { id: 'deep-thinker', title: "Deep Thinker", desc: "Stayed focused for 30+ minutes", icon: <Trophy size={20} />, condition: () => timeSpent >= 1800 },
      { id: 'rabbit-hole', title: "Rabbit Hole Master", desc: "Went 5+ levels deep", icon: <Award size={20} />, condition: () => depth >= 5 },
      { id: 'elite-mind', title: "Elite Mind", desc: "Achieved a focus score over 500", icon: <Zap size={20} />, condition: () => focusScore >= 500 },
      { id: 'speed-demon', title: "Speed Reader", desc: "Reached depth 3 in under 5 minutes", icon: <Trophy size={20} />, condition: () => depth >= 3 && timeSpent < 300 },
    ];

    return allAchievements.map(ach => ({
      ...ach,
      earned: ach.condition()
    }));
  };

  const achievements = generateAchievements();
  const earnedCount = achievements.filter(a => a.earned).length;
  const comparisonPercent = Math.min(99, Math.floor(focusScore / 10) + 50);

  const handleShare = () => {
    const domain = 'https://unrot.space';
    const shareUrl = sessionId 
      ? `${domain}/results/${sessionId}`
      : domain;
      
    const text = `I escaped brain rot for ${Math.floor(timeSpent / 60)} minutes and earned ${earnedCount} achievements on Unrot! #unrot #focus`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Unrot Session Summary',
        text: text,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(`${text}\n\nCheck my results: ${shareUrl}`);
      alert("Copied to clipboard: " + text + "\nLink: " + shareUrl);
    }
  };

  return (
    <div className="pt-32 pb-20 max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        <div className="text-center">
          <div className="inline-block bg-accent text-bg px-4 py-1 neo-border-sm text-xs uppercase font-black mb-6">
            Session Complete
          </div>
          <h1 className="text-6xl md:text-8xl font-display uppercase leading-[0.8] mb-8">
            YOU WENT <span className="text-primary">DEEPER.</span>
          </h1>
          <p className="text-xl font-bold opacity-60 uppercase tracking-widest">
            You went deeper than {comparisonPercent}% of users today.
          </p>
        </div>

        {/* Level Progress */}
        <div className="neo-card bg-ink text-bg p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary text-ink flex items-center justify-center neo-border font-display text-4xl">
                {level}
              </div>
              <div>
                <div className="text-[10px] uppercase font-black tracking-widest opacity-60 mb-1">Current Level</div>
                <h2 className="text-3xl font-display uppercase">Thinker Rank</h2>
              </div>
            </div>
            <div className="flex-grow w-full max-w-md">
              <div className="flex justify-between text-[10px] uppercase font-black mb-2">
                <span>Progress to Level {level + 1}</span>
                <span>{Math.floor(progressToNextLevel)}%</span>
              </div>
              <div className="h-4 bg-white/20 neo-border-sm overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNextLevel}%` }}
                  className="h-full bg-primary"
                />
              </div>
              <div className="text-[10px] uppercase font-black mt-2 opacity-40 text-right">
                Total Focus: {totalScore}
              </div>
            </div>
          </div>
        </div>

        {/* Session Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="neo-card bg-white p-8 text-center">
            <div className="text-[10px] uppercase font-black opacity-50 mb-2">Time Spent</div>
            <div className="text-4xl font-display uppercase">{formatTime(timeSpent)}</div>
          </div>
          <div className="neo-card bg-white p-8 text-center">
            <div className="text-[10px] uppercase font-black opacity-50 mb-2">Depth Reached</div>
            <div className="text-4xl font-display uppercase">{depth} Levels</div>
          </div>
          <div className="neo-card bg-primary p-8 text-center">
            <div className="text-[10px] uppercase font-black opacity-50 mb-2">Focus Score</div>
            <div className="text-4xl font-display uppercase">{focusScore}</div>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-display uppercase flex items-center gap-3">
              <Award className="text-accent" />
              Achievements
            </h2>
            <span className="text-[10px] font-black uppercase opacity-40">{earnedCount} / {achievements.length} Unlocked</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`neo-card p-6 flex items-start gap-4 transition-all duration-500 ${ach.earned ? 'bg-white' : 'bg-ink/5 opacity-40 grayscale'}`}
              >
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 neo-border-sm ${ach.earned ? 'bg-accent text-bg' : 'bg-ink/10 text-ink/20'}`}>
                  {ach.icon}
                </div>
                <div>
                  <h3 className={`font-display uppercase text-lg ${ach.earned ? 'text-ink' : 'text-ink/40'}`}>{ach.title}</h3>
                  <p className="text-[10px] font-bold leading-tight uppercase tracking-tight">{ach.desc}</p>
                  {!ach.earned && <div className="mt-2 text-[8px] font-black uppercase text-accent">Locked</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t-4 border-ink">
          <button 
            onClick={handleShare}
            className="neo-button bg-accent text-bg px-8 py-4 flex items-center justify-center gap-3 font-display uppercase text-xl"
          >
            <Share2 size={24} />
            Share Result
          </button>
          {sessionId && (
            <button 
              onClick={() => {
                const url = `https://unrot.space/results/${sessionId}`;
                navigator.clipboard.writeText(url);
                alert("Link copied: " + url);
              }}
              className="neo-button bg-ink text-bg px-8 py-4 flex items-center justify-center gap-3 font-display uppercase text-xl"
            >
              <Zap size={24} className="text-primary" />
              Copy Badge Link
            </button>
          )}
          <button 
            onClick={() => {
              resetSession();
              navigate('/');
            }}
            className="neo-button bg-white text-ink px-8 py-4 flex items-center justify-center gap-3 font-display uppercase text-xl"
          >
            <Home size={24} />
            Back Home
          </button>
          <Link 
            to="/leaderboard"
            className="neo-button bg-secondary text-ink px-8 py-4 flex items-center justify-center gap-3 font-display uppercase text-xl"
          >
            <Trophy size={24} />
            Leaderboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Zap, CheckCircle, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSession } from '../context/SessionContext';

export function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, fetchProfile } = useSession();

  useEffect(() => {
    const token = searchParams.get('customer_session_token');
    if (token && user) {
      fetch('/api/verify-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_session_token: token, user_id: user.id })
      }).finally(() => {
        searchParams.delete('customer_session_token');
        setSearchParams(searchParams, { replace: true });
        fetchProfile();
      });
    }
  }, [searchParams, user, setSearchParams, fetchProfile]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 pt-32 pb-20">
      <Helmet>
        <title>Welcome to Pro | unrot</title>
      </Helmet>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-2xl w-full neo-card bg-white p-12 text-center relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="w-24 h-24 bg-ink text-bg neo-border mx-auto mb-8 flex items-center justify-center">
            <Zap size={48} className="text-accent fill-accent animate-pulse" />
          </div>

          <div className="inline-block bg-primary text-ink px-4 py-1 neo-border-sm text-xs uppercase font-black mb-6">
            Payment Successful
          </div>

          <h1 className="text-5xl md:text-7xl font-display uppercase leading-[0.8] mb-8">
            WELCOME TO <span className="text-accent">PRO.</span>
          </h1>

          <p className="text-xl font-bold opacity-60 uppercase tracking-widest mb-12 leading-relaxed">
            Your elite thinker status is now active. <br />
            The noise has been silenced. The depth is yours.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-bg neo-border-sm">
              <Trophy size={24} className="mx-auto mb-3 text-accent" />
              <div className="text-[10px] font-black uppercase tracking-widest">Unlimited Sessions</div>
            </div>
            <div className="p-6 bg-bg neo-border-sm">
              <Sparkles size={24} className="mx-auto mb-3 text-primary" />
              <div className="text-[10px] font-black uppercase tracking-widest">Exclusive Topics</div>
            </div>
            <div className="p-6 bg-bg neo-border-sm">
              <CheckCircle size={24} className="mx-auto mb-3 text-green-500" />
              <div className="text-[10px] font-black uppercase tracking-widest">Focus Ambience</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/explore" 
              className="neo-button bg-accent text-bg px-10 py-4 font-display uppercase text-xl flex items-center justify-center gap-3 group"
            >
              Start Exploring
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link 
              to="/profile" 
              className="neo-button bg-bg text-ink px-10 py-4 font-display uppercase text-xl"
            >
              View Profile
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

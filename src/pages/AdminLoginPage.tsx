import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, ArrowRight, Loader2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Optional: Check if the user is the designated admin
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (adminEmail && data.user?.email !== adminEmail) {
        await supabase.auth.signOut();
        throw new Error('Unauthorized access. Admin privileges required.');
      }

      localStorage.setItem('admin_session', 'true');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <div className="inline-block bg-accent text-bg p-4 neo-border mb-6">
            <Lock size={32} />
          </div>
          <h1 className="text-4xl font-display uppercase tracking-tight">Admin Access</h1>
          <p className="font-bold opacity-60 uppercase text-xs tracking-widest mt-2">Restricted Area</p>
        </div>

        <form onSubmit={handleLogin} className="neo-card bg-white p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@unrot.space"
                  className="w-full bg-bg neo-border pl-12 pr-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg neo-border pl-12 pr-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-accent text-xs font-black uppercase tracking-tight">{error}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full neo-button bg-primary text-ink py-4 flex items-center justify-center gap-3 font-display uppercase text-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : (
              <>
                Enter Dashboard
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-[10px] font-black uppercase opacity-40">
          Unauthorized access is strictly prohibited.
        </p>
      </motion.div>
    </div>
  );
}

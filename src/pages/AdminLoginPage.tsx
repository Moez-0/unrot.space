import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In a real app, this would be a server-side call
      // For now, we'll use a simple check or a Supabase call if the table exists
      // The user will need to set the ADMIN_PASSWORD in their environment
      const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      
      if (password === adminPass) {
        localStorage.setItem('admin_session', 'true');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid password. Access denied.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-bg neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
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

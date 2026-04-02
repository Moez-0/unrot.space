import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { User, Mail, Lock, Loader2, ArrowRight, Chrome } from 'lucide-react';
import { useSession } from '../context/SessionContext';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthLoading } = useSession();
  const searchParams = new URLSearchParams(location.search);
  const redirectPath = searchParams.get('redirect') || '/';
  const authMode = searchParams.get('mode');

  useEffect(() => {
    if (authMode === 'reset' || authMode === 'recovery') {
      setIsResetMode(true);
      setIsLogin(false);
    }
  }, [authMode]);

  useEffect(() => {
    if (!isAuthLoading && user && !isResetMode) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, isAuthLoading, isResetMode, navigate, redirectPath]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_name: userName,
            },
          },
        });
        if (authError) throw authError;
        alert('Check your email for the confirmation link!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirectPath)}`,
        },
      });

      if (authError) throw authError;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (resetError) throw resetError;

      setSuccess('Password reset email sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Could not send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Password updated successfully. You can sign in now.');
      setIsResetMode(false);
      setIsLogin(true);
      setPassword('');
      setNewPassword('');
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg pt-32 pb-20 px-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="neo-card bg-white p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-display uppercase mb-2">
              {isResetMode ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Join the Elite'}
            </h1>
            <p className="text-xs font-black uppercase tracking-widest opacity-40">
              {isResetMode ? 'Choose a new password to restore access.' : isLogin ? 'Your focus awaits.' : 'Start your journey to depth.'}
            </p>
          </div>

          {!isResetMode && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading || googleLoading}
                className="w-full neo-button bg-white text-ink py-4 font-display uppercase text-lg flex items-center justify-center gap-3 mb-6"
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <>
                    <Chrome size={20} />
                    Continue with Google
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">or use email</span>
                <div className="h-px flex-1 bg-ink/10" />
              </div>
            </>
          )}

          <form onSubmit={isResetMode ? handleUpdatePassword : handleAuth} className="space-y-6">
            {isResetMode ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-bg neo-border-sm py-4 pl-12 pr-4 font-bold focus:outline-none focus:bg-white transition-colors"
                      placeholder="Enter a new password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Confirm Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg neo-border-sm py-4 pl-12 pr-4 font-bold focus:outline-none focus:bg-white transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </>
            ) : !isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Thinker Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-bg neo-border-sm py-4 pl-12 pr-4 font-bold focus:outline-none focus:bg-white transition-colors"
                    placeholder="e.g. Socrates"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg neo-border-sm py-4 pl-12 pr-4 font-bold focus:outline-none focus:bg-white transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input
                  type="password"
                  disabled={isResetMode}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg neo-border-sm py-4 pl-12 pr-4 font-bold focus:outline-none focus:bg-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isLogin && !isResetMode && (
              <div className="flex justify-end -mt-2">
                <button
                  type="button"
                  onClick={handlePasswordResetRequest}
                  disabled={loading || googleLoading || !email}
                  className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-xs font-bold uppercase neo-border-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-primary/10 text-ink text-xs font-bold uppercase neo-border-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full neo-button bg-accent text-bg py-4 font-display uppercase text-xl flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  {isResetMode ? 'Update Password' : isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {!isResetMode ? (
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
              >
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsResetMode(false);
                  setIsLogin(true);
                }}
                className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

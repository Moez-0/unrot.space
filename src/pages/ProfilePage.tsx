import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSession } from '../context/SessionContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, Zap, CreditCard, LogOut, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export function ProfilePage() {
  const { user, profile, signOut, isPro, fetchProfile } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setUserName(profile.user_name);
    }
  }, [profile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
    setMessage({ type: 'success', text: 'Profile status refreshed.' });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_name: userName })
        .eq('id', user.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      // The SessionContext will pick up the change via its own listeners or we could trigger a refresh
      window.location.reload(); // Simple way to refresh context for now
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="neo-card p-12 text-center max-w-md">
          <AlertCircle className="mx-auto mb-6 text-accent" size={48} />
          <h2 className="text-3xl font-display uppercase mb-4">Access Denied</h2>
          <p className="font-bold opacity-60 uppercase tracking-widest mb-8">Please sign in to view your profile.</p>
          <a href="/auth" className="neo-button bg-primary px-8 py-3 font-display uppercase text-lg inline-block">Sign In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-32 pb-20 px-6">
      <Helmet>
        <title>Profile | unrot</title>
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Column: Avatar & Basic Info */}
          <div className="w-full md:w-1/3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="neo-card p-8 text-center bg-white"
            >
              <div className="w-32 h-32 bg-secondary/20 neo-border mx-auto mb-6 flex items-center justify-center relative">
                <User size={64} className="text-ink/20" />
                {isPro && (
                  <div className="absolute -top-2 -right-2 bg-accent text-bg p-2 neo-border-sm">
                    <Zap size={16} />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-display uppercase mb-1">{profile?.user_name || 'Thinker'}</h2>
              <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-6">{user.email}</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="neo-button bg-bg py-2 text-sm font-display uppercase"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button 
                  onClick={signOut}
                  className="neo-button bg-ink text-bg py-2 text-sm font-display uppercase flex items-center justify-center gap-2"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </motion.div>

            {/* Subscription Status Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`neo-card p-8 mt-8 ${isPro ? 'bg-ink text-bg' : 'bg-primary/10'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display uppercase text-lg">Subscription</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`p-2 neo-border-sm transition-colors ${isPro ? 'bg-bg/10 hover:bg-bg/20 text-bg' : 'bg-bg hover:bg-primary/20 text-ink'}`}
                    title="Refresh Status"
                  >
                    <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={14} />
                  </button>
                  {isPro ? <Zap size={20} className="text-accent" /> : <Shield size={20} className="text-ink/40" />}
                </div>
              </div>
              <div className="mb-6">
                <span className={`inline-block px-3 py-1 neo-border-sm text-[10px] uppercase font-black ${isPro ? 'bg-accent text-bg' : 'bg-bg text-ink'}`}>
                  {isPro ? 'Pro Member' : 'Free Tier'}
                </span>
              </div>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest leading-relaxed mb-6">
                {isPro 
                  ? 'You have full access to all elite rabbit holes and features.' 
                  : 'Upgrade to Pro to unlock exclusive deep-dive topics and custom focus ambience.'}
              </p>
              
              {isPro ? (
                <a 
                  href="https://buy.polar.sh/customer-portal" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="neo-button bg-bg text-ink py-2 text-xs font-display uppercase w-full flex items-center justify-center gap-2"
                >
                  <CreditCard size={14} />
                  Manage Billing
                </a>
              ) : (
                <a 
                  href="/pricing" 
                  className="neo-button bg-accent text-bg py-2 text-xs font-display uppercase w-full flex items-center justify-center gap-2"
                >
                  <Zap size={14} />
                  Upgrade Now
                </a>
              )}
            </motion.div>
          </div>

          {/* Right Column: Settings & Stats */}
          <div className="w-full md:w-2/3 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="neo-card p-10 bg-white"
            >
              <h3 className="text-3xl font-display uppercase mb-8 border-b-2 border-ink/10 pb-4">Account Settings</h3>
              
              {message && (
                <div className={`mb-8 p-4 neo-border-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-primary/20 text-ink' : 'bg-accent/20 text-ink'}`}>
                  {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                  <span className="text-xs font-bold uppercase tracking-widest">{message.text}</span>
                </div>
              )}

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] uppercase font-black mb-2 opacity-40">Display Name</label>
                  {isEditing ? (
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="flex-grow bg-bg neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Your thinker name"
                      />
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="neo-button bg-accent text-bg px-6 py-3 font-display uppercase flex items-center gap-2"
                      >
                        {isSaving ? <Loader2 size={20} className="animate-spin" /> : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-xl font-bold uppercase">{profile?.user_name || 'Thinker'}</div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black mb-2 opacity-40">Email Address</label>
                  <div className="flex items-center gap-3 text-lg font-bold opacity-60">
                    <Mail size={18} />
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-black mb-2 opacity-40">Account ID</label>
                  <code className="text-[10px] bg-bg px-2 py-1 neo-border-sm opacity-40">{user.id}</code>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="neo-card p-10 bg-white"
            >
              <h3 className="text-3xl font-display uppercase mb-8 border-b-2 border-ink/10 pb-4">Your Progress</h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-bg neo-border-sm text-center">
                  <div className="text-4xl font-display mb-1">{profile?.total_score || 0}</div>
                  <div className="text-[10px] uppercase font-black opacity-40">Total Focus Score</div>
                </div>
                <div className="p-6 bg-bg neo-border-sm text-center">
                  <div className="text-4xl font-display mb-1">
                    {Math.floor(Math.sqrt((profile?.total_score || 0) / 100)) + 1}
                  </div>
                  <div className="text-[10px] uppercase font-black opacity-40">Thinker Level</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

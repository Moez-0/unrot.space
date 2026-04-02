import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, SupabaseTopic, SupabaseSession, Profile } from '../lib/supabase';
import { generateMagicTopic } from '../services/aiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, BookOpen, Users, TrendingUp, Plus, Edit2, Trash2, 
  X, Save, Loader2, LogOut, Search,
  Image as ImageIcon, Crown, Menu, Clock, Target
} from 'lucide-react';
import { cn, formatTime } from '../lib/utils';

type AdminTab = 'overview' | 'topics' | 'sessions' | 'users';

type AdminUser = Profile;

export function AdminDashboardPage() {
  const [topics, setTopics] = useState<SupabaseTopic[]>([]);
  const [sessions, setSessions] = useState<SupabaseSession[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [editingTopic, setEditingTopic] = useState<Partial<SupabaseTopic> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isFetchingWiki, setIsFetchingWiki] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [topicsPage, setTopicsPage] = useState(1);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        localStorage.removeItem('admin_session');
        navigate('/admin/login');
        return;
      }

      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (!adminEmail || session.user.email !== adminEmail) {
        await supabase.auth.signOut();
        localStorage.removeItem('admin_session');
        navigate('/admin/login');
        return;
      }

      localStorage.setItem('admin_session', 'true');
      fetchData();
    };

    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicsRes, sessionsRes, usersRes] = await Promise.all([
        supabase.from('topics').select('*').order('created_at', { ascending: false }),
        supabase.from('sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('total_score', { ascending: false })
      ]);

      if (topicsRes.data) setTopics(topicsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (usersRes.data) setUsers(usersRes.data as AdminUser[]);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_session');
    navigate('/admin/login');
  };

  const handleDeleteTopic = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this topic? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase.from('topics').delete().eq('id', id);
      if (error) throw error;
      setTopics(topics.filter(t => t.id !== id));
    } catch (err) {
      alert('Error deleting topic. Please try again.');
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Delete this session record?')) return;

    try {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Error deleting session. Please try again.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user profile? This can affect user data visibility.')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Error deleting user profile. Please try again.');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser?.id || !editingUser.user_name) return;

    setIsSavingUser(true);
    try {
      const payload = {
        id: editingUser.id,
        user_name: editingUser.user_name,
        total_score: editingUser.total_score ?? 0,
        subscription_tier: editingUser.subscription_tier === 'pro' ? 'pro' : 'free'
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      await fetchData();
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      alert('Error saving user profile. Please try again.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic?.id || !editingTopic.title) return;
    
    setIsSaving(true);
    try {
      const topicData = {
        ...editingTopic,
        related_ids: Array.isArray(editingTopic.related_ids) ? editingTopic.related_ids : []
      };

      const { error } = await supabase
        .from('topics')
        .upsert(topicData);

      if (error) throw error;
      
      await fetchData();
      setIsModalOpen(false);
      setEditingTopic(null);
    } catch (err) {
      alert('Error saving topic. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWikipediaAutofill = async () => {
    if (!editingTopic?.title) return;
    setIsFetchingWiki(true);
    try {
      // 1. Fetch from Wikipedia for reliable imagery and baseline facts
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(editingTopic.title)}`);
      let wikiSummary = '';
      let imageUrl = editingTopic.image_url || '';
      
      if (res.ok) {
        const data = await res.json();
        wikiSummary = data.extract || '';
        imageUrl = data.originalimage?.source || data.thumbnail?.source || imageUrl;
      }

      // 2. Ask AI to perform Magic Generation
      const simpleTopicsStore = topics.map(t => ({ id: t.id, title: t.title }));
      const aiData = await generateMagicTopic(editingTopic.title, wikiSummary, simpleTopicsStore);
      
      if (aiData && aiData.content) {
        setEditingTopic(prev => ({
          ...prev!,
          id: aiData.id || prev?.id || '',
          description: aiData.description || prev?.description || '',
          content: aiData.content || prev?.content || '',
          category: aiData.category || prev?.category || 'Science',
          related_ids: aiData.related_ids || prev?.related_ids || [],
          video_url: aiData.video_url || prev?.video_url || '',
          image_url: imageUrl
        }));
      } else {
        throw new Error("AI failed to generate.");
      }
      
    } catch (err) {
      alert('Failed to generate magic topic. Please verify the API key and try again.');
    } finally {
      setIsFetchingWiki(false);
    }
  };

  const stats = useMemo(() => {
    const totalTopics = topics.length;
    const totalSessions = sessions.length;
    const totalUsers = users.length;
    const proUsers = users.filter(u => u.subscription_tier === 'pro').length;
    const proTopics = topics.filter(t => t.is_pro).length;
    const avgDepth = totalSessions > 0
      ? Number((sessions.reduce((acc, s) => acc + s.depth, 0) / totalSessions).toFixed(1))
      : 0;
    const avgFocusScore = totalSessions > 0 
      ? Math.round(sessions.reduce((acc, s) => acc + s.focus_score, 0) / totalSessions) 
      : 0;
    const totalTime = sessions.reduce((acc, s) => acc + s.time_spent, 0);
    const estimatedMrr = Number((proUsers * 2.99).toFixed(2));
    const estimatedArr = Number((estimatedMrr * 12).toFixed(2));
    
    // Group sessions by day for chart
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const chartData = last7Days.map(date => ({
      date: date.split('-').slice(1).join('/'),
      sessions: sessions.filter(s => s.created_at.startsWith(date)).length,
      score: Math.round(sessions.filter(s => s.created_at.startsWith(date)).reduce((acc, s) => acc + s.focus_score, 0) / 10)
    }));

    const categoryData = Object.entries(
      topics.reduce<Record<string, number>>((acc, topic) => {
        acc[topic.category] = (acc[topic.category] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    const topUsers = [...users]
      .sort((a, b) => (b.total_score || 0) - (a.total_score || 0))
      .slice(0, 5);

    const recentSessions = sessions.slice(0, 6);

    return {
      totalTopics,
      totalSessions,
      totalUsers,
      proUsers,
      proTopics,
      avgDepth,
      avgFocusScore,
      totalTime,
      estimatedMrr,
      estimatedArr,
      chartData,
      categoryData,
      topUsers,
      recentSessions
    };
  }, [topics, sessions, users]);

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSessions = sessions.filter(s =>
    (s.user_name || '').toLowerCase().includes(sessionSearch.toLowerCase()) ||
    (s.id || '').toLowerCase().includes(sessionSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    (u.user_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.id || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.subscription_tier || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const navItems: { key: AdminTab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'topics', label: 'Topics', icon: BookOpen },
    { key: 'sessions', label: 'Sessions', icon: Clock },
    { key: 'users', label: 'Users', icon: Users },
  ];

  const pieColors = ['#FFD600', '#00E0FF', '#FF4D00', '#1A1A1A', '#9CA3AF', '#84CC16'];

  const topicsPageSize = 10;
  const sessionsPageSize = 10;
  const usersPageSize = 10;

  const totalTopicsPages = Math.max(1, Math.ceil(filteredTopics.length / topicsPageSize));
  const totalSessionsPages = Math.max(1, Math.ceil(filteredSessions.length / sessionsPageSize));
  const totalUsersPages = Math.max(1, Math.ceil(filteredUsers.length / usersPageSize));

  const paginatedTopics = filteredTopics.slice((topicsPage - 1) * topicsPageSize, topicsPage * topicsPageSize);
  const paginatedSessions = filteredSessions.slice((sessionsPage - 1) * sessionsPageSize, sessionsPage * sessionsPageSize);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize);

  useEffect(() => {
    setTopicsPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setSessionsPage(1);
  }, [sessionSearch]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearch]);

  useEffect(() => {
    if (topicsPage > totalTopicsPages) setTopicsPage(totalTopicsPages);
  }, [topicsPage, totalTopicsPages]);

  useEffect(() => {
    if (sessionsPage > totalSessionsPages) setSessionsPage(totalSessionsPages);
  }, [sessionsPage, totalSessionsPages]);

  useEffect(() => {
    if (usersPage > totalUsersPages) setUsersPage(totalUsersPages);
  }, [usersPage, totalUsersPages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-ink/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "w-72 bg-ink text-bg flex flex-col fixed inset-y-0 left-0 h-[100dvh] z-50 transition-transform duration-200",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-ink font-black">U</div>
              <h1 className="text-xl font-display uppercase tracking-tight">Unrot Admin</h1>
            </div>
            <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Control Center</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-bg/70 hover:text-bg">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all",
                  activeTab === item.key ? "bg-primary text-ink neo-border-sm" : "hover:bg-white/5 opacity-60 hover:opacity-100"
                )}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 font-bold text-xs uppercase tracking-widest hover:bg-accent hover:text-bg transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-grow w-full overflow-y-auto lg:ml-72">
        <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-ink/10 lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="neo-border-sm bg-white w-9 h-9 flex items-center justify-center"
            >
              <Menu size={16} />
            </button>
            <h2 className="text-sm font-display uppercase">Admin Panel</h2>
            <button
              onClick={handleLogout}
              className="neo-border-sm bg-accent text-bg px-3 py-1 text-[10px] uppercase font-black"
            >
              Logout
            </button>
          </div>
          <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest neo-border-sm",
                    activeTab === item.key ? "bg-primary text-ink" : "bg-white text-ink"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display uppercase tracking-tight mb-2">Dashboard <span className="text-accent">Overview.</span></h2>
                  <p className="font-bold opacity-60 uppercase text-xs tracking-widest">Real-time platform performance</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Last Updated</p>
                  <p className="font-mono font-bold">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center neo-border-sm">
                      <BookOpen size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Topics</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase">{stats.totalTopics}</p>
                </div>
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-secondary/10 text-secondary flex items-center justify-center neo-border-sm">
                      <Users size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Sessions</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase">{stats.totalSessions}</p>
                </div>
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-accent/10 text-accent flex items-center justify-center neo-border-sm">
                      <TrendingUp size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Avg Focus Score</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase">{stats.avgFocusScore}</p>
                </div>
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-ink/5 text-ink flex items-center justify-center neo-border-sm">
                      <TrendingUp size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Focus Time</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase">{Math.floor(stats.totalTime / 60)}m</p>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-6 gap-4 sm:gap-6">
                <div className="neo-card bg-white p-6">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Users</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase">{stats.totalUsers}</p>
                </div>
                <div className="neo-card bg-white p-6">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Pro Users</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase text-accent">{stats.proUsers}</p>
                </div>
                <div className="neo-card bg-white p-6">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Pro Topics</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase text-secondary">{stats.proTopics}</p>
                </div>
                <div className="neo-card bg-white p-6">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Avg Depth</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase">{stats.avgDepth}</p>
                </div>
                <div className="neo-card bg-white p-6">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Est. Revenue MRR</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase text-primary">${stats.estimatedMrr}</p>
                </div>
                <div className="neo-card bg-white p-6">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Est. Revenue ARR</p>
                  <p className="text-2xl sm:text-4xl font-display uppercase text-secondary">${stats.estimatedArr}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="neo-card bg-white p-8">
                  <h3 className="text-xl font-display uppercase mb-8 flex items-center gap-3">
                    <TrendingUp size={20} className="text-accent" />
                    Session Activity (7 Days)
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={stats.chartData}>
                        <defs>
                          <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FFD600" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#FFD600" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '0', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#FFD600' }}
                        />
                        <Area type="monotone" dataKey="sessions" stroke="#FFD600" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="neo-card bg-white p-8">
                  <h3 className="text-xl font-display uppercase mb-8 flex items-center gap-3">
                    <TrendingUp size={20} className="text-secondary" />
                    Focus Score Trends
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={stats.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', border: 'none', borderRadius: '0', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#00E0FF' }}
                        />
                        <Bar dataKey="score" fill="#00E0FF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="neo-card bg-white p-6 xl:col-span-1">
                  <h3 className="text-xl font-display uppercase mb-6 flex items-center gap-3">
                    <BookOpen size={18} className="text-accent" />
                    Topic Mix
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.categoryData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={45}>
                          {stats.categoryData.map((entry, index) => (
                            <Cell key={`cell-${entry.name}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="neo-card bg-white p-6 xl:col-span-2">
                  <h3 className="text-xl font-display uppercase mb-6 flex items-center gap-3">
                    <Crown size={18} className="text-primary" />
                    Top Users (Score)
                  </h3>
                  <div className="space-y-3">
                    {stats.topUsers.map((user, index) => (
                      <div key={user.id} className="flex items-center justify-between bg-ink/5 px-4 py-3 neo-border-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-ink text-bg flex items-center justify-center text-[10px] font-black neo-border-sm">#{index + 1}</div>
                          <div>
                            <p className="font-bold text-sm">{user.user_name}</p>
                            <p className="text-[10px] opacity-50 font-mono">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl">{user.total_score}</p>
                          <p className="text-[10px] uppercase font-black opacity-50">{user.subscription_tier}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="neo-card bg-white p-6">
                <h3 className="text-xl font-display uppercase mb-6 flex items-center gap-3">
                  <Target size={18} className="text-secondary" />
                  Recent Sessions
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="bg-ink text-bg">
                      <tr>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-black">User</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-black">Duration</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-black">Depth</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-black">Score</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-black">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {stats.recentSessions.map((session) => (
                        <tr key={session.id}>
                          <td className="px-4 py-3 text-sm font-bold">{session.user_name || 'Anonymous'}</td>
                          <td className="px-4 py-3 text-xs font-mono">{formatTime(session.time_spent)}</td>
                          <td className="px-4 py-3 text-xs font-bold">{session.depth}</td>
                          <td className="px-4 py-3 text-xs font-bold text-accent">{session.focus_score}</td>
                          <td className="px-4 py-3 text-xs opacity-60">{new Date(session.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'topics' && (
            <motion.div 
              key="topics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display uppercase tracking-tight mb-2">Manage <span className="text-primary">Topics.</span></h2>
                  <p className="font-bold opacity-60 uppercase text-xs tracking-widest">Add, edit, or remove knowledge rabbit holes</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingTopic({
                      id: '',
                      title: '',
                      description: '',
                      content: '',
                      category: 'Science',
                      related_ids: []
                    });
                    setIsModalOpen(true);
                  }}
                  className="neo-button bg-accent text-bg px-6 py-3 flex items-center gap-2"
                >
                  <Plus size={20} />
                  New Topic
                </button>
              </div>

              <div className="flex gap-4 mb-8">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
                  <input 
                    type="text"
                    placeholder="Search topics by title or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white neo-border px-12 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div className="neo-card bg-white p-0 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-ink text-bg">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Topic</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Category</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Tier</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Created</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {paginatedTopics.map((topic) => (
                      <tr key={topic.id} className="hover:bg-ink/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-ink/5 neo-border-sm overflow-hidden shrink-0">
                              {topic.image_url ? (
                                <img src={topic.image_url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink/20">
                                  <ImageIcon size={20} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{topic.title}</p>
                              <p className="text-[10px] opacity-40 font-mono">{topic.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-secondary/10 text-secondary text-[10px] font-black uppercase px-2 py-1 neo-border-sm">
                            {topic.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {topic.is_pro ? (
                            <span className="bg-accent text-bg text-[10px] font-black uppercase px-2 py-1 neo-border-sm">
                              Pro
                            </span>
                          ) : (
                            <span className="bg-ink/5 text-ink/40 text-[10px] font-black uppercase px-2 py-1 neo-border-sm">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold opacity-60">
                          {new Date(topic.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingTopic(topic);
                                setIsModalOpen(true);
                              }}
                              className="w-8 h-8 flex items-center justify-center neo-border-sm bg-primary text-ink hover:bg-ink hover:text-bg transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="w-8 h-8 flex items-center justify-center neo-border-sm bg-accent text-bg hover:bg-ink transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className="px-4 sm:px-6 py-4 border-t border-ink/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">
                    Page {topicsPage} / {totalTopicsPages} · {filteredTopics.length} total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTopicsPage((p) => Math.max(1, p - 1))}
                      disabled={topicsPage === 1}
                      className="neo-border-sm bg-white px-3 py-1.5 text-[10px] font-black uppercase disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setTopicsPage((p) => Math.min(totalTopicsPages, p + 1))}
                      disabled={topicsPage === totalTopicsPages}
                      className="neo-border-sm bg-white px-3 py-1.5 text-[10px] font-black uppercase disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div 
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display uppercase tracking-tight mb-2">User <span className="text-secondary">Sessions.</span></h2>
                  <p className="font-bold opacity-60 uppercase text-xs tracking-widest">Monitor user engagement and focus metrics</p>
                </div>
              </div>

              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
                <input
                  type="text"
                  placeholder="Search sessions by user or id..."
                  value={sessionSearch}
                  onChange={(e) => setSessionSearch(e.target.value)}
                  className="w-full bg-white neo-border px-12 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="neo-card bg-white p-0 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-ink text-bg">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">User</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Duration</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Depth</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Score</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Date</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {paginatedSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-ink/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-ink text-bg flex items-center justify-center neo-border-sm font-black text-xs">
                              {session.user_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <p className="font-bold text-sm">{session.user_name || 'Anonymous'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold">
                          {formatTime(session.time_spent)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-2 py-1 neo-border-sm">
                            {session.depth} Levels
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-accent">
                          {session.focus_score}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold opacity-60">
                          {new Date(session.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="w-8 h-8 inline-flex items-center justify-center neo-border-sm bg-accent text-bg hover:bg-ink transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className="px-4 sm:px-6 py-4 border-t border-ink/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">
                    Page {sessionsPage} / {totalSessionsPages} · {filteredSessions.length} total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                      disabled={sessionsPage === 1}
                      className="neo-border-sm bg-white px-3 py-1.5 text-[10px] font-black uppercase disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setSessionsPage((p) => Math.min(totalSessionsPages, p + 1))}
                      disabled={sessionsPage === totalSessionsPages}
                      className="neo-border-sm bg-white px-3 py-1.5 text-[10px] font-black uppercase disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display uppercase tracking-tight mb-2">Manage <span className="text-accent">Users.</span></h2>
                  <p className="font-bold opacity-60 uppercase text-xs tracking-widest">Edit profile, score, and subscription tier</p>
                </div>
                <button
                  onClick={() => {
                    setEditingUser({ id: '', user_name: '', total_score: 0, subscription_tier: 'free' });
                    setIsUserModalOpen(true);
                  }}
                  className="neo-button bg-secondary text-ink px-6 py-3 flex items-center gap-2"
                >
                  <Plus size={18} />
                  New Profile
                </button>
              </div>

              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
                <input
                  type="text"
                  placeholder="Search users by name, id, tier..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-white neo-border px-12 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="neo-card bg-white p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-left">
                    <thead className="bg-ink text-bg">
                      <tr>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">User</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Tier</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Score</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Polar</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Created</th>
                        <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {paginatedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-ink/5 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-sm">{user.user_name}</p>
                              <p className="text-[10px] opacity-40 font-mono">{user.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-[10px] font-black uppercase px-2 py-1 neo-border-sm",
                              user.subscription_tier === 'pro' ? 'bg-accent text-bg' : 'bg-ink/5 text-ink/50'
                            )}>
                              {user.subscription_tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">{user.total_score}</td>
                          <td className="px-6 py-4 text-[10px] font-mono opacity-60">
                            {user.polar_subscription_id ? 'Connected' : '—'}
                          </td>
                          <td className="px-6 py-4 text-xs opacity-60">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsUserModalOpen(true);
                                }}
                                className="w-8 h-8 flex items-center justify-center neo-border-sm bg-primary text-ink hover:bg-ink hover:text-bg transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="w-8 h-8 flex items-center justify-center neo-border-sm bg-accent text-bg hover:bg-ink transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 sm:px-6 py-4 border-t border-ink/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">
                    Page {usersPage} / {totalUsersPages} · {filteredUsers.length} total
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="neo-border-sm bg-white px-3 py-1.5 text-[10px] font-black uppercase disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setUsersPage((p) => Math.min(totalUsersPages, p + 1))}
                      disabled={usersPage === totalUsersPages}
                      className="neo-border-sm bg-white px-3 py-1.5 text-[10px] font-black uppercase disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Topic Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-bg neo-border-lg flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b-4 border-ink flex justify-between items-center bg-white">
                <h2 className="text-3xl font-display uppercase">
                  {editingTopic?.id ? 'Edit Topic' : 'New Topic'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="hover:text-accent transition-colors">
                  <X size={32} />
                </button>
              </div>

              <form onSubmit={handleSaveTopic} className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Topic ID (Slug)</label>
                    <input 
                      type="text"
                      required
                      value={editingTopic?.id || ''}
                      onChange={(e) => setEditingTopic(prev => ({ ...prev!, id: e.target.value }))}
                      placeholder="e.g. quantum-physics"
                      className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Title</label>
                      <button 
                        type="button"
                        onClick={handleWikipediaAutofill}
                        disabled={isFetchingWiki || !editingTopic?.title}
                        className="text-[10px] font-black uppercase tracking-widest text-secondary hover:text-accent transition-colors flex items-center gap-1 disabled:opacity-40"
                      >
                        {isFetchingWiki ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
                        Magic AI Auto-fill
                      </button>
                    </div>
                    <input 
                      type="text"
                      required
                      value={editingTopic?.title || ''}
                      onChange={(e) => setEditingTopic(prev => ({ ...prev!, title: e.target.value }))}
                      placeholder="e.g. Quantum Physics"
                      className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">One-Line Description</label>
                  <input 
                    type="text"
                    required
                    value={editingTopic?.description || ''}
                    onChange={(e) => setEditingTopic(prev => ({ ...prev!, description: e.target.value }))}
                    placeholder="A brief hook for the topic..."
                    className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Main Content (Markdown Supported)</label>
                  <textarea 
                    required
                    rows={10}
                    value={editingTopic?.content || ''}
                    onChange={(e) => setEditingTopic(prev => ({ ...prev!, content: e.target.value }))}
                    placeholder="The deep dive content..."
                    className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Category</label>
                    <select 
                      value={editingTopic?.category || 'Science'}
                      onChange={(e) => setEditingTopic(prev => ({ ...prev!, category: e.target.value }))}
                      className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      <option>Science</option>
                      <option>Math</option>
                      <option>Philosophy</option>
                      <option>Technology</option>
                      <option>History</option>
                      <option>Art</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Tier</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setEditingTopic(prev => ({ ...prev!, is_pro: false }))}
                        className={cn(
                          "flex-grow py-3 px-4 font-bold text-xs uppercase tracking-widest neo-border-sm transition-all",
                          !editingTopic?.is_pro ? "bg-ink text-bg" : "bg-white text-ink hover:bg-ink/5"
                        )}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTopic(prev => ({ ...prev!, is_pro: true }))}
                        className={cn(
                          "flex-grow py-3 px-4 font-bold text-xs uppercase tracking-widest neo-border-sm transition-all",
                          editingTopic?.is_pro ? "bg-accent text-bg" : "bg-white text-ink hover:bg-ink/5"
                        )}
                      >
                        Pro
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Image URL</label>
                    <input 
                      type="url"
                      value={editingTopic?.image_url || ''}
                      onChange={(e) => setEditingTopic(prev => ({ ...prev!, image_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Video URL (Optional)</label>
                    <input 
                      type="url"
                      value={editingTopic?.video_url || ''}
                      onChange={(e) => setEditingTopic(prev => ({ ...prev!, video_url: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Related Topics</label>
                  
                  {/* Selected Topics Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {editingTopic?.related_ids?.map(id => {
                      const t = topics.find(topic => topic.id === id);
                      return (
                        <div key={id} className="bg-ink text-bg px-3 py-1 neo-border-sm flex items-center gap-2 text-[10px] font-bold uppercase">
                          {t?.title || id}
                          <button 
                            type="button"
                            onClick={() => setEditingTopic(prev => ({
                              ...prev!,
                              related_ids: prev?.related_ids?.filter(rid => rid !== id) || []
                            }))}
                            className="hover:text-accent transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                    {(!editingTopic?.related_ids || editingTopic.related_ids.length === 0) && (
                      <p className="text-[10px] font-bold opacity-40 uppercase italic">No related topics selected</p>
                    )}
                  </div>

                  {/* Search and Selection List */}
                  <div className="neo-border bg-white overflow-hidden flex flex-col max-h-64">
                    <div className="p-3 border-b-2 border-ink flex items-center gap-2 bg-ink/5">
                      <Search size={14} className="opacity-40" />
                      <input 
                        type="text"
                        placeholder="Search topics to relate..."
                        className="bg-transparent w-full text-xs font-bold focus:outline-none"
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          const items = document.querySelectorAll('.topic-select-item');
                          items.forEach((item: any) => {
                            const text = item.innerText.toLowerCase();
                            item.style.display = text.includes(val) ? 'flex' : 'none';
                          });
                        }}
                      />
                    </div>
                    <div className="overflow-y-auto p-2 space-y-1">
                      {topics
                        .filter(t => t.id !== editingTopic?.id)
                        .map(topic => {
                          const isSelected = editingTopic?.related_ids?.includes(topic.id);
                          return (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setEditingTopic(prev => {
                                  const current = prev?.related_ids || [];
                                  const next = isSelected 
                                    ? current.filter(id => id !== topic.id)
                                    : [...current, topic.id];
                                  return { ...prev!, related_ids: next };
                                });
                              }}
                              className={cn(
                                "topic-select-item w-full text-left px-3 py-2 text-[10px] font-bold uppercase flex items-center justify-between transition-colors",
                                isSelected ? "bg-primary text-ink" : "hover:bg-ink/5"
                              )}
                            >
                              <span>{topic.title}</span>
                              {isSelected && <Plus size={12} className="rotate-45" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-grow neo-button bg-primary text-ink py-4 flex items-center justify-center gap-3 font-display uppercase text-xl"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <Save size={24} />
                        Save Topic
                      </>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="neo-button bg-white text-ink px-8 py-4 font-display uppercase text-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-2xl bg-bg neo-border-lg"
            >
              <div className="p-5 sm:p-7 border-b-4 border-ink bg-white flex items-center justify-between">
                <h3 className="text-2xl sm:text-3xl font-display uppercase">
                  {editingUser?.created_at ? 'Edit User' : 'New User Profile'}
                </h3>
                <button onClick={() => setIsUserModalOpen(false)} className="hover:text-accent">
                  <X size={26} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="p-5 sm:p-7 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">User ID (UUID)</label>
                  <input
                    type="text"
                    required
                    value={editingUser?.id || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev!, id: e.target.value }))}
                    className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Supabase auth user id"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Display Name</label>
                    <input
                      type="text"
                      required
                      value={editingUser?.user_name || ''}
                      onChange={(e) => setEditingUser(prev => ({ ...prev!, user_name: e.target.value }))}
                      className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Score</label>
                    <input
                      type="number"
                      min={0}
                      value={editingUser?.total_score ?? 0}
                      onChange={(e) => setEditingUser(prev => ({ ...prev!, total_score: Number(e.target.value) || 0 }))}
                      className="w-full bg-white neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Subscription Tier</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingUser(prev => ({ ...prev!, subscription_tier: 'free' }))}
                      className={cn(
                        "flex-1 py-3 px-4 font-bold text-xs uppercase tracking-widest neo-border-sm transition-all",
                        (editingUser?.subscription_tier || 'free') === 'free' ? 'bg-ink text-bg' : 'bg-white text-ink hover:bg-ink/5'
                      )}
                    >
                      Free
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUser(prev => ({ ...prev!, subscription_tier: 'pro' }))}
                      className={cn(
                        "flex-1 py-3 px-4 font-bold text-xs uppercase tracking-widest neo-border-sm transition-all",
                        editingUser?.subscription_tier === 'pro' ? 'bg-accent text-bg' : 'bg-white text-ink hover:bg-ink/5'
                      )}
                    >
                      Pro
                    </button>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="flex-1 neo-button bg-primary text-ink py-3.5 flex items-center justify-center gap-3 font-display uppercase text-lg"
                  >
                    {isSavingUser ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save User</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="neo-button bg-white text-ink px-7 py-3.5 font-display uppercase text-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

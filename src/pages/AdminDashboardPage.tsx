import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, SupabaseTopic, SupabaseSession } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  LayoutDashboard, BookOpen, Users, TrendingUp, Plus, Edit2, Trash2, 
  X, Save, Loader2, LogOut, Search, Filter, ChevronRight, ArrowLeft,
  Image as ImageIcon, Video as VideoIcon, Tag as TagIcon
} from 'lucide-react';
import { cn, formatTime } from '../lib/utils';

export function AdminDashboardPage() {
  const [topics, setTopics] = useState<SupabaseTopic[]>([]);
  const [sessions, setSessions] = useState<SupabaseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'sessions'>('overview');
  const [editingTopic, setEditingTopic] = useState<Partial<SupabaseTopic> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem('admin_session');
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topicsRes, sessionsRes] = await Promise.all([
        supabase.from('topics').select('*').order('created_at', { ascending: false }),
        supabase.from('sessions').select('*').order('created_at', { ascending: false })
      ]);

      if (topicsRes.data) setTopics(topicsRes.data);
      if (sessionsRes.data) setSessions(sessionsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
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

  const stats = useMemo(() => {
    const totalTopics = topics.length;
    const totalSessions = sessions.length;
    const avgFocusScore = totalSessions > 0 
      ? Math.round(sessions.reduce((acc, s) => acc + s.focus_score, 0) / totalSessions) 
      : 0;
    const totalTime = sessions.reduce((acc, s) => acc + s.time_spent, 0);
    
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

    return { totalTopics, totalSessions, avgFocusScore, totalTime, chartData };
  }, [topics, sessions]);

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-bg flex flex-col sticky top-0 h-screen z-50">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-ink font-black">U</div>
            <h1 className="text-xl font-display uppercase tracking-tight">Unrot Admin</h1>
          </div>
          <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Control Center</p>
        </div>

        <nav className="flex-grow p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all",
              activeTab === 'overview' ? "bg-primary text-ink neo-border-sm" : "hover:bg-white/5 opacity-60 hover:opacity-100"
            )}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('topics')}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all",
              activeTab === 'topics' ? "bg-primary text-ink neo-border-sm" : "hover:bg-white/5 opacity-60 hover:opacity-100"
            )}
          >
            <BookOpen size={18} />
            Topics
          </button>
          <button 
            onClick={() => setActiveTab('sessions')}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all",
              activeTab === 'sessions' ? "bg-primary text-ink neo-border-sm" : "hover:bg-white/5 opacity-60 hover:opacity-100"
            )}
          >
            <Users size={18} />
            Sessions
          </button>
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

      {/* Main Content */}
      <main className="flex-grow p-12 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-5xl font-display uppercase tracking-tight mb-2">Dashboard <span className="text-accent">Overview.</span></h2>
                  <p className="font-bold opacity-60 uppercase text-xs tracking-widest">Real-time platform performance</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Last Updated</p>
                  <p className="font-mono font-bold">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center neo-border-sm">
                      <BookOpen size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Topics</p>
                  <p className="text-4xl font-display uppercase">{stats.totalTopics}</p>
                </div>
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-secondary/10 text-secondary flex items-center justify-center neo-border-sm">
                      <Users size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Sessions</p>
                  <p className="text-4xl font-display uppercase">{stats.totalSessions}</p>
                </div>
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-accent/10 text-accent flex items-center justify-center neo-border-sm">
                      <TrendingUp size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Avg Focus Score</p>
                  <p className="text-4xl font-display uppercase">{stats.avgFocusScore}</p>
                </div>
                <div className="neo-card bg-white p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-ink/5 text-ink flex items-center justify-center neo-border-sm">
                      <TrendingUp size={20} />
                    </div>
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Focus Time</p>
                  <p className="text-4xl font-display uppercase">{Math.floor(stats.totalTime / 60)}m</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="neo-card bg-white p-8">
                  <h3 className="text-xl font-display uppercase mb-8 flex items-center gap-3">
                    <TrendingUp size={20} className="text-accent" />
                    Session Activity (7 Days)
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
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
                    <ResponsiveContainer width="100%" height="100%">
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
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-5xl font-display uppercase tracking-tight mb-2">Manage <span className="text-primary">Topics.</span></h2>
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
                <table className="w-full text-left">
                  <thead className="bg-ink text-bg">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Topic</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Category</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Created</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {filteredTopics.map((topic) => (
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
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-5xl font-display uppercase tracking-tight mb-2">User <span className="text-secondary">Sessions.</span></h2>
                  <p className="font-bold opacity-60 uppercase text-xs tracking-widest">Monitor user engagement and focus metrics</p>
                </div>
              </div>

              <div className="neo-card bg-white p-0 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-ink text-bg">
                    <tr>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">User</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Duration</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Depth</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Score</th>
                      <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {sessions.map((session) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Title</label>
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
    </div>
  );
}

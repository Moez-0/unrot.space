import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Topic } from '../data/topics';
import { TopicCard } from '../components/TopicComponents';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Loader2, Search, X, Filter, Zap } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { cn } from '../lib/utils';
import { generateSmartPath } from '../services/aiService';

export function ExplorePage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isActive, startSession, user, isPro, isProfileLoading, sessionLimitReached } = useSession();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [smartGoal, setSmartGoal] = useState('');
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [smartPath, setSmartPath] = useState<{ pathTitle: string; reason: string; topicIds: string[] } | null>(null);

  const getCategoryRank = (category: string) => {
    const normalized = category.trim().toLowerCase();
    if (normalized === 'science') return 0;
    if (normalized === 'physics') return 1;
    return 2;
  };

  const sortCategories = (input: string[]) => {
    return [...input].sort((a, b) => {
      const rankDiff = getCategoryRank(a) - getCategoryRank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.localeCompare(b);
    });
  };

  useEffect(() => {
    const isSuccess = searchParams.get('success') === 'true';
    const token = searchParams.get('customer_session_token');

    if (isSuccess) {
      if (token) {
        navigate(`/success?customer_session_token=${token}`, { replace: true });
      } else {
        navigate('/success', { replace: true });
      }
    }
  }, [searchParams, navigate]);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*');

        if (data && !error) {
          setTopics(data);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, []);

  const handleTopicClick = async (topic: any) => {
    if (topic.is_pro && user && isProfileLoading) {
      return;
    }

    if (topic.is_pro && !isPro) {
      navigate('/pricing');
      return;
    }

    if (sessionLimitReached) {
      setError('Daily session limit reached. Upgrade to Pro for unlimited sessions.');
      return;
    }

    if (isActive) {
      navigate(`/topic/${topic.id}`);
    } else if (user) {
      try {
        await startSession(topic.id);
        navigate(`/topic/${topic.id}`);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      navigate('/auth');
    }
  };

  const categories = useMemo(() => {
    return sortCategories(Array.from(new Set(topics.map((topic) => topic.category))));
  }, [topics]);

  const topicById = useMemo(() => {
    const map = new Map<string, any>();
    topics.forEach((topic) => map.set(topic.id, topic));
    return map;
  }, [topics]);

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const matchesSearch = 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || topic.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [topics, searchQuery, selectedCategory]);

  const filteredCategories = useMemo(() => {
    if (selectedCategory) return [selectedCategory];
    return sortCategories(Array.from(new Set(filteredTopics.map((topic) => topic.category))));
  }, [filteredTopics, selectedCategory]);

  const handleGeneratePath = async () => {
    if (!smartGoal.trim()) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isPro) {
      navigate('/pricing');
      return;
    }

    setIsGeneratingPath(true);
    setError(null);
    try {
      const proAccessibleTopics = topics.filter(topic => !topic.is_pro || isPro);
      const result = await generateSmartPath(smartGoal, proAccessibleTopics);

      if (!result || result.topicIds.length === 0) {
        setError('Could not generate a path right now. Try refining your goal.');
        return;
      }

      setSmartPath(result);
    } catch (err) {
      console.error('Smart path generation failed:', err);
      setError('Smart path generation failed. Please try again.');
    } finally {
      setIsGeneratingPath(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Explore Rabbit Holes | unrot</title>
        <meta name="description" content="Browse our curated collection of knowledge rabbit holes. Choose your entry point and start your journey into deep, focused thinking." />
        <link rel="canonical" href="https://unrot.space/explore" />
      </Helmet>

      <AnimatePresence>
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-ink text-bg p-4 neo-border flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-accent fill-accent" />
                <p className="text-xs font-black uppercase tracking-widest">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="hover:text-accent">
                <X size={18} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="pt-24 pb-20">
        <header className="max-w-7xl mx-auto px-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-secondary text-ink px-2 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-4">
              The Knowledge Base
            </div>
            <h1 className="text-5xl md:text-7xl font-display tracking-tight mb-8">
              CHOOSE YOUR <br />
              <span className="text-accent">RABBIT HOLE.</span>
            </h1>
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <p className="text-lg text-ink font-bold max-w-2xl leading-snug">
                Pick an entry point. Once you enter, the clock starts. 
                Follow the connections. Don't look back.
              </p>

              {/* Search and Filters */}
              <div className="w-full lg:w-auto space-y-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 group-focus-within:text-accent transition-colors" size={20} />
                  <input 
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full lg:w-80 bg-white neo-border px-12 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest neo-border-sm transition-all",
                  !selectedCategory ? "bg-ink text-bg" : "bg-white text-ink hover:bg-ink/5"
                )}
              >
                All Topics
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest neo-border-sm transition-all",
                    selectedCategory === category ? "bg-accent text-bg" : "bg-white text-ink hover:bg-ink/5"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-8 neo-card bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display uppercase text-xl">Smart Path Generator</h3>
                  <span className={cn(
                    "text-[10px] uppercase tracking-widest font-black px-2 py-1 neo-border-sm",
                    isPro ? "bg-accent text-bg" : "bg-ink/10 text-ink/50"
                  )}>
                    {isPro ? 'PRO' : 'Upgrade Required'}
                  </span>
                </div>

                <p className="text-sm font-bold opacity-70">
                  Enter a goal and get a guided 5-topic learning path.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={smartGoal}
                    onChange={(e) => setSmartGoal(e.target.value)}
                    placeholder="e.g., Understand quantum mechanics from scratch"
                    className="flex-grow bg-bg neo-border px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    onClick={handleGeneratePath}
                    disabled={isGeneratingPath || !smartGoal.trim()}
                    className="neo-button bg-primary px-6 py-3 text-xs sm:text-sm uppercase font-black disabled:opacity-50"
                  >
                    {isGeneratingPath ? 'Generating...' : 'Generate Path'}
                  </button>
                </div>

                {smartPath && (
                  <div className="mt-2 p-4 bg-secondary/10 neo-border-sm">
                    <h4 className="font-display uppercase text-lg mb-2">{smartPath.pathTitle}</h4>
                    <p className="text-xs font-bold opacity-60 mb-4 uppercase tracking-widest">{smartPath.reason}</p>
                    <div className="space-y-2">
                      {smartPath.topicIds.map((topicId, index) => {
                        const topic = topicById.get(topicId);
                        return (
                          <button
                            key={`${topicId}-${index}`}
                            onClick={() => topic && handleTopicClick(topic)}
                            className="w-full text-left px-3 py-2 bg-white neo-border-sm hover:bg-primary/15 transition-colors"
                          >
                            <span className="text-[10px] uppercase font-black opacity-50 mr-2">Step {index + 1}</span>
                            <span className="font-bold text-sm">{topic?.title || topicId}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </header>

        <main className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="animate-spin text-accent" size={48} />
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-20 neo-card bg-white">
              <Search size={48} className="mx-auto mb-6 text-ink/20" />
              <h2 className="text-2xl font-display uppercase mb-2">No rabbit holes found.</h2>
              <p className="font-bold opacity-60">Try adjusting your search or filters.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                className="mt-6 neo-button bg-primary"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((category) => {
                const categoryTopics = filteredTopics.filter(t => t.category === category);
                if (categoryTopics.length === 0) return null;

                return (
                  <motion.section 
                    key={category} 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-16"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <h2 className="text-sm uppercase tracking-[0.4em] font-black bg-ink text-bg px-3 py-1 neo-border-sm">{category}</h2>
                      <div className="h-1 flex-grow bg-ink"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryTopics.map(topic => (
                        <motion.div 
                          key={topic.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => handleTopicClick(topic)} 
                          className="cursor-pointer"
                        >
                          <div className="pointer-events-none">
                            <TopicCard topic={topic} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                );
              })}
            </AnimatePresence>
          )}
        </main>
      </div>
    </>
  );
}

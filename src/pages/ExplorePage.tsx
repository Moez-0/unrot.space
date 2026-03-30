import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Topic } from '../data/topics';
import { TopicCard } from '../components/TopicComponents';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Loader2, Search, X, Filter, Zap } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { StartSessionModal } from '../components/StartSessionModal';
import { cn } from '../lib/utils';

export function ExplorePage() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isActive, startSession, setUserName, userName, isPro, sessionLimitReached } = useSession();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    if (topic.is_pro && !isPro) {
      navigate('/pricing');
      return;
    }

    if (sessionLimitReached) {
      setError('Daily session limit reached. Upgrade to Pro for unlimited thinking.');
      return;
    }

    if (isActive) {
      navigate(`/topic/${topic.id}`);
    } else if (userName) {
      try {
        await startSession(topic.id);
        navigate(`/topic/${topic.id}`);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      setSelectedTopicId(topic.id);
      setIsModalOpen(true);
    }
  };

  const handleConfirmName = async (name: string) => {
    setUserName(name);
    try {
      await startSession(selectedTopicId || undefined);
      setIsModalOpen(false);
      navigate(`/topic/${selectedTopicId || 'philosophy-of-time'}`);
    } catch (err: any) {
      setError(err.message);
      setIsModalOpen(false);
    }
  };

  const categories = useMemo(() => 
    Array.from(new Set(topics.map(t => t.category))).sort()
  , [topics]);

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
    return Array.from(new Set(filteredTopics.map(t => t.category))).sort();
  }, [filteredTopics, selectedCategory]);

  return (
    <>
      <Helmet>
        <title>Explore Rabbit Holes | unrot</title>
        <meta name="description" content="Browse our curated collection of knowledge rabbit holes. Choose your entry point and start your journey into deep, focused thinking." />
        <link rel="canonical" href="https://unrot.space/explore" />
      </Helmet>
      <StartSessionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleConfirmName} 
      />

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

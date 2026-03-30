import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Topic } from '../data/topics';
import { useSession } from '../context/SessionContext';
import { ChainTracker } from '../components/TopicComponents';
import { formatTime, cn, getYouTubeId } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, LogOut, Zap, ChevronRight, ArrowRight, Play, Image as ImageIcon, Loader2, Trophy, Wind, Music, Coffee, Headphones, Volume2, VolumeX, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { generateTopicInsights } from '../services/aiService';

export function TopicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isActive, startSession, addToChain, elapsedTime, chain, endSession, isSaving, user, isPro, focusMode, setFocusMode } = useSession();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<Topic[]>([]);
  const [furtherReading, setFurtherReading] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const focusModes = [
    { id: 'default', name: 'Standard', icon: Zap, color: 'bg-primary' },
    { id: 'lofi', name: 'Lo-Fi Beats', icon: Music, color: 'bg-secondary', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'nature', name: 'Nature', icon: Wind, color: 'bg-green-400', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'deep-focus', name: 'Deep Focus', icon: Headphones, color: 'bg-accent', audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  ];

  useEffect(() => {
    if (audioRef.current) {
      const mode = focusModes.find(m => m.id === focusMode);
      if (mode?.audio && !isMuted && isActive) {
        audioRef.current.src = mode.audio;
        audioRef.current.play().catch(e => console.log('Audio play blocked', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [focusMode, isMuted, isActive]);

  useEffect(() => {
    async function fetchTopic() {
      setLoading(true);
      const currentId = id || chain[chain.length - 1];
      
      if (!currentId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .eq('id', currentId)
          .single();

        if (data && !error) {
          // Check if topic is Pro and user is not Pro
          if (data.is_pro && !isPro) {
            navigate('/pricing');
            return;
          }

          const mainTopic = {
            ...data,
            related: data.related_ids || []
          };
          setTopic(mainTopic);

          // If insights already exist in DB, show them to everyone
          if (data.ai_insights) {
            setAiInsights(data.ai_insights);
          } else {
            // Auto-generate insights if topic is found and no insights exist
            handleGenerateInsights(mainTopic.title, mainTopic.content, mainTopic.id);
          }

          // Fetch related topics info
          if (mainTopic.related.length > 0) {
            const { data: relatedData } = await supabase
              .from('topics')
              .select('id, title, category')
              .in('id', mainTopic.related);
            
            if (relatedData) {
              setRelatedTopics(relatedData.map(t => ({ ...t, related: [] } as any)));
            }
          }

          // Fetch random further reading topics
          const { data: randomData } = await supabase
            .from('topics')
            .select('id, title, category')
            .neq('id', currentId)
            .limit(3);
          
          if (randomData) {
            setFurtherReading(randomData as any);
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTopic();
  }, [id, chain, isPro]);

  const handleGenerateInsights = async (title: string, content: string, topicId: string) => {
    setIsGeneratingInsights(true);
    try {
      const insights = await generateTopicInsights(title, content, topicId);
      setAiInsights(insights);
    } catch (err) {
      console.error('Failed to generate AI insights:', err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (!topic && !id && !loading && !isActive) {
      if (user) {
        startSession();
      } else {
        navigate('/auth');
      }
      return;
    }
    
    if (topic && !isActive) {
      if (user) {
        startSession(topic.id);
      } else {
        navigate('/auth');
      }
    } else if (topic && id && isActive) {
      addToChain(topic.id);
    }
  }, [topic, id, isActive, loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!topic && !isActive) return null;

  const handleEndSession = () => {
    endSession();
    navigate('/summary');
  };

  const processContent = (content: string) => {
    // Simple heuristic to wrap math-like lines in $$ if they aren't already
    return content.split('\n').map(line => {
      const trimmed = line.trim();
      // If it contains common LaTeX commands and isn't already wrapped
      if (
        (trimmed.includes('\\') || trimmed.includes('_') || trimmed.includes('^')) && 
        !trimmed.startsWith('$') && 
        trimmed.length > 5
      ) {
        // If it looks like a standalone equation (no spaces between words, or many math symbols)
        const mathSymbols = ['\\frac', '\\partial', '\\sum', '\\int', '\\pi', '\\mu', '\\nu', '\\Lambda', '\\Psi', '\\hat{H}', '\\hbar', '\\sigma', '\\omega', '\\Omega', '\\ln', '\\sqrt', '\\alpha', '\\beta', '\\gamma', '\\delta', '\\epsilon', '\\zeta', '\\eta', '\\theta', '\\iota', '\\kappa', '\\lambda', '\\xi', '\\omicron', '\\rho', '\\tau', '\\upsilon', '\\phi', '\\chi', '\\psi', '\\omega'];
        const hasMathCommand = mathSymbols.some(s => trimmed.includes(s));
        const hasOperators = ['=', '+', '-', '*', '/'].some(op => trimmed.includes(op));
        
        if (hasMathCommand || (hasOperators && trimmed.split(' ').length < 5)) {
          return `$$\n${trimmed}\n$$`;
        }
      }
      return line;
    }).join('\n');
  };

  return (
    <>
      <Helmet>
        <title>{topic ? `${topic.title} | unrot` : 'Topic | unrot'}</title>
        <meta name="description" content={topic?.description || 'Explore curated knowledge rabbit holes on unrot.'} />
        <meta property="og:title" content={topic ? `${topic.title} | unrot` : 'Topic | unrot'} />
        <meta property="og:description" content={topic?.description || 'Explore curated knowledge rabbit holes on unrot.'} />
        <meta property="og:url" content={`https://unrot.space/topic/${topic?.id}`} />
        <meta property="og:image" content={topic?.image_url || 'https://unrot.space/og-image.png'} />
        <meta property="twitter:title" content={topic ? `${topic.title} | unrot` : 'Topic | unrot'} />
        <meta property="twitter:description" content={topic?.description || 'Explore curated knowledge rabbit holes on unrot.'} />
        <meta property="twitter:image" content={topic?.image_url || 'https://unrot.space/og-image.png'} />
        <link rel="canonical" href={`https://unrot.space/topic/${topic?.id}`} />
      </Helmet>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "min-h-screen bg-bg flex flex-col transition-colors duration-1000",
          focusMode === 'lofi' && "bg-secondary/5",
          focusMode === 'nature' && "bg-green-50",
          focusMode === 'deep-focus' && "bg-accent/5"
        )}
      >
        <audio ref={audioRef} loop />
        <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-ink/5">
          <motion.div 
            className={cn(
              "h-full origin-left",
              focusMode === 'default' ? "bg-accent" : 
              focusMode === 'lofi' ? "bg-secondary" :
              focusMode === 'nature' ? "bg-green-400" : "bg-accent"
            )}
            style={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: false }}
          />
        </div>
      
      {isActive && (
        <>
          {/* Immersive Header */}
          <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-ink text-bg px-4 py-2 neo-border-sm">
                <Clock size={16} className="animate-pulse" />
                <span className="font-mono font-black text-lg">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2 bg-accent text-bg px-4 py-2 neo-border-sm">
                <Zap size={16} />
                <span className="font-display font-black text-lg uppercase">Depth {chain.length}</span>
              </div>
              {isPro && (
                <div className="flex items-center gap-2 bg-primary text-ink px-4 py-2 neo-border-sm">
                  <Trophy size={16} />
                  <span className="font-display font-black text-lg uppercase">Pro</span>
                </div>
              )}
              
              {/* Focus Mode Selector (Pro Only) */}
              {isPro && (
                <div className="hidden lg:flex items-center gap-1 bg-white neo-border-sm p-1">
                  {focusModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setFocusMode(mode.id as any)}
                      className={cn(
                        "p-2 transition-all hover:scale-110",
                        focusMode === mode.id ? cn(mode.color, "text-bg") : "text-ink/40 hover:text-ink"
                      )}
                      title={mode.name}
                    >
                      <mode.icon size={16} />
                    </button>
                  ))}
                  <div className="w-[1px] h-4 bg-ink/10 mx-1" />
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-ink/40 hover:text-ink"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={handleEndSession}
              className="neo-button bg-accent text-bg px-4 py-2 text-xs flex items-center gap-2"
            >
              <LogOut size={14} />
              END SESSION
            </button>
          </header>

          <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-32 px-6 max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={topic?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
                className="w-full"
              >
                {topic && (
                  <>
                    <div className="text-center mb-20">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-block bg-accent text-bg px-4 py-1 neo-border-sm text-[10px] uppercase tracking-[0.3em] font-black mb-8"
                      >
                        {topic.category}
                      </motion.div>
                      <h1 className="text-6xl md:text-9xl font-display uppercase leading-[0.8] mb-10 tracking-tighter">
                        {topic.title}
                      </h1>
                      <div className="flex items-center justify-center gap-8 mb-12">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-black opacity-40 mb-1">Read Time</span>
                          <span className="font-mono font-bold">~{Math.ceil(topic.content.split(' ').length / 200)} Min</span>
                        </div>
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-ink/90 leading-tight max-w-3xl mx-auto italic border-l-4 border-primary pl-8 text-left">
                        "{topic.description}"
                      </p>
                    </div>

                    {/* Media Section */}
                    {(topic.video_url || topic.image_url) && (
                      <div className="mb-24 neo-border-lg overflow-hidden bg-ink aspect-video relative group shadow-2xl">
                        {topic.video_url ? (
                          getYouTubeId(topic.video_url) ? (
                            <iframe 
                              src={`https://www.youtube.com/embed/${getYouTubeId(topic.video_url)}?autoplay=0&rel=0`}
                              title={topic.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          ) : (
                            <video 
                              src={topic.video_url} 
                              controls 
                              className="w-full h-full object-cover"
                              poster={topic.image_url}
                            />
                          )
                        ) : (
                          <img 
                            src={topic.image_url} 
                            alt={topic.title}
                            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
                      {/* Sidebar / Key Insights */}
                      <div className="lg:col-span-4 space-y-12">
                        <div className="neo-card bg-secondary/10 p-8 sticky top-32 space-y-12">
                          {/* AI Deep Insights (Pro Feature or Cached) */}
                          {(isPro || aiInsights.length > 0) && (
                            <div className="bg-accent/5 p-6 neo-border-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Sparkles size={60} className="text-accent" />
                              </div>
                              <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                  <Sparkles size={16} className="text-accent" />
                                  <h3 className="font-display uppercase text-sm">AI Deep Insights</h3>
                                </div>
                                
                                {isGeneratingInsights ? (
                                  <div className="flex items-center gap-2 py-2">
                                    <Loader2 className="animate-spin text-accent" size={14} />
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Thinking...</p>
                                  </div>
                                ) : aiInsights.length > 0 ? (
                                  <ul className="space-y-4">
                                    {aiInsights.map((insight, i) => (
                                      <li key={i} className="text-[10px] font-bold leading-relaxed border-l-2 border-accent pl-3 italic">
                                        {insight}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Insights unavailable.</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <h3 className="font-display uppercase text-xl mb-6 flex items-center gap-2">
                              <Zap size={20} className="text-accent" />
                              Key Insights
                            </h3>
                            <ul className="space-y-6">
                              {topic.content.split('.').slice(0, 3).map((insight, i) => (
                                <li key={i} className="flex gap-4">
                                  <span className="font-mono text-accent font-black">0{i+1}</span>
                                  <p className="text-xs font-bold leading-relaxed opacity-80">{insight.trim()}.</p>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-8 border-t-2 border-ink/5">
                            <h3 className="font-display uppercase text-sm mb-4 opacity-40">Did You Know?</h3>
                            <p className="text-xs font-bold italic leading-snug">
                              This concept is one of the most searched topics for deep focus enthusiasts. 
                              Studying it for just 10 minutes can improve your cognitive flexibility.
                            </p>
                          </div>

                          <div className="pt-8 border-t-2 border-ink/5">
                            <h3 className="font-display uppercase text-sm mb-4 opacity-40">Further Reading</h3>
                            <div className="space-y-3">
                              {furtherReading.map((t) => (
                                <Link 
                                  key={t.id} 
                                  to={`/topic/${t.id}`} 
                                  className="block text-[10px] font-black uppercase hover:text-accent transition-colors underline underline-offset-4"
                                >
                                  {t.category}: {t.title}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="lg:col-span-8">
                        <div className="prose prose-2xl max-w-none font-bold text-ink leading-[1.4] tracking-tight markdown-body">
                          <Markdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children, node }) => {
                                // Check if this is the first paragraph to apply drop cap
                                const isFirst = node?.position?.start.line === 1;
                                return (
                                  <p className={cn("mb-10 last:mb-0", isFirst && "first-letter:text-7xl first-letter:font-display first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8] first-letter:text-primary")}>
                                    {children}
                                  </p>
                                );
                              }
                            }}
                          >
                            {processContent(topic.content)}
                          </Markdown>
                        </div>

                        {/* Reflection Prompt */}
                        <div className="mt-20 p-10 bg-ink text-bg neo-border-lg">
                          <div className="text-[10px] uppercase font-black tracking-widest text-primary mb-4">Mindfulness Check</div>
                          <h3 className="text-3xl font-display uppercase mb-6">Pause and Reflect</h3>
                          <p className="text-lg opacity-80 mb-8 italic">
                            How does this concept challenge your current understanding of the world? 
                            Take 30 seconds to breathe and let the information settle.
                          </p>
                          <div className="h-1 w-full bg-white/10 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: "100%" }}
                              transition={{ duration: 30, ease: "linear" }}
                              className="h-full bg-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Go Deeper Section */}
                    <div className="mt-32 pt-20 border-t-4 border-ink">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.4em] font-black text-accent mb-4">The Journey Continues</div>
                          <h2 className="text-5xl md:text-7xl font-display uppercase leading-none">Next <span className="text-primary">Steps.</span></h2>
                        </div>
                        <p className="text-sm font-bold opacity-60 max-w-xs">
                          Choose your next rabbit hole. Each connection strengthens your focus and expands your mind.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {topic.related.map((relatedId) => {
                          const relatedTopic = relatedTopics.find(t => t.id === relatedId);
                          return (
                            <Link 
                              key={relatedId}
                              to={`/topic/${relatedId}`}
                              className="neo-card bg-white hover:bg-ink hover:text-bg transition-all duration-300 p-8 group flex justify-between items-center"
                            >
                              <div>
                                <div className="text-[10px] uppercase font-black opacity-60 mb-2 group-hover:text-primary transition-colors">{relatedTopic?.category || 'Deep Dive'}</div>
                                <div className="text-2xl font-display uppercase">{relatedTopic?.title || relatedId.replace(/-/g, ' ')}</div>
                              </div>
                              <div className="w-12 h-12 bg-ink text-bg group-hover:bg-primary group-hover:text-ink flex items-center justify-center transition-all duration-300">
                                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Subtle Chain Tracker at bottom */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm neo-border-sm p-3 pointer-events-auto">
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 shrink-0">Chain:</span>
                {chain.map((id, index) => {
                  return (
                    <div key={index} className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-black uppercase">{id.replace(/-/g, ' ')}</span>
                      {index < chain.length - 1 && <ArrowRight size={10} className="opacity-40" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      </motion.div>
    </>
  );
}

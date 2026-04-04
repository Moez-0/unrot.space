import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Loader2, Send, X } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  confessionLimits,
  createConfession,
  fetchConfessions,
  type Confession,
} from '../services/confessionsService';

const confessionPrompt = 'Confess your most embarrassing screen addiction moment — anonymously.';

function formatConfessionDate(dateValue: string) {
  return new Date(dateValue).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ConfessionsPage() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedConfession, setSelectedConfession] = useState<Confession | null>(null);

  const remainingChars = useMemo(() => confessionLimits.max - text.length, [text.length]);

  const loadConfessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await fetchConfessions(80);
      setConfessions(rows);
    } catch (err) {
      console.error('Failed to load confessions', err);
      setError('Could not load confessions right now. Try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfessions();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await createConfession(text);
      setText('');
      setSuccessMessage('Confession submitted anonymously. It will appear after admin approval.');
      await loadConfessions();
    } catch (err: any) {
      console.error('Failed to submit confession', err);
      setError(err?.message || 'Could not submit confession. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Unrot Confessions | Anonymous Brainrot Stories</title>
        <meta
          name="description"
          content="Submit and read anonymous confessions about screen addiction, doomscrolling, and attention span struggles on unrot."
        />
        <link rel="canonical" href="https://unrot.space/confessions" />
      </Helmet>

      <div className="pt-24 pb-20">
        <AnimatePresence>
          {selectedConfession && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-ink/65 sm:hidden"
              onClick={() => setSelectedConfession(null)}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={(event) => event.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-bg neo-border rounded-t-2xl p-5 max-h-[78vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h3 className="text-xl font-display">Confession</h3>
                  <button
                    onClick={() => setSelectedConfession(null)}
                    className="p-2 bg-white neo-border-sm"
                    aria-label="Close confession"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-base font-bold leading-relaxed whitespace-pre-wrap">{selectedConfession.confession_text}</p>
                <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest font-black opacity-60">
                  <span className="flex items-center gap-1">
                    <Flame size={12} className="text-accent" />
                    anon #{selectedConfession.id.slice(0, 6)}
                  </span>
                  <time dateTime={selectedConfession.created_at}>{formatConfessionDate(selectedConfession.created_at)}</time>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="max-w-6xl mx-auto px-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-block bg-accent text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-4">
              Unrot Confessions
            </div>
            <h1 className="text-5xl md:text-7xl font-display tracking-tight mb-6">
              THE BRAINROT <span className="text-accent">CONFESSION BOOTH.</span>
            </h1>
            <p className="text-lg font-bold max-w-3xl leading-snug opacity-80">{confessionPrompt}</p>
          </motion.div>
        </section>

        <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="neo-card bg-white p-6">
              <h2 className="text-2xl font-display mb-4">Drop yours</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Tell us your most embarrassing doomscroll moment..."
                  minLength={confessionLimits.min}
                  maxLength={confessionLimits.max}
                  required
                  className="w-full min-h-40 bg-bg neo-border p-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 resize-y"
                />

                <div className="flex items-center justify-between gap-3">
                  <p className={cn('text-[10px] uppercase tracking-widest font-black', remainingChars < 40 ? 'text-accent' : 'text-ink/50')}>
                    {remainingChars} chars left
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting || text.trim().length < confessionLimits.min}
                    className="neo-button bg-primary px-5 py-2 text-xs disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Posting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send size={14} />
                        Post Anonymously
                      </span>
                    )}
                  </button>
                </div>

                {error && (
                  <p className="text-xs font-black uppercase tracking-widest text-accent">{error}</p>
                )}

                {successMessage && (
                  <p className="text-xs font-black uppercase tracking-widest text-ink">{successMessage}</p>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="neo-card bg-white p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-display">Latest confessions</h2>
                <button
                  onClick={loadConfessions}
                  className="text-[10px] uppercase tracking-widest font-black px-3 py-1 neo-border-sm bg-bg hover:bg-secondary/20"
                >
                  Refresh
                </button>
              </div>

              {isLoading ? (
                <div className="py-10 flex items-center justify-center text-ink/60">
                  <Loader2 className="animate-spin" size={20} />
                </div>
              ) : confessions.length === 0 ? (
                <div className="bg-bg neo-border-sm p-5 text-sm font-bold opacity-70">
                  No confessions yet. Be the first to drop one.
                </div>
              ) : (
                <div className="space-y-3 max-h-[850px] overflow-y-auto pr-1">
                  {confessions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (window.innerWidth < 640) {
                          setSelectedConfession(item);
                        }
                      }}
                      className="w-full text-left bg-bg neo-border-sm p-4 hover:bg-secondary/10 transition-colors"
                    >
                      <p className="text-sm sm:text-base font-bold leading-relaxed">{item.confession_text}</p>
                      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-widest font-black opacity-55">
                        <span className="flex items-center gap-1">
                          <Flame size={12} className="text-accent" />
                          anon #{item.id.slice(0, 6)}
                        </span>
                        <time dateTime={item.created_at}>{formatConfessionDate(item.created_at)}</time>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

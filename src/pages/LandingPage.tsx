import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Zap, Play, Sparkles, Swords, Share2, Target, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSession } from '../context/SessionContext';

export function LandingPage() {
  const { startSession, user } = useSession();
  const navigate = useNavigate();

  const featureHighlights = [
    {
      icon: Flame,
      title: 'Daily streaks + quests',
      desc: 'Keep a focus habit alive with streak tracking, daily quests, and progress right in the navbar.',
      tag: 'Free',
    },
    {
      icon: Swords,
      title: 'Battle mode duels',
      desc: 'Challenge yourself in fast timed rounds and win with better depth, speed, and accuracy.',
      tag: 'Free',
    },
    {
      icon: Target,
      title: 'Pro smart paths',
      desc: 'Turn a goal into a guided 5-step learning path built from existing rabbit holes.',
      tag: 'Pro',
    },
    {
      icon: Sparkles,
      title: 'AI deep insights',
      desc: 'Unlock deeper analysis on topics and session context for richer learning.',
      tag: 'Pro',
    },
    {
      icon: Share2,
      title: 'Shareable recap cards',
      desc: 'Copy a TikTok-ready caption and share your session score, depth, and chain instantly.',
      tag: 'Free',
    },
  ];

  const handleStartSession = () => {
    if (user) {
      startSession();
      navigate('/session');
    } else {
      navigate('/auth');
    }
  };

  return (
    <>
      <Helmet>
        <title>unrot | Focus App for Deep Work, Attention & Learning</title>
        <meta name="description" content="Unrot is a focus app for deep work, attention span improvement, and structured learning. Explore curated rabbit holes, streaks, battle mode, and smart paths to reduce doomscrolling." />
        <link rel="canonical" href="https://unrot.space" />
      </Helmet>
      <div className="pt-20 sm:pt-24">
        {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-block bg-accent text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
              Focus app for deep work
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-9xl leading-[0.85] md:leading-[0.8] font-display mb-6 sm:mb-8 uppercase">
              RECLAIM YOUR <br />
              <span className="text-primary bg-ink px-4 py-2 inline-block -rotate-2">ATTENTION.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-2xl text-ink font-bold mb-6 leading-snug mx-auto max-w-2xl">
              Unrot helps you build a stronger <strong>attention span</strong> with curated rabbit holes, deep focus sessions, and a better way to learn online.
            </p>
            
            <p className="text-xs uppercase tracking-[0.2em] font-black text-accent mb-10 opacity-80">
              Learn more. Doomscroll less. Think deeper.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full">
              <button
                onClick={handleStartSession}
                className="neo-button bg-primary text-ink px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl flex items-center gap-3 group w-full sm:w-auto"
              >
                <Play className="fill-ink group-hover:scale-110 transition-transform" size={24} />
                START SESSION
              </button>
              <Link
                to="/explore"
                className="text-xs uppercase tracking-widest font-black text-ink hover:text-accent underline underline-offset-8"
              >
                Explore Rabbit Holes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
        <div className="flex items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <div className="inline-block bg-secondary text-ink px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-4">
              New product features
            </div>
            <h2 className="text-3xl sm:text-5xl font-display uppercase leading-tight">
              Built to make <span className="text-accent">deep work</span> stick.
            </h2>
          </div>
          <Link
            to="/pricing"
            className="hidden md:inline-flex items-center gap-2 text-xs uppercase tracking-widest font-black hover:text-accent transition-colors"
          >
            See pricing <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {featureHighlights.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.06 }}
              className="neo-card bg-white p-6 sm:p-7 flex flex-col gap-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 neo-border-sm bg-primary text-ink flex items-center justify-center shrink-0">
                  <feature.icon size={22} />
                </div>
                <span className={cn(
                  'text-[10px] uppercase tracking-widest font-black px-2 py-1 neo-border-sm',
                  feature.tag === 'Pro' ? 'bg-accent text-bg' : 'bg-secondary text-ink'
                )}>
                  {feature.tag}
                </span>
              </div>

              <div>
                <h3 className="font-display uppercase text-2xl mb-3 leading-none">{feature.title}</h3>
                <p className="text-sm sm:text-base font-bold leading-relaxed opacity-75">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
        <div className="bg-ink text-bg neo-border-lg p-6 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-display mb-8 sm:mb-12">How unrot improves focus and learning.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  color: 'bg-primary',
                  title: "Initiate",
                  desc: "Pick a topic, then read with intent instead of mindless swiping."
                },
                {
                  color: 'bg-secondary',
                  title: "Explore",
                  desc: "Follow the threads. Each topic leads to a deeper layer of knowledge."
                },
                {
                  color: 'bg-accent',
                  title: "Integrate",
                  desc: "Finish with a map of your journey and retain what you learned."
                }
              ].map((step, i) => (
                <div key={i} className="bg-white text-ink neo-border p-8">
                  <div className={cn("w-12 h-12 neo-border-sm flex items-center justify-center font-black text-xl mb-6", step.color)}>
                    {i+1}
                  </div>
                  <h3 className="text-xl font-display mb-3">{step.title}</h3>
                  <p className="text-sm font-medium leading-relaxed opacity-80">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24 text-center">
        <div className="neo-card bg-primary/10 p-6 sm:p-12">
          <blockquote className="font-display text-2xl md:text-4xl font-black leading-tight uppercase tracking-tight">
            "The ability to focus without distraction is the superpower of the 21st century."
          </blockquote>
          <cite className="block mt-8 text-[10px] uppercase tracking-[0.3em] font-black text-muted">— Cal Newport</cite>
        </div>
      </section>

      {/* Feature Loop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 neo-card bg-white p-6 sm:p-8">
            <div className="inline-block bg-primary text-ink px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-4">
              Why it works
            </div>
            <h2 className="text-3xl sm:text-5xl font-display uppercase leading-tight mb-5">
              A product loop <span className="text-primary">built for retention.</span>
            </h2>
            <p className="text-sm sm:text-base font-bold leading-relaxed opacity-75 mb-6">
              Every session feeds the next one: streaks keep you coming back, battle mode makes learning social, share cards make it easy to post, and smart paths turn curiosity into a real learning plan.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Streaks', 'Quests', 'Battle', 'Share', 'Smart Paths'].map((item) => (
                <span key={item} className="bg-ink text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 neo-card bg-primary p-6 sm:p-8 flex items-center justify-center">
            <div className="w-full bg-white neo-border-lg p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-1">Session recap</div>
                  <h3 className="font-display uppercase text-2xl sm:text-3xl">Shareable by default</h3>
                </div>
                <Sparkles className="text-accent" />
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
                {[
                  { label: 'Score', value: '420' },
                  { label: 'Depth', value: '7' },
                  { label: 'Time', value: '18m' },
                ].map((item) => (
                  <div key={item.label} className="bg-secondary/15 neo-border-sm p-3 text-center">
                    <div className="text-[10px] uppercase tracking-widest font-black opacity-50">{item.label}</div>
                    <div className="text-2xl font-display uppercase mt-1">{item.value}</div>
                  </div>
                ))}
              </div>

              <p className="text-sm font-bold opacity-70 leading-relaxed">
                Turn completed sessions into a story worth sharing with one-click captions, link copy, and vertical-ready recap cards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-display uppercase leading-none">
              THE <span className="text-accent">COST</span> OF <br />
              <span className="text-primary">BRAINROT.</span>
            </h2>
            <p className="text-base sm:text-lg font-bold leading-snug opacity-80">
              The modern attention economy is designed to keep you doomscrolling in a state of perpetual shallow engagement. 
              We're rapidly losing the ability to engage with complex ideas.
            </p>
            <div className="space-y-4">
              {[
                { label: "Average Attention Span", value: "8 Seconds", color: "bg-accent" },
                { label: "Daily Phone Pickups", value: "96 Times", color: "bg-secondary" },
                { label: "Deep Work Capacity", value: "-50% Yearly", color: "bg-primary" }
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={cn("w-2 h-12 neo-border-sm", stat.color)}></div>
                  <div>
                    <div className="text-[10px] uppercase font-black opacity-40">{stat.label}</div>
                    <div className="text-2xl font-display uppercase">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="neo-card bg-ink text-bg p-6 sm:p-12 flex flex-col justify-center aspect-square md:aspect-auto md:h-full">
            <div className="text-5xl sm:text-6xl font-display text-primary mb-6">90%</div>
            <p className="text-lg sm:text-xl font-bold leading-tight uppercase tracking-tighter">
              Of digital content is consumed mindlessly. Unrot is for people who want to learn on purpose.
            </p>
            <div className="mt-12 pt-12 border-t border-white/10">
              <p className="text-xs font-mono opacity-40">
                Source: Attention Economy Research 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 sm:mb-24">
        <div className="neo-card bg-white p-6 sm:p-10">
          <div className="inline-block bg-secondary text-ink px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-4">
            FAQ
          </div>
          <h2 className="text-3xl sm:text-5xl font-display uppercase leading-tight mb-8">
            Common questions about <span className="text-accent">unrot</span>
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'What is unrot?',
                a: 'Unrot is a focus app and learning platform that helps you replace doomscrolling with curated rabbit holes, reading sessions, and better knowledge retention.',
              },
              {
                q: 'How does unrot help with attention span?',
                a: 'It turns passive scrolling into active reading, so you spend more time with deep work, structured topics, and less time bouncing between random feeds.',
              },
              {
                q: 'Is unrot free?',
                a: 'Yes. The core focus experience is free, including sessions, battle mode, streaks, quests, and basic topics.',
              },
            ].map((item) => (
              <div key={item.q} className="bg-bg neo-border-sm p-4 sm:p-5">
                <h3 className="font-display uppercase text-xl mb-2">{item.q}</h3>
                <p className="text-sm sm:text-base font-bold leading-relaxed opacity-80">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 sm:mb-32">
        <div className="bg-primary p-6 sm:p-12 md:p-24 text-center neo-border-lg relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-accent/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl md:text-8xl font-display uppercase leading-[0.85] md:leading-[0.8] mb-8 sm:mb-12">
              READY TO <br />
              <span className="bg-ink text-bg px-4 py-2 inline-block rotate-1">RECLAIM?</span>
            </h2>
            <p className="text-base sm:text-xl font-bold mb-8 sm:mb-12 max-w-2xl mx-auto">
              Join people who want a better way to browse the internet: <strong>less doomscrolling, more depth, and better retention</strong>.
            </p>
            <button
              onClick={handleStartSession}
              className="neo-button bg-ink text-bg px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-2xl flex items-center gap-4 mx-auto hover:bg-accent transition-colors w-full sm:w-auto"
            >
              <Zap className="fill-primary text-primary" size={28} />
              INITIATE UNROT
            </button>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

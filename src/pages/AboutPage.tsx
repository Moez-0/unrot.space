import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';

export function AboutPage() {
  return (
    <div className="pt-32 pb-20 max-w-3xl mx-auto px-6">
      <Helmet>
        <title>About unrot | Focus App, Deep Work & Attention Training</title>
        <meta name="description" content="Learn about unrot, a focus app built for deep work, attention span improvement, and learning through curated rabbit holes instead of doomscrolling." />
        <link rel="canonical" href="https://unrot.space/about" />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-block bg-accent text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
          About the mission
        </div>
        <h1 className="text-6xl md:text-8xl font-display tracking-tighter mb-12 uppercase leading-[0.85]">
          WHY <span className="text-primary">UNROT</span> EXISTS
        </h1>

        <div className="space-y-12 text-lg font-bold leading-snug">
          <section className="neo-card bg-white">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-accent mb-6 bg-ink text-bg inline-block px-2 py-1">The problem</h2>
            <p>
              We are living in an era of unprecedented <strong>cognitive fragmentation</strong>. The average person scrolls through endless content every day, and that constant stream of shallow information weakens focus, memory, and deep thinking.
            </p>
          </section>

          <section className="neo-card bg-secondary/10">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-ink mb-6 bg-primary inline-block px-2 py-1 neo-border-sm">The solution</h2>
            <p>
              Unrot is a <strong>focus app</strong> built to facilitate "rabbit holes"—the natural human tendency to follow a thread of curiosity into the depths of a subject. Instead of doomscrolling, you get structured reading, better retention, and a more intentional learning experience.
            </p>
          </section>

          <section className="neo-card bg-accent/5">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-ink mb-6 bg-accent text-bg inline-block px-2 py-1">Principles</h2>
            <ul className="space-y-6 list-none p-0">
              {[
                <>Depth over breadth. One deep thought is worth a thousand fragments.</>,
                <>
                  Intentionality. Every click should support <strong>deep work</strong>, not compulsion.
                </>,
                <>Clarity. The digital world is too loud, so we create quiet space for focus.</>
              ].map((text, i) => (
                <li key={i} className="flex gap-4 items-center">
                  <span className="font-display text-2xl font-black bg-ink text-bg w-8 h-8 flex items-center justify-center shrink-0">
                    {i+1}
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="pt-12 text-center">
            <p className="font-display font-black text-ink text-3xl uppercase rotate-1">
              Go deeper. <span className="text-accent">Reclaim your mind.</span>
            </p>
          </div>

          <section className="neo-card bg-white">
            <div className="inline-block bg-secondary text-ink px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
              FAQ
            </div>
            <h2 className="text-2xl sm:text-4xl font-display uppercase leading-tight mb-6">
              About unrot: common questions
            </h2>
            <div className="space-y-5">
              {[
                {
                  q: 'What is unrot for?',
                  a: 'Unrot is for people who want to improve their attention span, build a better reading habit, and learn from curated rabbit holes instead of random feeds.',
                },
                {
                  q: 'Is unrot a productivity tool or a learning app?',
                  a: (
                    <>
                      It is both. Unrot combines focus sessions, <strong>deep work</strong> habits, and topic exploration so the learning process feels structured and engaging.
                    </>
                  ),
                },
                {
                  q: 'How is unrot different from social media?',
                  a: 'Social media is optimized for endless scrolling. Unrot is optimized for intention, depth, and knowledge retention.',
                },
              ].map((item) => (
                <div key={item.q} className="bg-bg neo-border-sm p-4 sm:p-5">
                  <h3 className="font-display uppercase text-lg mb-2">{item.q}</h3>
                  <p className="text-sm sm:text-base font-bold leading-relaxed opacity-80">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

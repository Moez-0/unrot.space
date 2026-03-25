import { motion } from 'motion/react';

export function AboutPage() {
  return (
    <div className="pt-32 pb-20 max-w-3xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-block bg-accent text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
          Our Mission
        </div>
        <h1 className="text-6xl md:text-8xl font-display tracking-tighter mb-12 uppercase leading-[0.85]">
          WHY <span className="text-primary">UNROT?</span>
        </h1>

        <div className="space-y-12 text-lg font-bold leading-snug">
          <section className="neo-card bg-white">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-accent mb-6 bg-ink text-bg inline-block px-2 py-1">The Crisis</h2>
            <p>
              We are living in an era of unprecedented cognitive fragmentation. 
              The average person scrolls through 300 feet of content every day. 
              This constant stream of shallow information is rotting our ability to think.
            </p>
          </section>

          <section className="neo-card bg-secondary/10">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-ink mb-6 bg-primary inline-block px-2 py-1 neo-border-sm">The Antidote</h2>
            <p>
              Unrot is a tool for reclamation. It is designed to facilitate "rabbit holes"—the 
              natural human tendency to follow a thread of curiosity into the depths of a subject. 
            </p>
          </section>

          <section className="neo-card bg-accent/5">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-ink mb-6 bg-accent text-bg inline-block px-2 py-1">Principles</h2>
            <ul className="space-y-6 list-none p-0">
              {[
                "Depth over breadth. One deep thought is worth a thousand fragments.",
                "Intentionality. Every click should be a choice, not a compulsion.",
                "Silence. The digital world is too loud. We value the quiet space."
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
        </div>
      </motion.div>
    </div>
  );
}

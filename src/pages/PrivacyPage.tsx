import { motion } from 'motion/react';
import { Shield, Eye, Lock, Database, Trash2 } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-block bg-accent text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
          Legal & Privacy
        </div>
        <h1 className="text-6xl md:text-8xl font-display tracking-tighter mb-12 uppercase leading-[0.85]">
          PRIVACY <span className="text-primary">POLICY.</span>
        </h1>

        <div className="space-y-12 text-lg font-bold leading-snug">
          <section className="neo-card bg-white">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-accent mb-6 bg-ink text-bg inline-block px-2 py-1">Our Stance</h2>
            <p>
              At Unrot, we believe your attention is sacred. We do not sell your data, 
              we do not track you across the web, and we do not use manipulative algorithms. 
              Our business model is built on value, not exploitation.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="neo-card bg-secondary/10">
              <div className="w-12 h-12 bg-primary flex items-center justify-center neo-border-sm mb-6">
                <Eye size={24} />
              </div>
              <h3 className="text-xl font-display uppercase mb-4">What we see</h3>
              <p className="text-sm opacity-80">
                We collect minimal data: your chosen name, your session focus scores, 
                and the paths you take through our rabbit holes. This is used solely 
                for the leaderboard and your personal progress.
              </p>
            </section>

            <section className="neo-card bg-accent/5">
              <div className="w-12 h-12 bg-accent text-bg flex items-center justify-center neo-border-sm mb-6">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-display uppercase mb-4">What we protect</h3>
              <p className="text-sm opacity-80">
                Your session data is stored securely. We use industry-standard encryption 
                to ensure that your focus journey remains yours alone, unless you 
                choose to share it.
              </p>
            </section>
          </div>

          <section className="neo-card bg-white">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-ink mb-8 bg-primary inline-block px-2 py-1 neo-border-sm">Your Rights</h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-ink text-bg flex items-center justify-center shrink-0 neo-border-sm">
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="font-display uppercase text-lg">Data Access</h4>
                  <p className="text-xs opacity-60">You have the right to request a copy of all data we have associated with your thinker name.</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-accent text-bg flex items-center justify-center shrink-0 neo-border-sm">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h4 className="font-display uppercase text-lg">Right to be Forgotten</h4>
                  <p className="text-xs opacity-60">You can request the deletion of your leaderboard entries and session history at any time.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-12 text-center border-t-4 border-ink">
            <p className="text-[10px] uppercase tracking-[0.4em] font-black opacity-40">
              Last Updated: March 2026 • unrot.space
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

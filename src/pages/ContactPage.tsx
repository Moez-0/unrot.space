import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Globe, Send } from 'lucide-react';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="pt-32 pb-20 max-w-4xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-block bg-accent text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
          Get in Touch
        </div>
        <h1 className="text-6xl md:text-8xl font-display tracking-tighter mb-12 uppercase leading-[0.85]">
          CONTACT <span className="text-primary">UNROT.</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <section className="neo-card bg-white">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-accent mb-6 bg-ink text-bg inline-block px-2 py-1">Direct Lines</h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary flex items-center justify-center neo-border-sm shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black opacity-50">Email</div>
                    <div className="font-bold">hello@unrot.space</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary flex items-center justify-center neo-border-sm shrink-0">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black opacity-50">Support</div>
                    <div className="font-bold">support@unrot.space</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent flex items-center justify-center neo-border-sm shrink-0 text-bg">
                    <Globe size={20} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black opacity-50">Website</div>
                    <div className="font-bold">unrot.space</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="neo-card bg-ink text-bg">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-primary mb-4">Office Hours</h2>
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                We operate in deep focus mode. Responses may take up to 48 hours. 
                We value quality over speed.
              </p>
            </section>
          </div>

          <section className="neo-card bg-white">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-ink mb-8 bg-primary inline-block px-2 py-1 neo-border-sm">Send a Message</h2>
            
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-accent text-bg flex items-center justify-center neo-border mx-auto mb-6">
                  <Send size={32} />
                </div>
                <h3 className="text-2xl font-display uppercase mb-2">Message Received</h3>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest">We will get back to you soon.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest mb-2 opacity-50">Your Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full neo-border-sm px-4 py-3 bg-white text-ink font-bold uppercase outline-none focus:bg-primary/10 transition-colors"
                    placeholder="Thinker Name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest mb-2 opacity-50">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full neo-border-sm px-4 py-3 bg-white text-ink font-bold uppercase outline-none focus:bg-primary/10 transition-colors"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black tracking-widest mb-2 opacity-50">Message</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full neo-border-sm px-4 py-3 bg-white text-ink font-bold uppercase outline-none focus:bg-primary/10 transition-colors resize-none"
                    placeholder="What's on your mind?"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full neo-button bg-accent text-bg py-4 font-display uppercase text-xl flex items-center justify-center gap-3"
                >
                  <Send size={20} />
                  Transmit
                </button>
              </form>
            )}
          </section>
        </div>
      </motion.div>
    </div>
  );
}

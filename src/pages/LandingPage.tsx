import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Zap, Eye, Brain, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSession } from '../context/SessionContext';
import { useState } from 'react';

export function LandingPage() {
  const { startSession, user } = useSession();
  const navigate = useNavigate();

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
        <title>unrot | Cure Brainrot & Reclaim Your Attention</title>
        <meta name="description" content="Tired of endless doomscrolling? Unrot your brain. An anti-brainrot platform designed to cure digital fatigue, restore deep focus, and help you reclaim your attention span." />
        <link rel="canonical" href="https://unrot.space" />
      </Helmet>
      <div className="pt-24">
        {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-block bg-accent text-bg px-3 py-1 neo-border-sm text-[10px] uppercase tracking-widest font-black mb-6">
              The Ultimate Brainrot Cure
            </div>
            <h1 className="text-6xl md:text-9xl leading-[0.8] font-display mb-8 uppercase">
              UNROT YOUR <br />
              <span className="text-primary bg-ink px-4 py-2 inline-block -rotate-2">BRAIN.</span>
            </h1>
            <p className="text-lg md:text-2xl text-ink font-bold mb-6 leading-snug mx-auto max-w-2xl">
              Endless doomscrolling is destroying your attention span. 
              Cure your digital fatigue and reclaim your focus through curated rabbit holes.
            </p>
            
            <p className="text-xs uppercase tracking-[0.2em] font-black text-accent mb-10 opacity-80">
              Most people can’t focus for 10 minutes. Try.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={handleStartSession}
                className="neo-button bg-primary text-ink px-12 py-6 text-xl flex items-center gap-3 group"
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

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <div className="bg-ink text-bg neo-border-lg p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-display mb-12">How to cure brainrot.</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  color: 'bg-primary',
                  title: "Initiate",
                  desc: "Pick a topic. Set your intention. No more mindless swiping."
                },
                {
                  color: 'bg-secondary',
                  title: "Explore",
                  desc: "Follow the threads. Each topic leads to another deeper layer."
                },
                {
                  color: 'bg-accent',
                  title: "Integrate",
                  desc: "Finish with a map of your journey. Real knowledge, retained."
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
      <section className="max-w-4xl mx-auto px-6 mb-24 text-center">
        <div className="neo-card bg-primary/10 p-12">
          <blockquote className="font-display text-2xl md:text-4xl font-black leading-tight uppercase tracking-tight">
            "The ability to focus without distraction is the superpower of the 21st century."
          </blockquote>
          <cite className="block mt-8 text-[10px] uppercase tracking-[0.3em] font-black text-muted">— Cal Newport</cite>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-7xl font-display uppercase leading-none">
              THE <span className="text-accent">COST</span> OF <br />
              <span className="text-primary">BRAINROT.</span>
            </h2>
            <p className="text-lg font-bold leading-snug opacity-80">
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
          <div className="neo-card bg-ink text-bg p-12 flex flex-col justify-center aspect-square md:aspect-auto md:h-full">
            <div className="text-6xl font-display text-primary mb-6">90%</div>
            <p className="text-xl font-bold leading-tight uppercase tracking-tighter">
              Of digital content is consumed mindlessly. Unrot is for the other 10%.
            </p>
            <div className="mt-12 pt-12 border-t border-white/10">
              <p className="text-xs font-mono opacity-40">
                Source: Attention Economy Research 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-6 mb-32">
        <div className="bg-primary p-12 md:p-24 text-center neo-border-lg relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-accent/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-5xl md:text-8xl font-display uppercase leading-[0.8] mb-12">
              READY TO <br />
              <span className="bg-ink text-bg px-4 py-2 inline-block rotate-1">RECLAIM?</span>
            </h2>
            <p className="text-xl font-bold mb-12 max-w-2xl mx-auto">
              Join thousands of thinkers who are choosing depth over doomscrolling. 
              Your first rabbit hole is waiting.
            </p>
            <button
              onClick={handleStartSession}
              className="neo-button bg-ink text-bg px-12 py-6 text-2xl flex items-center gap-4 mx-auto hover:bg-accent transition-colors"
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

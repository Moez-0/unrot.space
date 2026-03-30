import { motion } from 'motion/react';
import { Check, Zap, Trophy, Award, ArrowRight, Shield, Star, Crown } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { Link } from 'react-router-dom';

export function PricingPage() {
  const { isPro, user } = useSession();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'The basic focus experience.',
      features: [
        '10 sessions per day',
        'Access to basic topics',
        'Global leaderboard',
        'Basic achievements',
      ],
      buttonText: 'Current Plan',
      buttonClass: 'bg-bg text-ink opacity-50 cursor-not-allowed',
      isCurrent: !isPro,
    },
    {
      name: 'Pro',
      price: '$2.99',
      period: '/month',
      description: 'For the elite thinkers.',
      features: [
        'Unlimited sessions',
        'AI Deep Insights & Analysis',
        'Access to ALL Pro topics',
        'Unlimited session history',
        'Personalized knowledge paths',
        'Custom focus ambience',
        'Pro badge on leaderboard',
      ],
      buttonText: isPro ? 'Current Plan' : 'Upgrade to Pro',
      buttonClass: isPro ? 'bg-bg text-ink opacity-50 cursor-not-allowed' : 'bg-accent text-bg',
      isCurrent: isPro,
      highlight: true,
      polarUrl: 'https://buy.polar.sh/polar_cl_R7YjuL6FnFt01t35RPD5dSSBcqYFBGQDDUR2l1kvpdS', // Placeholder Polar.sh URL
    },
  ];

  return (
    <div className="min-h-screen bg-bg pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block bg-primary text-ink px-4 py-1 neo-border-sm text-xs uppercase font-black mb-6"
          >
            Pricing Plans
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-display uppercase leading-[0.8] mb-8">
            INVEST IN <span className="text-accent">DEPTH.</span>
          </h1>
          <p className="text-xl font-bold opacity-60 uppercase tracking-widest max-w-2xl mx-auto">
            Choose the plan that fits your journey to reclaiming focus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`neo-card p-10 flex flex-col relative overflow-hidden ${plan.highlight ? 'bg-ink text-bg' : 'bg-white text-ink'}`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 bg-accent text-bg px-6 py-2 font-display uppercase text-xs rotate-45 translate-x-8 translate-y-4">
                  Popular
                </div>
              )}

              <div className="mb-10">
                <h2 className="text-3xl font-display uppercase mb-2">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-display">{plan.price}</span>
                  {plan.period && <span className="text-sm font-bold opacity-60 uppercase">{plan.period}</span>}
                </div>
                <p className="text-sm font-bold opacity-60 uppercase tracking-widest">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-12 flex-grow">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center neo-border-sm ${plan.highlight ? 'bg-accent text-bg' : 'bg-primary text-ink'}`}>
                      <Check size={14} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tight">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.polarUrl && !plan.isCurrent ? (
                user ? (
                  <a
                    href={`${plan.polarUrl}?customer_email=${user?.email || ''}&metadata=${encodeURIComponent(JSON.stringify({ user_id: user?.id }))}&success_url=${encodeURIComponent(`${window.location.origin}/success`)}`}
                    className={`neo-button py-4 font-display uppercase text-xl flex items-center justify-center gap-3 ${plan.buttonClass}`}
                  >
                    {plan.buttonText}
                    <ArrowRight size={20} />
                  </a>
                ) : (
                  <Link
                    to="/auth?redirect=/pricing"
                    className={`neo-button py-4 font-display uppercase text-xl flex items-center justify-center gap-3 ${plan.buttonClass}`}
                  >
                    Sign in to Upgrade
                    <ArrowRight size={20} />
                  </Link>
                )
              ) : (
                <button
                  disabled={plan.isCurrent}
                  className={`neo-button py-4 font-display uppercase text-xl flex items-center justify-center gap-3 ${plan.buttonClass}`}
                >
                  {plan.buttonText}
                  {plan.isCurrent && <Check size={20} />}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="neo-card bg-secondary/10 p-8 text-center">
            <Shield className="mx-auto mb-6 text-accent" size={40} />
            <h3 className="font-display uppercase text-xl mb-4">Secure Payments</h3>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest leading-relaxed">
              Powered by Polar.sh. Your data is encrypted and secure.
            </p>
          </div>
          <div className="neo-card bg-secondary/10 p-8 text-center">
            <Star className="mx-auto mb-6 text-primary" size={40} />
            <h3 className="font-display uppercase text-xl mb-4">Elite Content</h3>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest leading-relaxed">
              Exclusive access to deep-dive topics curated by experts.
            </p>
          </div>
          <div className="neo-card bg-secondary/10 p-8 text-center">
            <Crown className="mx-auto mb-6 text-accent" size={40} />
            <h3 className="font-display uppercase text-xl mb-4">Thinker Status</h3>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest leading-relaxed">
              Stand out on the leaderboard with a verified Pro badge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

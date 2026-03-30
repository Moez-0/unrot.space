import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Zap, Sparkles } from 'lucide-react';

export function Navbar() {
  const { isActive, startSession, user, profile, isPro } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Leaderboard', path: '/leaderboard' },
    ...(!isPro ? [{ name: 'Pricing', path: '/pricing' }] : []),
    { name: 'About', path: '/about' },
  ];

  const handleStartSession = () => {
    if (isActive) {
      navigate('/session');
    } else if (user) {
      startSession();
      navigate('/session');
    } else {
      navigate('/auth');
    }
    setIsOpen(false);
  };

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
        <div className="bg-white neo-border px-6 h-14 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-display text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            unrot
          </Link>
          {isPro && (
            <div className="hidden sm:flex items-center gap-1 bg-accent text-bg px-2 py-0.5 neo-border-sm">
              <span className="text-[8px] uppercase font-black tracking-widest">PRO</span>
            </div>
          )}
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-xs uppercase tracking-widest font-black transition-all hover:text-accent",
                location.pathname === link.path ? "text-accent underline underline-offset-4" : "text-ink"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <Link
            to="/explore"
            className={cn(
              "text-xs uppercase tracking-widest font-black transition-all hover:text-accent",
              location.pathname === '/explore' ? "text-accent underline underline-offset-4" : "text-ink"
            )}
          >
            Explore
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link 
                to="/profile"
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest hover:text-accent transition-colors",
                  location.pathname === '/profile' ? "text-accent" : "opacity-60"
                )}
              >
                {profile?.user_name || user.email?.split('@')[0]}
              </Link>
              {!isPro && (
                <Link 
                  to="/pricing"
                  className="bg-accent text-bg px-3 py-1 neo-border-sm text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Upgrade
                </Link>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="text-xs uppercase tracking-widest font-black transition-all hover:text-accent"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={handleStartSession}
            className="neo-button bg-primary text-[10px] py-2 px-6 flex items-center gap-2"
          >
            <Zap size={14} className="fill-ink" />
            {isActive ? "RESUME SESSION" : "START SESSION"}
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-ink"
        >
          {isOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-white neo-border p-6 md:hidden flex flex-col gap-6 z-40"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-sm uppercase tracking-widest font-black transition-all",
                  location.pathname === link.path ? "text-accent" : "text-ink"
                )}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/explore"
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-sm uppercase tracking-widest font-black transition-all",
                location.pathname === '/explore' ? "text-accent" : "text-ink"
              )}
            >
              Explore
            </Link>
            <button
              onClick={handleStartSession}
              className="neo-button bg-primary text-center py-3 flex items-center justify-center gap-2"
            >
              <Zap size={16} className="fill-ink" />
              {isActive ? "RESUME SESSION" : "START SESSION"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </nav>
    </>
  );
}

export function Footer() {
  return (
    <footer className="py-12 border-t-4 border-ink bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="font-display text-xl font-black uppercase italic">Think again.</h2>
          <p className="text-[10px] text-ink mt-2 uppercase tracking-widest font-bold">© 2026 UNROT. ALL RIGHTS RESERVED.</p>
        </div>
        
        <div className="flex gap-6">
          {['About', 'Privacy', 'Contact'].map((item) => (
            <Link 
              key={item} 
              to={`/${item.toLowerCase()}`} 
              className="text-[10px] uppercase tracking-widest font-black text-ink hover:text-accent transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

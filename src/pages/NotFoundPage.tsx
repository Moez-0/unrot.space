import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, ArrowLeft, Search } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] bg-bg flex items-center justify-center px-6 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="inline-block bg-accent text-bg p-6 neo-border mb-8">
          <Search size={48} strokeWidth={3} />
        </div>
        
        <h1 className="text-6xl md:text-8xl font-display uppercase leading-[0.8] mb-6 tracking-tighter">
          404 <br />
          <span className="text-primary">LOST.</span>
        </h1>
        
        <p className="text-xl font-bold text-ink/80 mb-10 uppercase tracking-tight">
          You've wandered into a void. This rabbit hole doesn't exist yet.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="neo-button bg-primary text-ink px-6 py-3 flex items-center justify-center gap-3 font-display uppercase text-lg"
          >
            <Home size={20} />
            Back to Reality
          </Link>
          <Link 
            to="/explore" 
            className="neo-button bg-white text-ink px-6 py-3 flex items-center justify-center gap-3 font-display uppercase text-lg"
          >
            <Search size={20} />
            Explore Topics
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t-4 border-ink/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
            Error Code: 0x404_VOID_ENCOUNTERED
          </p>
        </div>
      </motion.div>
    </div>
  );
}

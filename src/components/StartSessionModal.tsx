import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, User } from 'lucide-react';
import { useSession } from '../context/SessionContext';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function StartSessionModal({ isOpen, onClose, onConfirm }: StartSessionModalProps) {
  const { userName } = useSession();
  const [name, setName] = useState(userName);

  useEffect(() => {
    if (isOpen) {
      setName(userName);
    }
  }, [isOpen, userName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white neo-border-lg p-8 w-full max-w-md"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-primary/20 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary flex items-center justify-center neo-border mx-auto mb-4">
                <User size={32} />
              </div>
              <h2 className="text-3xl font-display uppercase">Identify Yourself</h2>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest mt-2">
                Your name will be etched on the leaderboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-black tracking-widest mb-2 opacity-50">
                  Thinker Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full neo-border-sm px-4 py-3 bg-white text-ink font-bold uppercase outline-none focus:bg-primary/10 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full neo-button bg-primary py-4 font-display uppercase text-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Play size={20} className="fill-ink" />
                ENTER THE VOID
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { Link } from 'react-router-dom';
import { Topic } from '../data/topics';
import { cn } from '../lib/utils';

export function ChainTracker({ chain }: { chain: string[] }) {
  if (chain.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-6 bg-secondary/10 border-b-4 border-ink">
      <div className="flex items-center gap-3 px-6 min-w-max">
        <span className="text-[10px] uppercase tracking-widest font-black bg-ink text-bg px-2 py-1">Path:</span>
        {chain.map((topicId, index) => {
          return (
            <div key={topicId} className="flex items-center gap-3">
              <Link
                to={`/topic/${topicId}`}
                className="text-[10px] font-mono px-3 py-1 neo-border bg-white font-bold"
              >
                {topicId.replace(/-/g, ' ')}
              </Link>
              {index < chain.length - 1 && (
                <span className="font-black text-ink">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TopicCard({ topic, className }: { topic: any; className?: string }) {
  const categoryColors: Record<string, string> = {
    'Philosophy': 'bg-primary',
    'Science': 'bg-secondary',
    'Psychology': 'bg-accent',
    'Productivity': 'bg-green-400'
  };

  return (
    <div
      className={cn(
        "neo-card group flex flex-col h-full bg-white relative",
        className
      )}
    >
      {topic.is_pro && (
        <div className="absolute top-4 right-4 z-10 bg-accent text-bg px-2 py-0.5 neo-border-sm text-[8px] font-black uppercase tracking-widest">
          Pro
        </div>
      )}
      {topic.image_url && (
        <div className="mb-4 neo-border overflow-hidden aspect-video bg-ink">
          <img 
            src={topic.image_url} 
            alt={topic.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <span className={cn(
        "text-[10px] uppercase tracking-widest font-black px-2 py-1 neo-border-sm self-start mb-4",
        categoryColors[topic.category] || 'bg-white'
      )}>
        {topic.category}
      </span>
      <h3 className="font-display text-xl mb-3 leading-tight uppercase">
        {topic.title}
      </h3>
      <p className="text-xs text-ink/70 line-clamp-2 leading-relaxed font-medium mb-6 flex-grow">
        {topic.description}
      </p>
      <div className="flex items-center justify-between mt-auto pt-4 border-t-2 border-ink/10">
        <span className="text-[10px] uppercase tracking-widest font-black">Explore</span>
        <div className="w-6 h-6 bg-ink text-bg flex items-center justify-center group-hover:bg-accent transition-colors">
          →
        </div>
      </div>
    </div>
  );
}

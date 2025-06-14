
import { tradeIdeas } from '@/data/mockData';
import { MessageCircle, Heart, Repeat } from 'lucide-react';

type TradeIdea = (typeof tradeIdeas)[0];

interface TradeIdeaCardProps {
  idea: TradeIdea;
}

const TradeIdeaCard = ({ idea }: TradeIdeaCardProps) => {
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
      <img src={idea.image} alt={idea.title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <img src={idea.authorAvatar} alt={idea.author} className="h-10 w-10 rounded-full bg-brand-gray-200" />
          <div>
            <p className="font-bold text-white">{idea.author}</p>
            <p className="text-sm text-brand-green">{idea.instrument}</p>
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{idea.title}</h3>
        <p className="text-gray-300 text-sm mb-4">{idea.breakdown}</p>
        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
              <Heart size={18} />
              <span>{idea.likes}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-brand-green transition-colors">
              <MessageCircle size={18} />
              <span>{idea.comments}</span>
            </button>
          </div>
          <div className="flex gap-2">
            {idea.tags.map(tag => (
              <span key={tag} className="bg-brand-gray-200 text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeIdeaCard;


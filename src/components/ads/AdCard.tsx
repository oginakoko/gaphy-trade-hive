import { Ad } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';

interface AdCardProps {
  ad: Ad;
}

const AdCard = ({ ad }: AdCardProps) => {
  const sponsorName = ad.profiles?.username || 'Sponsor';
  const sponsorAvatar = ad.profiles?.avatar_url || '/placeholder.svg';

  return (
    <div className="group glass-card rounded-xl overflow-hidden animate-fade-in-up flex flex-col transition-all duration-300 hover:border-brand-green/40 hover:shadow-xl hover:shadow-brand-green/10">
      {ad.media_url &&
        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-40 bg-brand-gray-300">
          {ad.media_type === 'image' && <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />}
          {ad.media_type === 'video' && <video src={ad.media_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />}
        </a>
      }
      <div className="p-3 flex flex-col flex-grow">
          <div className="flex items-center gap-3 mb-2">
          <img src={sponsorAvatar} alt={sponsorName} className="h-10 w-10 rounded-full bg-brand-gray-200 object-cover" />
          <div>
              <p className="font-bold text-white">{sponsorName}</p>
              <Badge variant="outline" className="border-none bg-brand-gray-300 text-gray-200 text-xs font-normal px-2 py-0.5">Promoted</Badge>
          </div>
          </div>
          <h3 className="text-lg font-bold text-gray-300 mb-2 group-hover:text-white transition-colors">
            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{ad.title}</a>
          </h3>
          <p className="prose prose-sm prose-invert text-gray-400 mb-3 flex-grow max-w-none overflow-hidden">
            {ad.content}
          </p>

          <div className="flex items-center justify-end text-gray-400 mt-auto pt-2 border-t border-white/10">
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-green text-sm">
                  Learn More
                  <ArrowUpRight size={16} className="transform transition-transform duration-300 group-hover:rotate-45" />
              </a>
          </div>
      </div>
    </div>
  );
};

export default AdCard;

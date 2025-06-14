
import { affiliateLinks } from '@/data/mockData';

const AffiliateLinks = () => {
  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Resources & Affiliates</h3>
      <div className="space-y-4">
        {affiliateLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 group p-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="bg-brand-gray-200 p-2 rounded-md">
                <link.icon className="h-6 w-6 text-brand-green" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-brand-green transition-colors">{link.title}</p>
              <p className="text-sm text-gray-400">{link.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default AffiliateLinks;

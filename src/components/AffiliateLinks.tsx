import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { icons, Link as LinkIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Define type here as types.ts is read-only
interface AffiliateLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
}
const fetchAffiliateLinks = async (): Promise<AffiliateLink[]> => {
  const {
    data,
    error
  } = await supabase.from('affiliate_links').select('*').order('created_at', {
    ascending: true
  });
  if (error) {
    console.error('Error fetching affiliate links:', error);
    return []; // Return empty array on error to not crash the component
  }
  return data || [];
};
const AffiliateLinks = () => {
  const {
    data: affiliateLinks,
    isLoading,
    error
  } = useQuery({
    queryKey: ['affiliateLinks'],
    queryFn: fetchAffiliateLinks
  });
  return <div className="glass-card rounded-xl p-6">
      
      <div className="space-y-4">
        {isLoading ? Array.from({
        length: 3
      }).map((_, index) => <div key={index} className="flex items-center gap-4 p-3">
                    <Skeleton className="h-10 w-10 rounded-md bg-brand-gray-200/10" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-brand-gray-200/10" />
                        <Skeleton className="h-4 w-48 bg-brand-gray-200/10" />
                    </div>
                </div>) : error ? <p className="text-red-500 text-sm">Could not load resources.</p> : affiliateLinks && affiliateLinks.length > 0 ? affiliateLinks.map(link => {
        const LucideIcon = icons[link.icon as keyof typeof icons] || LinkIcon;
        return <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group p-3 rounded-lg hover:bg-white/10 transition-colors">
                    <div className="bg-brand-gray-200 p-2 rounded-md">
                        <LucideIcon className="h-6 w-6 text-brand-green" />
                    </div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-brand-green transition-colors">{link.title}</p>
                      <p className="text-sm text-gray-400">{link.description}</p>
                    </div>
                </a>;
      }) : <p className="text-gray-400 text-sm">No resources have been added yet.</p>}
      </div>
    </div>;
};
export default AffiliateLinks;

import { Skeleton } from '@/components/ui/skeleton';
import { FeedItem as FeedItemType } from '@/hooks/useAnalysisFeed';
import { TradeIdea } from '@/types';
import FeedItem from './FeedItem';

interface FeedProps {
    feed: FeedItemType[];
    isLoading: boolean;
    error: Error | null;
    userLikes: Set<number>;
    isAdmin: boolean;
    onEditIdea: (idea: TradeIdea) => void;
}

const Feed = ({ feed, isLoading, error, userLikes, isAdmin, onEditIdea }: FeedProps) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-[280px] w-full rounded-xl glass-card" />
                <Skeleton className="h-[280px] w-full rounded-xl glass-card" />
                <Skeleton className="h-[280px] w-full rounded-xl glass-card" />
                <Skeleton className="h-[280px] w-full rounded-xl glass-card" />
                <Skeleton className="h-[280px] w-full rounded-xl glass-card" />
                <Skeleton className="h-[280px] w-full rounded-xl glass-card" />
            </div>
        );
    }

    if (error) {
        return <p className="text-center text-red-500 p-8 glass-card">Error loading content: {error.message}</p>;
    }

    if (feed.length === 0) {
        return (
            <div className="glass-card rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">No Content Yet</h3>
                <p className="text-gray-400">Check back soon for new trade ideas and more!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {feed.map((item) => (
                <FeedItem
                    key={`${item.viewType}-${item.id}`}
                    item={item}
                    userLikes={userLikes}
                    isAdmin={isAdmin}
                    onEditIdea={onEditIdea}
                />
            ))}
        </div>
    );
};

export default Feed;

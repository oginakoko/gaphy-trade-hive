
import { Skeleton } from '@/components/ui/skeleton';
import { FeedItem as FeedItemType } from '@/hooks/useAnalysisFeed';
import FeedItem from './FeedItem';

interface FeedProps {
    feed: FeedItemType[];
    isLoading: boolean;
    error: Error | null;
    userLikes: Set<number>;
}

const Feed = ({ feed, isLoading, error, userLikes }: FeedProps) => {
    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-[380px] w-full rounded-xl glass-card" />
                <Skeleton className="h-[380px] w-full rounded-xl glass-card" />
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
        <div className="space-y-8">
            {feed.map((item) => (
                <FeedItem key={`${item.viewType}-${item.id}`} item={item} userLikes={userLikes} />
            ))}
        </div>
    );
};

export default Feed;

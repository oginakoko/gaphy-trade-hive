
import { FeedItem as FeedItemType } from '@/hooks/useAnalysisFeed';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import AdCard from '@/components/ads/AdCard';

interface FeedItemProps {
    item: FeedItemType;
    userLikes: Set<number>;
}

const FeedItem = ({ item, userLikes }: FeedItemProps) => {
    if (item.viewType === 'idea') {
        const likesCount = item.likes?.[0]?.count || 0;
        const userHasLiked = userLikes.has(Number(item.id));
        return (
            <TradeIdeaCard
                idea={item}
                likesCount={likesCount}
                userHasLiked={userHasLiked}
            />
        );
    }
    
    // item.viewType === 'ad'
    return <AdCard ad={item} />;
};

export default FeedItem;

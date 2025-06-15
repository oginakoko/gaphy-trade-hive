
import { useServers } from '@/hooks/useServers';
import CompactServerCard from './CompactServerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const ServerRecommendations = () => {
  const { publicServers, userServers, isLoading, joinServer, isJoining } = useServers();

  const handleJoinServer = (serverId: string) => {
    joinServer({ serverId }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Joined server successfully!',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to join server.',
          variant: 'destructive',
        });
      }
    });
  };

  const userServerIds = new Set(userServers.map(s => s.id));
  const discoverablePublicServers = publicServers.filter(s => !userServerIds.has(s.id)).slice(0, 3);

  return (
    <div className="glass-card p-4 rounded-xl sticky top-24">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">Discover Servers</h3>
        <Link to="/servers" className="text-sm text-brand-green hover:underline">View All</Link>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : discoverablePublicServers.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-4">No new public servers to discover.</p>
      ) : (
        <div className="space-y-2">
          {discoverablePublicServers.map((server) => (
            <CompactServerCard
              key={server.id}
              server={server}
              onJoin={handleJoinServer}
              isJoining={isJoining}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ServerRecommendations;

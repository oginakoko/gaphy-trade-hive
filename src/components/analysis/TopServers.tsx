
import { useTopServers } from '@/hooks/useTopServers';
import { useServers } from '@/hooks/useServers';
import CompactServerCard from './CompactServerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { BarChart2 } from 'lucide-react';

const TopServers = () => {
    const { data: topServers, isLoading } = useTopServers();
    const { userServers, joinServer, isJoining } = useServers();

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
    const topPublicServers = topServers?.filter(s => !userServerIds.has(s.id)).slice(0, 3);

    return (
        <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center mb-4">
                <BarChart2 size={18} className="mr-2 text-brand-green" />
                <h3 className="text-lg font-bold text-white">Top Servers</h3>
            </div>
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>
            ) : topPublicServers && topPublicServers.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">No new top servers to show.</p>
            ) : (
                <div className="space-y-2">
                    {topPublicServers?.map((server) => (
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

export default TopServers;

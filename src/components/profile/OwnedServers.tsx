import { useServers } from '@/hooks/useServers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Share2, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

const OwnedServers = () => {
  const { ownedServers, isLoading } = useServers();
  const [copiedServerId, setCopiedServerId] = useState<string | null>(null);

  const handleShareServer = async (serverId: string) => {
    const shareUrl = `${window.location.origin}/servers?server_id=${serverId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedServerId(serverId);
      toast({
        title: 'Link Copied',
        description: 'Server link has been copied to clipboard',
      });
      setTimeout(() => setCopiedServerId(null), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading your servers...</div>;
  }

  if (ownedServers.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">No Servers Yet</h3>
          <p className="text-gray-400">You haven't created any servers yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">My Servers ({ownedServers.length})</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {ownedServers.map((server) => (
          <Card key={server.id} className="glass-card cursor-pointer transition-shadow hover:shadow-lg hover:border-brand-green/40 focus:ring-2 focus:ring-brand-green outline-none" onClick={() => window.location.href = `/servers/${server.id}`} tabIndex={0} role="button" aria-label={`Go to server ${server.name}`}> 
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={server.image_url || undefined} />
                  <AvatarFallback className="bg-brand-green text-black font-bold">
                    {server.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-white text-base sm:text-lg">{server.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-400">
                    <Users size={14} />
                    <span>{server.member_count || 0} members</span>
                    {server.is_public ? (
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        <span>Public</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <EyeOff size={14} />
                        <span>Private</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={e => { e.stopPropagation(); handleShareServer(server.id); }}
                className="flex items-center gap-2 ml-auto"
              >
                <Share2 size={14} />
                {copiedServerId === server.id ? 'Copied!' : 'Share'}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-2 text-sm sm:text-base">{server.description}</p>
              <p className="text-xs text-gray-500">
                Created {new Date(server.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OwnedServers;

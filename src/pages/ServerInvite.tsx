import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useServers } from '@/hooks/useServers';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabaseClient';

const ServerInvite = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userServers, isLoading: isLoadingServers, joinServer, isJoining } = useServers();
  const [server, setServer] = useState<any>(null);
  const [isLoadingServer, setIsLoadingServer] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        toast({
          title: 'Authenticated',
          description: 'You are already signed in.',
        });
      } else {
        toast({
          title: 'Authentication Required',
          description: 'You need to sign in to accept the invite.',
        });
        navigate(`/auth?redirect=/servers/invite/${serverId}?forceInvite=true`);
      }
    }
  }, [user, authLoading, navigate, serverId]);

  useEffect(() => {
    const fetchServer = async () => {
      if (serverId) {
        setIsLoadingServer(true);
        try {
          const { data, error } = await supabase
            .from('servers')
            .select('*, profiles!owner_id(username, avatar_url), server_members(count)')
            .eq('id', serverId)
            .single();

          if (error) {
            console.log('Server fetch error:', error);
            toast({
              title: 'Server Not Found',
              description: 'This server may no longer exist or you do not have access. Please check the invite link.',
              variant: 'destructive',
            });
            setServer(null);
          } else {
            console.log('Server fetched successfully:', data);
            const serverWithCount = {
              ...data,
              member_count: data.server_members[0]?.count ?? 0
            };
            setServer(serverWithCount);
          }
        } catch (err) {
          console.log('Unexpected error fetching server:', err);
          toast({
            title: 'Error',
            description: 'Failed to fetch server details. Please try again later.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingServer(false);
        }
      }
    };

    if (!isLoadingServers && serverId && user) {
      console.log('Processing invite for server ID:', serverId);
      fetchServer();
    }
  }, [isLoadingServers, userServers, serverId, navigate]);

  const handleAcceptInvite = async () => {
    if (server) {
      try {
        await new Promise((resolve, reject) => {
          joinServer({ serverId: server.id });
          if (isJoining) {
            const interval = setInterval(() => {
              if (!isJoining) {
                clearInterval(interval);
                resolve(true);
              }
            }, 100);
          } else {
            resolve(true);
          }
        });
        toast({
          title: 'Joined Server',
          description: `You have successfully joined "${server.name}".`,
        });
        navigate(`/servers/${server.id}`);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to join the server. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  if (isLoadingServers || authLoading || isLoadingServer) {
    return (
      <>
        <Header />
        <div className="py-8 container mx-auto px-4">
          <Skeleton className="h-[300px] glass-card" />
        </div>
      </>
    );
  }

  if (!server) {
    return (
      <>
        <Header />
        <div className="py-8 container mx-auto px-4">
          <div className="glass-card rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Server Not Found</h2>
            <p className="text-gray-400">This server may be private or no longer exist.</p>
            <Button onClick={() => navigate('/servers')} className="mt-4">
              View All Servers
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="py-8 container mx-auto px-4">
        <div className="glass-card rounded-xl p-8 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Invite to Join {server.name}</h2>
          <p className="text-gray-400 mb-6">
            You've been invited to join <strong>{server.name}</strong>. Would you like to accept this invitation?
          </p>
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleAcceptInvite}
              disabled={isJoining}
              className="bg-brand-green text-black hover:bg-brand-green/80"
            >
              Accept Invite
            </Button>
            <Button
              onClick={() => navigate('/servers')}
              variant="outline"
              className="text-white hover:text-white"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServerInvite;


import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useServers } from '@/hooks/useServers';
import ServerCard from '@/components/servers/ServerCard';
import CreateServerForm from '@/components/servers/CreateServerForm';
import ServerChat from '@/components/servers/ServerChat';
import { Server } from '@/types/server';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

const Servers = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  
  const { 
    publicServers, 
    userServers, 
    isLoading, 
    joinServer, 
    isJoining 
  } = useServers();

  useEffect(() => {
    if (selectedServer) {
      const serverFromList = userServers.find(s => s.id === selectedServer.id);
      if (serverFromList) {
        // If server data in the main list is updated (e.g., member count, name),
        // update the selectedServer state to match.
        if (JSON.stringify(serverFromList) !== JSON.stringify(selectedServer)) {
            setSelectedServer(serverFromList);
        }
      } else {
        // If server is no longer in the list (e.g., deleted), go back.
        setSelectedServer(null);
      }
    }
  }, [userServers, selectedServer]);

  const handleJoinServer = (serverId: string) => {
    joinServer({ serverId });
    toast({
      title: 'Success',
      description: 'Joined server successfully!',
    });
  };

  const handleEnterServer = (serverId: string) => {
    const server = [...publicServers, ...userServers].find(s => s.id === serverId);
    if (server) {
      setSelectedServer(server);
    }
  };

  const isUserMember = (serverId: string) => {
    return userServers.some(server => server.id === serverId);
  };

  const userServerIds = new Set(userServers.map(s => s.id));
  const discoverablePublicServers = publicServers.filter(s => !userServerIds.has(s.id));

  if (selectedServer) {
    return (
      <>
        <Header />
        <div className="h-[calc(100vh-80px)]">
          <ServerChat 
            server={selectedServer} 
            onBack={() => setSelectedServer(null)} 
          />
        </div>
      </>
    );
  }

  if (showCreateForm) {
    return (
      <>
        <Header />
        <div className="py-8 container mx-auto px-4">
          <CreateServerForm onClose={() => setShowCreateForm(false)} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="py-8 container mx-auto px-4">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Gaphy Servers</h1>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-brand-green text-black hover:bg-brand-green/80"
              >
                <Plus size={20} className="mr-2" />
                Create Server
              </Button>
            </div>

            {/* My Servers */}
            {userServers.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">My Servers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userServers.map((server) => (
                    <ServerCard
                      key={server.id}
                      server={server}
                      onJoin={handleJoinServer}
                      onEnter={handleEnterServer}
                      isJoining={isJoining}
                      isMember={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Public Servers */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                Discover Public Servers
              </h2>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[200px] glass-card" />
                  ))}
                </div>
              ) : discoverablePublicServers.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">No Public Servers Yet</h3>
                  <p className="text-gray-400">Create a public server or check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discoverablePublicServers.map((server) => (
                    <ServerCard
                      key={server.id}
                      server={server}
                      onJoin={handleJoinServer}
                      onEnter={handleEnterServer}
                      isJoining={isJoining}
                      isMember={isUserMember(server.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Servers;


import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import DonationModal from '@/components/DonationModal';
import { Gem, Bot, PlusCircle } from 'lucide-react';
import GaphyBot from '@/components/landing/GaphyBot';
import { useAnalysisFeed } from '@/hooks/useAnalysisFeed';
import Feed from '@/components/analysis/Feed';
import ServerRecommendations from '@/components/analysis/ServerRecommendations';
import TopServers from '@/components/analysis/TopServers';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import TradeIdeaForm from '@/components/admin/TradeIdeaForm';
import { TradeIdea } from '@/types';

const Analysis = () => {
  const [isDonationModalOpen, setDonationModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { feed, isLoading, error, userLikes } = useAnalysisFeed();
  const { user } = useAuth();
  const isAdmin = user?.id === '73938002-b3f8-4444-ad32-6a46cbf8e075';

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<TradeIdea | null>(null);

  const handleNew = () => {
    setEditingIdea(null);
    setFormOpen(true);
  };
  
  const handleEdit = (idea: TradeIdea) => {
    setEditingIdea(idea);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
        setEditingIdea(null);
    }
  };

  return (
    <>
      <Header />
      <main className="py-8 container mx-auto px-4">
        {isAdmin && (
            <div className="flex justify-end mb-4">
                <Button onClick={handleNew} className="bg-brand-green text-black font-bold hover:bg-brand-green/80 flex items-center gap-2">
                    <PlusCircle size={20} />
                    New Trade Idea
                </Button>
            </div>
        )}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
                <Feed 
                    feed={feed}
                    isLoading={isLoading}
                    error={error as Error | null}
                    userLikes={userLikes}
                    isAdmin={isAdmin}
                    onEditIdea={handleEdit}
                />
            </div>
            <div className="hidden lg:block space-y-8">
              <ServerRecommendations />
              <TopServers />
            </div>
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
        <DialogContent className="glass-card border-brand-green/20 sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle className="text-white">{editingIdea ? 'Edit' : 'Create a New'} Trade Idea</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] -mr-6 pr-6">
                <TradeIdeaForm setOpen={setFormOpen} initialData={editingIdea} />
            </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <Button 
        onClick={() => setDonationModalOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-brand-green hover:bg-brand-green/80 text-black shadow-lg shadow-brand-green/30 flex items-center justify-center z-40"
      >
        <Gem size={28} />
      </Button>

      <div className="fixed bottom-24 right-6 z-50">
        {!isChatOpen && (
          <Button
            size="icon"
            className="rounded-full h-16 w-16 bg-brand-green text-black hover:bg-brand-green/80 shadow-lg transform transition-transform hover:scale-110 animate-fade-in-up"
            onClick={() => setIsChatOpen(true)}
          >
            <Bot className="h-8 w-8" />
          </Button>
        )}
      </div>

      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
            <GaphyBot onClose={() => setIsChatOpen(false)} />
        </div>
      )}

      <DonationModal isOpen={isDonationModalOpen} onClose={() => setDonationModalOpen(false)} />
    </>
  );
};

export default Analysis;

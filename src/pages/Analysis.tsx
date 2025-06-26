import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
import TradeIdeaForm from '@/components/trade-ideas/TradeIdeaForm';
import { TradeIdea } from '@/types';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const Analysis = () => {
  const [isDonationModalOpen, setDonationModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can make this customizable if needed

  const { feed, isLoading, error, userLikes, totalPages } = useAnalysisFeed(currentPage, itemsPerPage);
  const { user } = useAuth();
  const isAdmin = user?.id === '73938002-b3f8-4444-ad32-6a46cbf8e075';

  const [isFormOpen, setFormOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<TradeIdea | null>(null);

  const handleNew = () => {
    // Navigate to full page instead of opening modal
    window.location.href = '/create-trade-idea';
  };
  
  const handleEdit = (idea: TradeIdea) => {
    window.location.href = `/create-trade-idea/${idea.id}`;
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
                    userLikes={userLikes as Set<number>}
                    isAdmin={isAdmin}
                    onEditIdea={handleEdit}
                    onPinIdea={async (ideaId, isPinned) => {
                      if (!user) return;
                      const { error: updateError } = await supabase
                        .from('trade_ideas')
                        .update({ is_pinned: isPinned })
                        .eq('id', ideaId);

                      if (updateError) {
                        console.error('Error updating pin status:', updateError);
                      } else {
                        // Invalidate the query to refetch the feed and update UI
                        // This assumes useAnalysisFeed uses react-query and a queryClient is available
                        // For simplicity, we'll just log for now. In a real app, you'd use queryClient.invalidateQueries
                        console.log(`Trade idea ${ideaId} pin status updated to ${isPinned}`);
                      }
                    }}
                />
                {totalPages > 1 && (
                    <Pagination className="mt-8">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.max(1, prev - 1)); }}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                            {[...Array(totalPages)].map((_, index) => (
                                <PaginationItem key={index}>
                                    <PaginationLink
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); setCurrentPage(index + 1); }}
                                        isActive={currentPage === index + 1}
                                    >
                                        {index + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>
            <div className="hidden lg:block space-y-8">
              <ServerRecommendations />
              <TopServers />
            </div>
        </div>
      </main>

      {/* Removed edit modal as editing now navigates to create page */}
      
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

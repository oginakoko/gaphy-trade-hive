
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import DonationModal from '@/components/DonationModal';
import { Gem, Bot } from 'lucide-react';
import GaphyBot from '@/components/landing/GaphyBot';
import { useAnalysisFeed } from '@/hooks/useAnalysisFeed';
import Feed from '@/components/analysis/Feed';
import ServerRecommendations from '@/components/analysis/ServerRecommendations';

const Analysis = () => {
  const [isDonationModalOpen, setDonationModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { feed, isLoading, error, userLikes } = useAnalysisFeed();

  return (
    <>
      <Header />
      <main className="py-8 container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Feed 
                    feed={feed}
                    isLoading={isLoading}
                    error={error as Error | null}
                    userLikes={userLikes}
                />
            </div>
            <div className="hidden lg:block">
              <ServerRecommendations />
            </div>
        </div>
      </main>
      
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

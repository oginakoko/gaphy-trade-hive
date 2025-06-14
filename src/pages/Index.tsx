
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import AffiliateLinks from '@/components/AffiliateLinks';
import TradeIdeaCard from '@/components/trade-ideas/TradeIdeaCard';
import { tradeIdeas } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import DonationModal from '@/components/DonationModal';
import { Gem } from 'lucide-react';

const Index = () => {
  const [isDonationModalOpen, setDonationModalOpen] = useState(false);

  return (
    <>
      <Header />
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
        <div className="lg:col-span-2 space-y-8">
          {tradeIdeas.map((idea) => (
            <TradeIdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
        <aside className="space-y-8">
          <AffiliateLinks />
          <div className="glass-card rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Post Your Ad</h3>
            <p className="text-gray-400 mb-4">Reach a dedicated audience of traders and investors.</p>
             <Button className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80">
              Create an Ad
            </Button>
            <p className="text-xs text-gray-500 mt-2">Requires payment and admin approval.</p>
          </div>
        </aside>
      </main>
      
      <Button 
        onClick={() => setDonationModalOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-brand-green hover:bg-brand-green/80 text-black shadow-lg shadow-brand-green/30 flex items-center justify-center"
      >
        <Gem size={28} />
      </Button>

      <DonationModal isOpen={isDonationModalOpen} onClose={() => setDonationModalOpen(false)} />
    </>
  );
};

export default Index;


import React, { useState } from 'react';
import { donationWallets, mpesaDetails } from '@/data/mockData';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
  const [copiedAddress, setCopiedAddress] = useState('');

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-md border border-brand-green/20 shadow-2xl shadow-brand-green/10">
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Support The Hive</h2>
            <p className="text-gray-400 mt-2">Your donations help keep the community running.</p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-brand-green mb-3">Crypto Donations</h3>
            <div className="space-y-2">
              {donationWallets.map((wallet) => (
                <div key={wallet.name} className="bg-brand-gray-200/50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-300">{wallet.name}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-xs text-brand-green break-all">{wallet.address}</p>
                    <button onClick={() => handleCopy(wallet.address)} className="text-gray-400 hover:text-white flex-shrink-0">
                      {copiedAddress === wallet.address ? <Check size={16} className="text-brand-green" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-brand-green mb-3">M-Pesa</h3>
            <div className="bg-brand-gray-200/50 p-4 rounded-lg text-center">
                <p className="text-gray-300">Paybill / Till Number:</p>
                <p className="text-2xl font-bold text-white tracking-widest my-1">{mpesaDetails.till}</p>
                <Button className="mt-2 w-full bg-brand-green text-black font-bold hover:bg-brand-green/80">
                  Donate with M-Pesa
                </Button>
                <p className="text-xs text-gray-500 mt-2">STK Push will be initiated. Requires Safaricom Daraja API integration.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DonationModal;

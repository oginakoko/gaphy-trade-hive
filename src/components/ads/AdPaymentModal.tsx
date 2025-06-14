
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ad } from '@/types';
import { donationWallets, mpesaDetails } from '@/data/mockData';
import { Copy, Check, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface AdPaymentModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdPaymentModal = ({ ad, isOpen, onClose }: AdPaymentModalProps) => {
  const [copiedAddress, setCopiedAddress] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 2000);
  };
  
  const updateStatusMutation = useMutation({
    mutationFn: async () => {
        if (!ad) throw new Error("Ad not found.");
        const { data, error } = await supabase.functions.invoke('update-ad-status', {
            body: { adId: ad.id, status: 'pending_approval' },
        })
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        toast({ title: "Payment Confirmed", description: "Your ad has been submitted for approval." });
        queryClient.invalidateQueries({ queryKey: ['ads'] });
        onClose();
        navigate('/');
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (!ad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-card border-brand-green/20">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Complete Ad Payment</DialogTitle>
          <DialogDescription className="text-gray-400">
            To activate your ad "{ad.title}", please send a payment of ${ad.cost?.toFixed(2)}.
            Once paid, click the confirmation button below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-brand-green mb-3">Crypto Payments</h3>
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
          
          <div>
            <h3 className="text-lg font-semibold text-brand-green mb-3">M-Pesa</h3>
            <div className="bg-brand-gray-200/50 p-4 rounded-lg text-center">
                <p className="text-gray-300">Till Number:</p>
                <p className="text-2xl font-bold text-white tracking-widest my-1">{mpesaDetails.till}</p>
                 <p className="text-xs text-gray-500 mt-2">Use Ad ID <span className="font-bold text-gray-300">#{ad.id}</span> as the account number.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={() => updateStatusMutation.mutate()} 
            disabled={updateStatusMutation.isPending}
            className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80"
          >
            {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I Have Paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdPaymentModal;

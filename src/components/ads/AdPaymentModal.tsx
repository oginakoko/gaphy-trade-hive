
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ad } from '@/types';
import { donationWallets, mpesaDetails } from '@/data/mockData';
import { Copy, Check, Loader2, X, Bitcoin } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/useAuth';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface AdPaymentModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
}

type Wallet = typeof donationWallets[0];

const AdPaymentModal = ({ ad, isOpen, onClose }: AdPaymentModalProps) => {
  const [copiedAddress, setCopiedAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const { user } = useAuth();
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
        handleClose();
        navigate('/');
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const stkPushMutation = useMutation({
    mutationFn: async () => {
        if (!ad) throw new Error("Ad not found.");
        if (!user) throw new Error("You must be logged in.");
        if (!phoneNumber) throw new Error("Please enter your M-Pesa phone number.");
        if (!/^(254)\d{9}$/.test(phoneNumber)) throw new Error("Phone number must be in the format 254xxxxxxxxx.");

        const { data, error } = await supabase.functions.invoke('initiate-stk-push', {
            body: { 
                amount: ad.cost, 
                phone: phoneNumber, 
                adId: ad.id,
                userId: user.id,
                type: 'ad_payment'
            },
        })
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        toast({ title: "Request Sent!", description: "Please check your phone to complete the payment by entering your M-Pesa PIN." });
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleClose = () => {
    stkPushMutation.reset();
    updateStatusMutation.reset();
    setSelectedWallet(null);
    onClose();
  };

  if (!ad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card border-brand-green/20">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Complete Ad Payment</DialogTitle>
          <DialogDescription className="text-gray-400">
            To activate your ad "{ad.title}", please send a payment of ${ad.cost?.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={24} />
        </button>
        
        <div className="py-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-brand-green mb-3">M-Pesa (STK Push)</h3>
            <div className="bg-brand-gray-200/50 p-4 rounded-lg space-y-3">
                <p className="text-center text-gray-300">Pay <span className="font-bold text-white">KSH {(ad.cost * 125).toFixed(2)}</span> to Paybill <span className="font-bold text-white">{mpesaDetails.paybill}</span></p>
                <Input 
                    type="tel"
                    placeholder="254xxxxxxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-brand-gray-100/50 border-brand-green/30"
                />
                 <Button 
                    onClick={() => stkPushMutation.mutate()} 
                    disabled={stkPushMutation.isPending}
                    className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80"
                  >
                    {stkPushMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay with M-Pesa
                  </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-brand-green mb-3">Crypto Payments</h3>
             <p className="text-gray-400 text-sm mb-4 text-center">Select a currency to see the deposit address.</p>
            <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap mb-4">
              {donationWallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => setSelectedWallet(wallet === selectedWallet ? null : wallet)}
                  className={cn(
                    "h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-all duration-300 font-bold",
                    selectedWallet?.name === wallet.name
                      ? 'bg-brand-green text-black scale-110'
                      : 'bg-brand-gray-200/50 text-white hover:bg-brand-gray-200/80'
                  )}
                  title={wallet.name}
                >
                  {wallet.name === 'BTC' ? <Bitcoin size={28} /> : wallet.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {selectedWallet && (
              <div className="bg-brand-gray-200/50 p-4 rounded-lg text-center animate-fade-in">
                 <div className="flex justify-center mb-3">
                    <div className="p-2 bg-white rounded-lg">
                        <QRCode value={selectedWallet.address} size={128} bgColor="#FFFFFF" fgColor="#000000" />
                    </div>
                </div>
                <div className="relative bg-brand-gray-100/50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-300 mb-1">{selectedWallet.name} Address</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-brand-green break-all pr-8">{selectedWallet.address}</p>
                    <button onClick={() => handleCopy(selectedWallet.address)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white flex-shrink-0">
                      {copiedAddress === selectedWallet.address ? <Check size={16} className="text-brand-green" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="w-full space-y-2">
            <p className="text-center text-xs text-gray-400">For crypto payments only: After paying, click below.</p>
            <Button 
              onClick={() => updateStatusMutation.mutate()} 
              disabled={updateStatusMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {updateStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              I Have Paid (Crypto)
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdPaymentModal;

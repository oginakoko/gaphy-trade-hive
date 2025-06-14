
import React, { useState } from 'react';
import { donationWallets, mpesaDetails } from '@/data/mockData';
import { X, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from './ui/input';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from './ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
  const [copiedAddress, setCopiedAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('10');
  const { user } = useAuth();

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(''), 2000);
  };

  const stkPushMutation = useMutation({
    mutationFn: async () => {
        if (!amount || Number(amount) <= 0) throw new Error("Please enter a valid amount.");
        if (!phoneNumber) throw new Error("Please enter your M-Pesa phone number.");
        if (!/^(254)\d{9}$/.test(phoneNumber)) throw new Error("Phone number must be in the format 254xxxxxxxxx.");

        const { data, error } = await supabase.functions.invoke('initiate-stk-push', {
            body: {
                amount: Number(amount),
                phone: phoneNumber,
                userId: user?.id,
                type: 'donation'
            },
        })
        if (error) throw error;
        return data;
    },
    onSuccess: () => {
        toast({ title: "Request Sent!", description: "Please check your phone to complete the payment by entering your M-Pesa PIN." });
        onClose();
    },
    onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleClose = () => {
    stkPushMutation.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-md border border-brand-green/20 shadow-2xl shadow-brand-green/10">
        <div className="p-6 relative">
          <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Support The Hive</h2>
            <p className="text-gray-400 mt-2">Your donations help keep the community running.</p>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-brand-green mb-3">M-Pesa Donation</h3>
            <div className="bg-brand-gray-200/50 p-4 rounded-lg space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <Input 
                        type="number"
                        placeholder="Amount (KES)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-brand-gray-100/50 border-brand-green/30"
                    />
                    <Input 
                        type="tel"
                        placeholder="254xxxxxxxxx"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-brand-gray-100/50 border-brand-green/30"
                    />
                 </div>
                <Button 
                    onClick={() => stkPushMutation.mutate()} 
                    disabled={stkPushMutation.isPending}
                    className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80"
                  >
                    {stkPushMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Donate with M-Pesa
                  </Button>
                {stkPushMutation.isError && (
                    <div className="mt-4 border-t border-brand-green/20 pt-4 text-center text-gray-300">
                        <p className="text-sm">STK Push failed. You can donate manually using our Paybill:</p>
                        <div className="mt-2 bg-brand-gray-100/50 p-3 rounded-lg inline-block text-left">
                            <p>Paybill: <span className="font-bold text-brand-green">{mpesaDetails.paybill}</span></p>
                            <p>Account No: <span className="font-bold text-brand-green">{mpesaDetails.account}</span></p>
                        </div>
                    </div>
                )}
            </div>
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

        </div>
      </div>
    </div>
  );
};

export default DonationModal;


import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Ad } from '@/types';
import ProofUpload from './payment/ProofUpload';
import PaymentOptions from './payment/PaymentOptions';

interface AdPaymentModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
}

const AdPaymentModal = ({ ad, isOpen, onClose }: AdPaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'mpesa' | null>(null);
  
  const handleClose = () => {
    setPaymentMethod(null);
    onClose();
  };

  if (!ad) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card border-brand-green/20">
        {paymentMethod ? (
            <ProofUpload 
                ad={ad} 
                paymentMethod={paymentMethod}
                onBack={() => setPaymentMethod(null)}
                onSuccess={handleClose}
            />
        ) : (
            <PaymentOptions 
                ad={ad}
                onSetPaymentMethod={setPaymentMethod}
                onClose={handleClose}
            />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdPaymentModal;

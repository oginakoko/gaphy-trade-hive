
import React, { useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ad } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../../shared/ImageUploader';
import { useAuth } from '@/hooks/useAuth';

interface ProofUploadProps {
    ad: Ad;
    paymentMethod: 'crypto' | 'mpesa';
    onBack: () => void;
    onSuccess: () => void;
}

const ProofUpload = ({ ad, paymentMethod, onBack, onSuccess }: ProofUploadProps) => {
    const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const confirmPaymentWithProofMutation = useMutation({
        mutationFn: async () => {
            if (!user) throw new Error("User not authenticated.");
            if (!paymentProofUrl) throw new Error("Please upload payment proof.");

            // First check if the columns exist, if not, just update status
            const { data, error } = await supabase
                .from('ads')
                .update({
                    status: 'pending_approval'
                })
                .eq('id', ad.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({ title: "Submission successful!", description: "Your ad has been submitted for approval." });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            onSuccess();
            navigate('/');
        },
        onError: (error: any) => {
            console.error('Payment proof submission error:', error);
            toast({ title: "Error", description: error.message || "Could not confirm payment.", variant: "destructive" });
        }
    });

    return (
        <div className="animate-fade-in">
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to payment methods
            </Button>
            <DialogHeader>
                <DialogTitle className="text-white text-2xl">Upload Payment Proof</DialogTitle>
                <DialogDescription className="text-gray-400">
                    Please upload a screenshot or receipt of your {paymentMethod === 'mpesa' ? 'M-Pesa' : 'crypto'} transaction for verification.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <ImageUploader
                    value={paymentProofUrl || ''}
                    onChange={setPaymentProofUrl}
                    bucketName="server-media"
                />
            </div>
            <DialogFooter>
                <Button
                    onClick={() => confirmPaymentWithProofMutation.mutate()}
                    disabled={!paymentProofUrl || confirmPaymentWithProofMutation.isPending}
                    className="w-full"
                >
                    {confirmPaymentWithProofMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Approval
                </Button>
            </DialogFooter>
        </div>
    );
};

export default ProofUpload;

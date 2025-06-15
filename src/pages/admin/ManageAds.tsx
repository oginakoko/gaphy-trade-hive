import Header from '@/components/layout/Header';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FunctionsError } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Ad } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowLeft, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const fetchAds = async (): Promise<Ad[]> => {
    const { data, error } = await supabase
        .from('ads')
        .select('*, profiles(username), payment_proof_url, payment_method')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as Ad[];
};

const ManageAdsPage = () => {
    const queryClient = useQueryClient();
    const { data: ads, isLoading, error } = useQuery({ queryKey: ['ads'], queryFn: fetchAds });
    const navigate = useNavigate();

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number, status: Ad['status'] }) => {
            // Call the edge function instead of updating the DB directly
            const { data, error } = await supabase.functions.invoke('update-ad-status', {
                body: { adId: id, status },
            })
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Ad status updated." });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
        },
        onError: (error: Error) => {
            let message = 'An unexpected error occurred.';
            if (error instanceof FunctionsError) {
                const functionError = error.context?.error;
                if (functionError?.message) {
                    message = functionError.message;
                } else if (error.message.includes("fetch")) {
                    message = "Could not connect to the server. Please check the browser console for more details.";
                } else {
                    message = error.message;
                }
                console.error("FunctionsError context:", error.context);
            } else {
                message = error.message;
            }
            toast({ title: "Error", description: message, variant: "destructive" });
            console.error("Full error from mutation:", error);
        }
    });

    const handleUpdateStatus = (id: number, status: Ad['status']) => {
        updateStatusMutation.mutate({ id, status });
    };

    return (
        <>
            <Header />
            <div className="py-8 animate-fade-in-up container mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-4xl font-bold text-white">Manage Ads</h1>
                </div>
                <div className="glass-card p-0 overflow-hidden">
                    {isLoading && <p className="text-center text-gray-400 p-8">Loading ads...</p>}
                    {error && <p className="text-center text-red-500 p-8">Error: {(error as Error).message}</p>}
                    {ads && (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-brand-gray-200/50 hover:bg-transparent">
                                    <TableHead className="text-white">Title</TableHead>
                                    <TableHead className="text-white">User</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-white text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ads.map((ad: any) => (
                                    <TableRow key={ad.id} className="border-b-brand-gray-200/20 hover:bg-brand-gray-200/10">
                                        <TableCell className="font-medium text-white">{ad.title}</TableCell>
                                        <TableCell className="text-gray-400">{ad.profiles?.username || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                ad.status === 'approved' ? 'default' :
                                                ad.status === 'rejected' ? 'destructive' :
                                                ad.status === 'pending_approval' ? 'secondary' :
                                                ad.status === 'pending_payment' ? 'outline' :
                                                'outline' // for pending_payment
                                            } className={cn({
                                                'bg-green-600 text-white': ad.status === 'approved',
                                                'text-yellow-400 border-yellow-400': ad.status === 'pending_payment'
                                            })}>
                                                {ad.status.replace(/_/g, ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {ad.status === 'pending_approval' && (
                                                <div className="flex gap-2 justify-end items-center">
                                                     {ad.payment_proof_url && (
                                                        <Button variant="outline" size="sm" onClick={() => window.open(ad.payment_proof_url, '_blank')}>
                                                            <Eye size={16} className="mr-2" />
                                                            View Proof
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="text-green-500 hover:text-green-400" onClick={() => handleUpdateStatus(ad.id, 'approved')} disabled={updateStatusMutation.isPending}>
                                                        <CheckCircle size={16} />
                                                        Approve
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => handleUpdateStatus(ad.id, 'rejected')} disabled={updateStatusMutation.isPending}>
                                                        <XCircle size={16} />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {ads?.length === 0 && !isLoading && <p className="text-center text-gray-400 p-8">No ads found.</p>}
                </div>
            </div>
        </>
    );
};

export default ManageAdsPage;

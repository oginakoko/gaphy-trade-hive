
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DonationTransaction {
    id: number;
    created_at: string;
    amount: number;
    status: 'success' | 'failed' | 'pending';
    phone_number: string;
    mpesa_receipt_number: string | null;
    profiles: {
        username: string;
    } | null;
}

const fetchDonations = async (): Promise<DonationTransaction[]> => {
    const { data, error } = await supabase
        .from('mpesa_transactions')
        .select('*, profiles(username)')
        .eq('type', 'donation')
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as DonationTransaction[];
};

const DonationsLog = () => {
    const navigate = useNavigate();
    const { data: donations, isLoading, error } = useQuery({ queryKey: ['donationsLog'], queryFn: fetchDonations });

    return (
        <>
            <Header />
            <div className="py-8 animate-fade-in-up container mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-4xl font-bold text-white">Donations Log</h1>
                </div>

                <div className="glass-card p-0 overflow-hidden">
                    {isLoading && <p className="text-center text-gray-400 p-8">Loading donations...</p>}
                    {error && <p className="text-center text-red-500 p-8">Error: {(error as Error).message}</p>}
                    {donations && (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-brand-gray-200/50 hover:bg-transparent">
                                    <TableHead className="text-white">User</TableHead>
                                    <TableHead className="text-white">Amount (KES)</TableHead>
                                    <TableHead className="text-white">Phone</TableHead>
                                    <TableHead className="text-white">Receipt</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-white">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donations.map((donation) => (
                                    <TableRow key={donation.id} className="border-b-brand-gray-200/20 hover:bg-brand-gray-200/10">
                                        <TableCell className="font-medium text-white">{donation.profiles?.username || 'N/A'}</TableCell>
                                        <TableCell className="text-gray-400">{donation.amount}</TableCell>
                                        <TableCell className="text-gray-400">{donation.phone_number}</TableCell>
                                        <TableCell className="text-gray-400">{donation.mpesa_receipt_number || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                donation.status === 'success' ? 'default' :
                                                donation.status === 'failed' ? 'destructive' :
                                                'secondary'
                                            } className={cn({
                                                'bg-green-600 text-white': donation.status === 'success',
                                            })}>
                                                {donation.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-400">{new Date(donation.created_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {donations?.length === 0 && !isLoading && <p className="text-center text-gray-400 p-8">No donations found.</p>}
                </div>
            </div>
        </>
    );
};

export default DonationsLog;

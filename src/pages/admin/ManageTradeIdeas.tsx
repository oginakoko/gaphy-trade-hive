
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from 'lucide-react';
import TradeIdeaForm from '@/components/admin/TradeIdeaForm';

type TradeIdea = {
  id: string;
  created_at: string;
  title: string;
  instrument: string;
  breakdown: string;
  image_url: string | null;
  tags: string[] | null;
  profile_id: string | null;
};

const fetchTradeIdeas = async (): Promise<TradeIdea[]> => {
    const { data, error } = await supabase
        .from('trade_ideas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    return data as TradeIdea[];
};

const ManageTradeIdeasPage = () => {
    const [isFormOpen, setFormOpen] = useState(false);
    const { data: tradeIdeas, isLoading, error } = useQuery({
        queryKey: ['tradeIdeas'], 
        queryFn: fetchTradeIdeas
    });

    return (
        <>
            <Header />
            <div className="py-8 animate-fade-in-up container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-white">Manage Trade Ideas</h1>
                    <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-brand-green text-black font-bold hover:bg-brand-green/80 flex items-center gap-2">
                                <PlusCircle size={20} />
                                New Trade Idea
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="glass-card border-brand-green/20">
                            <DialogHeader>
                                <DialogTitle className="text-white">Create a New Trade Idea</DialogTitle>
                            </DialogHeader>
                            <TradeIdeaForm setOpen={setFormOpen} />
                        </DialogContent>
                    </Dialog>
                </div>
                
                <div className="glass-card p-0 overflow-hidden">
                    {isLoading && <p className="text-center text-gray-400 p-8">Loading trade ideas...</p>}
                    {error && <p className="text-center text-red-500 p-8">Error: {(error as Error).message}</p>}
                    {tradeIdeas && (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-brand-gray-200/50 hover:bg-transparent">
                                    <TableHead className="text-white">Title</TableHead>
                                    <TableHead className="text-white">Instrument</TableHead>
                                    <TableHead className="text-white">Created At</TableHead>
                                    <TableHead className="text-white text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tradeIdeas.map((idea) => (
                                    <TableRow key={idea.id} className="border-b-brand-gray-200/20 hover:bg-brand-gray-200/10">
                                        <TableCell className="font-medium text-white">{idea.title}</TableCell>
                                        <TableCell className="text-brand-green">{idea.instrument}</TableCell>
                                        <TableCell className="text-gray-400">{new Date(idea.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Edit</Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400">Delete</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {tradeIdeas?.length === 0 && !isLoading && <p className="text-center text-gray-400 p-8">No trade ideas found. Add one to get started!</p>}
                </div>
            </div>
        </>
    );
};

export default ManageTradeIdeasPage;

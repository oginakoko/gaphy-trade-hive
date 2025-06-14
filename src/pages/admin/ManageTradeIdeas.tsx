
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';
import TradeIdeaForm from '@/components/admin/TradeIdeaForm';
import { TradeIdea } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';


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
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState<TradeIdea | null>(null);
    const [ideaToDelete, setIdeaToDelete] = useState<TradeIdea | null>(null);
    const navigate = useNavigate();

    const { data: tradeIdeas, isLoading, error } = useQuery({
        queryKey: ['tradeIdeas'], 
        queryFn: fetchTradeIdeas
    });

    const deleteMutation = useMutation({
        mutationFn: async (ideaId: string) => {
            if (!user || user.id !== '73938002-b3f8-4444-ad32-6a46cbf8e075') {
                throw new Error("You are not authorized to perform this action.");
            }
            const { error } = await supabase.from('trade_ideas').delete().eq('id', ideaId);
            if (error) {
                throw new Error(error.message);
            }
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Trade idea deleted." });
            queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
            setIdeaToDelete(null);
        },
        onError: (error: Error) => {
            toast({ title: "Error deleting idea", description: error.message, variant: "destructive" });
            setIdeaToDelete(null);
        }
    });

    const handleNew = () => {
        setEditingIdea(null);
        setFormOpen(true);
    };

    const handleEdit = (idea: TradeIdea) => {
        setEditingIdea(idea);
        setFormOpen(true);
    };
    
    const handleFormOpenChange = (open: boolean) => {
        setFormOpen(open);
        if (!open) {
            setEditingIdea(null);
        }
    };

    return (
        <>
            <Header />
            <div className="py-8 animate-fade-in-up container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <h1 className="text-4xl font-bold text-white">Manage Trade Ideas</h1>
                    </div>
                    <Button onClick={handleNew} className="bg-brand-green text-black font-bold hover:bg-brand-green/80 flex items-center gap-2">
                        <PlusCircle size={20} />
                        New Trade Idea
                    </Button>
                </div>

                <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
                    <DialogContent className="glass-card border-brand-green/20 sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-white">{editingIdea ? 'Edit' : 'Create a New'} Trade Idea</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] -mr-6 pr-6">
                            <TradeIdeaForm setOpen={setFormOpen} initialData={editingIdea} />
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
                
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
                                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => handleEdit(idea)}>
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => setIdeaToDelete(idea)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                     {tradeIdeas?.length === 0 && !isLoading && <p className="text-center text-gray-400 p-8">No trade ideas found. Add one to get started!</p>}
                </div>
            </div>

            <AlertDialog open={!!ideaToDelete} onOpenChange={(open) => !open && setIdeaToDelete(null)}>
                <AlertDialogContent className="glass-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This action cannot be undone. This will permanently delete the trade idea titled "{ideaToDelete?.title}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-white" onClick={() => setIdeaToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700 text-white" 
                            onClick={() => ideaToDelete && deleteMutation.mutate(ideaToDelete.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Yes, delete it"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ManageTradeIdeasPage;

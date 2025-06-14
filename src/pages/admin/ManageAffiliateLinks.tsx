
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
import { PlusCircle, Edit, Trash2, ArrowLeft, icons, Link as LinkIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import AffiliateLinkForm from '@/components/admin/AffiliateLinkForm';
import { ScrollArea } from '@/components/ui/scroll-area';

// Defined locally as types.ts is read-only
interface AffiliateLink {
  id: string;
  created_at: string;
  title: string;
  description: string;
  url: string;
  icon: string;
}

const fetchAffiliateLinks = async (): Promise<AffiliateLink[]> => {
    const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }
    return data as AffiliateLink[];
};

const ManageAffiliateLinks = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<AffiliateLink | null>(null);
    const [linkToDelete, setLinkToDelete] = useState<AffiliateLink | null>(null);

    const { data: links, isLoading, error } = useQuery({
        queryKey: ['affiliateLinks'],
        queryFn: fetchAffiliateLinks,
    });

    const deleteMutation = useMutation({
        mutationFn: async (linkId: string) => {
            const { error } = await supabase.from('affiliate_links').delete().eq('id', linkId);
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Affiliate link deleted." });
            queryClient.invalidateQueries({ queryKey: ['affiliateLinks'] });
            setLinkToDelete(null);
        },
        onError: (error: Error) => {
            toast({ title: "Error deleting link", description: error.message, variant: "destructive" });
            setLinkToDelete(null);
        },
    });

    const handleNew = () => {
        setEditingLink(null);
        setFormOpen(true);
    };

    const handleEdit = (link: AffiliateLink) => {
        setEditingLink(link);
        setFormOpen(true);
    };
    
    const handleFormOpenChange = (open: boolean) => {
        setFormOpen(open);
        if (!open) {
            setEditingLink(null);
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
                        <h1 className="text-4xl font-bold text-white">Manage Affiliate Links</h1>
                    </div>
                    <Button onClick={handleNew} className="bg-brand-green text-black font-bold hover:bg-brand-green/80 flex items-center gap-2">
                        <PlusCircle size={20} />
                        New Link
                    </Button>
                </div>

                <Dialog open={isFormOpen} onOpenChange={handleFormOpenChange}>
                    <DialogContent className="glass-card border-brand-green/20 sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="text-white">{editingLink ? 'Edit' : 'Create a New'} Affiliate Link</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] -mr-6 pr-6">
                           <AffiliateLinkForm setOpen={setFormOpen} initialData={editingLink} />
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                <div className="glass-card p-0 overflow-hidden">
                    {isLoading && <p className="text-center text-gray-400 p-8">Loading links...</p>}
                    {error && <p className="text-center text-red-500 p-8">Error: {(error as Error).message}. Make sure you have created the 'affiliate_links' table in Supabase.</p>}
                    {links && (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b-brand-gray-200/50 hover:bg-transparent">
                                    <TableHead className="text-white">Icon</TableHead>
                                    <TableHead className="text-white">Title</TableHead>
                                    <TableHead className="text-white">URL</TableHead>
                                    <TableHead className="text-white text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {links.map((link) => {
                                    const LucideIcon = icons[link.icon as keyof typeof icons] || LinkIcon;
                                    return (
                                        <TableRow key={link.id} className="border-b-brand-gray-200/20 hover:bg-brand-gray-200/10">
                                            <TableCell>
                                                <LucideIcon className="h-5 w-5 text-gray-400" />
                                            </TableCell>
                                            <TableCell className="font-medium text-white">{link.title}</TableCell>
                                            <TableCell className="text-gray-400 truncate max-w-xs"><a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.url}</a></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => handleEdit(link)}>
                                                    <Edit size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => setLinkToDelete(link)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                     {links?.length === 0 && !isLoading && <p className="text-center text-gray-400 p-8">No affiliate links found. Add one to get started!</p>}
                </div>
            </div>

            <AlertDialog open={!!linkToDelete} onOpenChange={(open) => !open && setLinkToDelete(null)}>
                <AlertDialogContent className="glass-card">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                            This action cannot be undone. This will permanently delete the link titled "{linkToDelete?.title}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-white" onClick={() => setLinkToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700 text-white" 
                            onClick={() => linkToDelete && deleteMutation.mutate(linkToDelete.id)}
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

export default ManageAffiliateLinks;

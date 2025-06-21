import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Profile } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const ManageUsers = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const adminId = '73938002-b3f8-4444-ad32-6a46cbf8e075';

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async (): Promise<Profile[]> => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw new Error(error.message);
            return data || [];
        },
    });

    const { mutate: updateUserBanStatus, isPending: isUpdating } = useMutation({
        mutationFn: async ({ userId, is_banned }: { userId: string, is_banned: boolean }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ is_banned })
                .eq('id', userId);
            
            if (error) throw new Error(error.message);
        },
        onSuccess: (_, variables) => {
            toast.success(`User has been ${variables.is_banned ? 'banned' : 'unbanned'}.`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: (error) => {
            toast.error(`Failed to update user: ${error.message}`);
        },
    });

    const getInitials = (name?: string | null) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
    }

    return (
        <>
            <Header />
            <div className="py-8 animate-fade-in-up container mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-4xl font-bold text-white">Manage Users</h1>
                </div>
                <div className="glass-card p-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400">
                            <p>Failed to load users: {error.message}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar_url || ''} />
                                                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-white">{user.username || 'N/A'}</p>
                                                    <p className="text-sm text-gray-400">{user.id}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.id === adminId ? (
                                                <Badge variant="outline">Admin</Badge>
                                            ) : user.is_banned ? (
                                                <Badge variant="destructive">Banned</Badge>
                                            ) : (
                                                <Badge variant="secondary">Active</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {user.id !== adminId && (
                                                <Button
                                                    variant={user.is_banned ? 'secondary' : 'destructive'}
                                                    size="sm"
                                                    onClick={() => updateUserBanStatus({ userId: user.id, is_banned: !user.is_banned })}
                                                    disabled={isUpdating}
                                                >
                                                    {isUpdating ? <Loader2 className="animate-spin" /> : user.is_banned ? <CheckCircle /> : <Ban />}
                                                    <span>{user.is_banned ? 'Unban' : 'Ban'}</span>
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </>
    );
};

export default ManageUsers;

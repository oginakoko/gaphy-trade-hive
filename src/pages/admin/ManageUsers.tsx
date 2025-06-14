
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ban, Shield } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const ManageUsers = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data as Profile[];
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Profile, 'role' | 'is_banned'>>) => {
            const { error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] }); // Invalidate current user profile as well
            toast({ title: "User updated successfully!" });
        },
        onError: (error: Error) => {
            toast({ title: "Error updating user", description: error.message, variant: 'destructive' });
        }
    });

    const handleToggleAdmin = (user: Profile) => {
        const newRole = (user.role || 'user') === 'admin' ? 'user' : 'admin';
        updateUserMutation.mutate({ id: user.id, role: newRole });
    };

    const handleToggleBan = (user: Profile) => {
        updateUserMutation.mutate({ id: user.id, is_banned: !user.is_banned });
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
                    <h1 className="text-4xl font-bold text-white">Manage Users</h1>
                </div>
                <div className="glass-card p-6">
                    {isLoading && <p className="text-white text-center">Loading users...</p>}
                    {error && <p className="text-red-500 text-center">Failed to load users: {error.message}</p>}
                    {users && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-white">User</TableHead>
                                    <TableHead className="text-white">Role</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-white text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(user => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar_url || ''} />
                                                    <AvatarFallback>{user.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-white">{user.username || 'No username'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={(user.role || 'user') === 'admin' ? 'default' : 'secondary'} className={(user.role || 'user') === 'admin' ? 'bg-brand-green text-black' : ''}>
                                                {user.role || 'user'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.is_banned ? 'destructive' : 'secondary'}>
                                                {user.is_banned ? 'Banned' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleToggleAdmin(user)}
                                                    disabled={updateUserMutation.isPending || user.id === currentUser?.id}
                                                >
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    {(user.role || 'user') === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                                </Button>
                                                <Button
                                                    variant={user.is_banned ? 'secondary' : 'destructive'}
                                                    size="sm"
                                                    onClick={() => handleToggleBan(user)}
                                                    disabled={updateUserMutation.isPending || user.id === currentUser?.id}
                                                >
                                                    <Ban className="mr-2 h-4 w-4" />
                                                    {user.is_banned ? 'Unban' : 'Ban'}
                                                </Button>
                                            </div>
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

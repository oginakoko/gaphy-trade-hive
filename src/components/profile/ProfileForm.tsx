
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import AvatarUploader from "./AvatarUploader";
import { useEffect } from "react";

const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be at most 50 characters").nullable(),
  avatar_url: z.string().url("Must be a valid URL").nullable().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileForm = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116: single row not found
                console.error("Error fetching profile:", error.message);
                return null;
            }
            return data as Profile | null;
        },
        enabled: !!user,
    });
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            username: '',
            avatar_url: '',
        }
    });
    
    useEffect(() => {
        if (profile) {
            form.reset({
                username: profile.username,
                avatar_url: profile.avatar_url,
            });
        }
    }, [profile, form]);

    const updateProfileMutation = useMutation({
        mutationFn: async (values: ProfileFormValues) => {
            if (!user) throw new Error("User not found");

            const { error } = await supabase
                .from('profiles')
                .upsert({ 
                    id: user.id, 
                    username: values.username,
                    avatar_url: values.avatar_url,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Success", description: "Profile updated successfully." });
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['trade_ideas'] });
            queryClient.invalidateQueries({ queryKey: ['trade-idea-detail'] });
        },
        onError: (error: any) => {
            toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
        }
    });

    const onSubmit = (values: ProfileFormValues) => {
        updateProfileMutation.mutate(values);
    };

    if (isLoadingProfile) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="avatar_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Avatar</FormLabel>
                            <FormControl>
                                <AvatarUploader 
                                    value={field.value || undefined}
                                    onChange={field.onChange}
                                    username={form.getValues('username')}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="Your cool username" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Profile
                </Button>
            </form>
        </Form>
    );
};

export default ProfileForm;

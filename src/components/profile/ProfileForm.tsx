import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
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
import { useProfile } from "@/hooks/useProfile";

const profileFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be at most 50 characters").nullable(),
  avatar_url: z.string().url("Must be a valid URL").nullable().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileForm = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: profile, isLoading: isLoadingProfile } = useProfile();
    
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

            // Try update first, fallback to insert if not found
            const { error: updateError, data: updateData } = await supabase
                .from('profiles')
                .update({
                    username: values.username,
                    avatar_url: values.avatar_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)
                .select();

            if (updateError) {
                // If update fails due to RLS or not found, try insert
                const { error: insertError, data: insertData } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        username: values.username,
                        avatar_url: values.avatar_url,
                        updated_at: new Date().toISOString(),
                        email: user.email ?? '',
                        created_at: new Date().toISOString(),
                    })
                    .select();
                if (insertError) throw insertError;
                if (!insertData || insertData.length === 0) throw new Error('Profile insert failed. RLS or schema issue.');
                return insertData[0];
            }
            if (!updateData || updateData.length === 0) throw new Error('No profile row was updated. RLS may be blocking this action.');
            return updateData[0];
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
        console.error('--- Profile form onSubmit handler fired ---', values);
        console.log('Submitting profile form:', values);
        updateProfileMutation.mutate(values, {
            onSuccess: (data) => {
                if (!data) {
                    toast({ title: "No changes made", description: "No profile data was changed.", variant: "default" });
                }
            },
            onError: (error: any) => {
                toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
            }
        });
    };

    if (isLoadingProfile) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Form {...form}>
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <AvatarUploader value={form.watch('avatar_url')} onChange={url => form.setValue('avatar_url', url)} />
              <div className="flex-1 w-full">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Username</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-gray-800 border-gray-700 text-white w-full max-w-xs sm:max-w-sm" placeholder="Enter your username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center sm:items-end">
              <Button type="button" className="w-full sm:w-auto bg-brand-green hover:bg-brand-green/90 text-black font-semibold" disabled={form.formState.isSubmitting || updateProfileMutation.isPending} onClick={() => {
                console.warn('--- Profile form button clicked ---');
                console.log('Attempting form.handleSubmit...');
                form.handleSubmit(onSubmit, (errors) => {
                  console.error('--- form.handleSubmit validation errors ---', errors);
                  toast({
                    title: 'Validation Error',
                    description: 'Please fix the errors in the form.',
                    variant: 'destructive',
                  });
                })(); // Immediately invoke the handler returned by handleSubmit
              }}>
                {form.formState.isSubmitting || updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Form>
    );
};

export default ProfileForm;

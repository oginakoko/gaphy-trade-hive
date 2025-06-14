
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../shared/ImageUploader";

const adFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  content: z.string().min(10, "Content must be at least 10 characters").max(500),
  link_url: z.string().url("Must be a valid URL"),
  image_url: z.string().url().nullable(),
});

type AdFormValues = z.infer<typeof adFormSchema>;

export const AdForm = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const form = useForm<AdFormValues>({
        resolver: zodResolver(adFormSchema),
        defaultValues: {
            title: "",
            content: "",
            link_url: "",
            image_url: null,
        },
    });

    const createAdMutation = useMutation({
        mutationFn: async (values: AdFormValues) => {
            if (!user) throw new Error("You must be logged in to create an ad.");

            const { data, error } = await supabase.from('ads').insert({
                ...values,
                user_id: user.id,
            }).select();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({ title: "Ad Submitted!", description: "Your ad has been submitted for approval." });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            navigate('/');
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    function onSubmit(data: AdFormValues) {
        createAdMutation.mutate(data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ad Image</FormLabel>
                            <FormControl>
                                <ImageUploader
                                    value={field.value || undefined}
                                    onChange={field.onChange}
                                    bucketName="ad_images"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ad Title</FormLabel>
                            <FormControl>
                                <Input placeholder="My Awesome Product" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ad Content</FormLabel>
                            <FormControl>
                                <Textarea placeholder="A brief description of what you're advertising." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="link_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link URL</FormLabel>
                            <FormControl>
                                <Input type="url" placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={createAdMutation.isPending}>
                    {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit for Approval
                </Button>
            </form>
        </Form>
    );
};


import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { icons } from 'lucide-react';

interface AffiliateLink {
  id: string;
  created_at: string;
  title: string;
  description: string;
  url: string;
  icon: string;
}

const affiliateLinkSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  url: z.string().url('Please enter a valid URL'),
  icon: z.string().min(1, "Icon name is required.").refine((value) => {
    const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
    return Object.keys(icons).includes(capitalizedValue) || Object.keys(icons).includes(value);
  }, {
      message: 'Invalid icon name. Use PascalCase from lucide-react.',
  }),
});

type AffiliateLinkFormData = z.infer<typeof affiliateLinkSchema>;

interface AffiliateLinkFormProps {
  setOpen: (open: boolean) => void;
  initialData?: AffiliateLink | null;
}

const AffiliateLinkForm: React.FC<AffiliateLinkFormProps> = ({ setOpen, initialData }) => {
    const queryClient = useQueryClient();

    const form = useForm<AffiliateLinkFormData>({
        resolver: zodResolver(affiliateLinkSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            url: initialData?.url || '',
            icon: initialData?.icon || '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: AffiliateLinkFormData) => {
            const transformedValues = {
              ...values,
              icon: values.icon.charAt(0).toUpperCase() + values.icon.slice(1)
            };
            const { data, error } = await supabase
                .from('affiliate_links')
                [initialData ? 'update' : 'insert'](initialData ? { ...transformedValues, id: initialData.id } : transformedValues)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast({
                title: `Successfully ${initialData ? 'updated' : 'created'} affiliate link.`,
            });
            queryClient.invalidateQueries({ queryKey: ['affiliateLinks'] });
            setOpen(false);
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const onSubmit = (values: AffiliateLinkFormData) => {
        mutation.mutate(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Title</FormLabel>
                            <FormControl>
                                <Input placeholder="E.g., Binance" {...field} className="bg-brand-gray-200/10 border-brand-gray-200/20 text-white" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Description</FormLabel>
                            <FormControl>
                                <Input placeholder="E.g., The world's leading crypto exchange" {...field} className="bg-brand-gray-200/10 border-brand-gray-200/20 text-white" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://www.binance.com/" {...field} className="bg-brand-gray-200/10 border-brand-gray-200/20 text-white" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Icon Name</FormLabel>
                            <FormControl>
                                <Input placeholder="E.g., Bitcoin, BarChart (use PascalCase)" {...field} className="bg-brand-gray-200/10 border-brand-gray-200/20 text-white" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-4">
                     <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="mr-2 text-gray-400 hover:text-white">Cancel</Button>
                    <Button type="submit" disabled={mutation.isPending} className="bg-brand-green text-black font-bold hover:bg-brand-green/80">
                        {mutation.isPending ? 'Saving...' : initialData ? 'Save Changes' : 'Create Link'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default AffiliateLinkForm;

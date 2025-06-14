import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { TradeIdea } from '@/types';
import ImageUploader from './ImageUploader';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instrument: z.string().min(1, 'Instrument is required'),
  breakdown: z.string().min(1, 'Breakdown is required'),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tags: z.string().optional(),
});

type TradeIdeaFormValues = z.infer<typeof formSchema>;

interface TradeIdeaFormProps {
  setOpen: (open: boolean) => void;
  initialData?: TradeIdea | null;
}

const TradeIdeaForm = ({ setOpen, initialData }: TradeIdeaFormProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const form = useForm<TradeIdeaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      instrument: initialData?.instrument || '',
      breakdown: initialData?.breakdown || '',
      image_url: initialData?.image_url || '',
      tags: initialData?.tags?.join(', ') || '',
    },
  });

  const isEditing = !!initialData;

  const mutation = useMutation({
    mutationFn: async (ideaData: Omit<TradeIdeaFormValues, 'tags'> & { tags: string[] }) => {
      if (!user || user.id !== '73938002-b3f8-4444-ad32-6a46cbf8e075') {
        throw new Error("You are not authorized to perform this action.");
      }

      const dataToUpsert = {
        ...ideaData,
        image_url: ideaData.image_url || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('trade_ideas')
          .update(dataToUpsert)
          .eq('id', initialData.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('trade_ideas').insert([{
          ...dataToUpsert,
          profile_id: user.id,
        }]);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({ title: 'Success', description: `Trade idea has been ${isEditing ? 'updated' : 'posted'}.` });
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: `Error ${isEditing ? 'updating' : 'posting'} idea`,
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: TradeIdeaFormValues) {
    const tagsArray = values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) ?? [];
    mutation.mutate({ ...values, tags: tagsArray });
  }

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
                <Input placeholder="e.g., BTC Long Opportunity" {...field} className="glass-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instrument"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Instrument</FormLabel>
              <FormControl>
                <Input placeholder="e.g., BTCUSD" {...field} className="glass-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="breakdown"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Breakdown</FormLabel>
              <FormControl>
                <Textarea placeholder="Detailed analysis of the trade idea..." {...field} className="glass-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Chart/Image</FormLabel>
              <FormControl>
                <ImageUploader
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Tags (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., crypto, btc, long" {...field} className="glass-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80" disabled={mutation.isPending}>
          {mutation.isPending ? (isEditing ? 'Updating...' : 'Posting...') : (isEditing ? 'Update Trade Idea' : 'Post Trade Idea')}
        </Button>
      </form>
    </Form>
  );
};

export default TradeIdeaForm;

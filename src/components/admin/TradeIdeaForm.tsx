
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
}

// NOTE: This form currently doesn't associate posts with a user.
// We'll need to add user authentication to link trade ideas to the admin user.

const TradeIdeaForm = ({ setOpen }: TradeIdeaFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<TradeIdeaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      instrument: '',
      breakdown: '',
      image_url: '',
      tags: '',
    },
  });

  const addTradeIdeaMutation = useMutation({
    mutationFn: async (newIdea: Omit<TradeIdeaFormValues, 'tags'> & { tags: string[] }) => {
      // In a real app, you would get the user id from the session.
      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user) throw new Error("You must be logged in to post a trade idea.");
      
      const { error } = await supabase.from('trade_ideas').insert([{
        ...newIdea,
        // profile_id: user.id, // This should be uncommented once auth is set up
      }]);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Trade idea has been posted.' });
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error posting idea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  function onSubmit(values: TradeIdeaFormValues) {
    const tagsArray = values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) ?? [];
    addTradeIdeaMutation.mutate({ ...values, tags: tagsArray });
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
              <FormLabel className="text-white">Chart/Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/chart.png" {...field} className="glass-input" />
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
        <Button type="submit" className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80" disabled={addTradeIdeaMutation.isPending}>
          {addTradeIdeaMutation.isPending ? 'Posting...' : 'Post Trade Idea'}
        </Button>
      </form>
    </Form>
  );
};

export default TradeIdeaForm;

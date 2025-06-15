import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const formSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000, 'Comment must be 1000 characters or less'),
});

interface CommentFormProps {
  tradeIdeaId: string;
}

const CommentForm = ({ tradeIdeaId }: CommentFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error('You must be logged in to comment.');
      
      const { data: tradeIdea, error: ideaError } = await supabase
        .from('trade_ideas')
        .select('user_id')
        .eq('id', tradeIdeaId)
        .single();
        
      if (ideaError || !tradeIdea) throw new Error('Could not find the trade idea to comment on.');

      const { error } = await supabase.from('comments').insert({
        content: values.content,
        trade_idea_id: tradeIdeaId,
        user_id: user.id,
      });

      if (error) throw new Error(error.message);

      if (user.id !== tradeIdea.user_id) {
        await supabase.from('notifications').insert({
          recipient_id: tradeIdea.user_id,
          sender_id: user.id,
          type: 'new_comment',
          reference_id: tradeIdeaId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', tradeIdeaId] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error posting comment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!user) {
    return (
      <div className="glass-card rounded-lg p-4 text-center mt-6 border border-brand-green/20">
        <p className="text-gray-400">
          <Link to="/auth" className="text-brand-green font-bold hover:underline">Sign in</Link> or <Link to="/auth" className="text-brand-green font-bold hover:underline">sign up</Link> to join the conversation.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4 pt-6">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Add your comment..."
                  className="glass-input resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" className="bg-brand-green text-black font-bold hover:bg-brand-green/80" disabled={mutation.isPending}>
            {mutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CommentForm;

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
  FormDescription,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { TradeIdea } from '@/types';
import { MediaItem } from '@/types/media';
import ImageUploader from '@/components/trade-ideas/ImageUploader';
import { useState, useRef, useEffect } from 'react';
import MediaSelector from '@/components/trade-ideas/MediaSelector';
import MediaPreview from '@/components/trade-ideas/MediaPreview';
import InlineMediaRenderer from '@/components/trade-ideas/InlineMediaRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instrument: z.string().min(1, 'Instrument is required'),
  breakdown: z.string().min(1, 'Breakdown is required'),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tags: z.string().optional(),
  status: z.enum(['open', 'closed', 'cancelled']).default('open'),
  entry_price: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().nullable().optional()
  ),
  target_price: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().nullable().optional()
  ),
  stop_loss: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().nullable().optional()
  ),
  risk_reward: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().nullable().optional()
  ),
  sentiment: z.enum(['Bullish', 'Bearish', 'Neutral']).nullable().optional(),
  key_points: z.string().optional(),
  direction: z.enum(['Long', 'Short']).nullable().optional(),
  is_pinned: z.boolean().default(false),
  is_featured: z.boolean().default(false),
});

type TradeIdeaFormValues = z.infer<typeof formSchema>;

interface TradeIdeaFormProps {
  setOpen: (open: boolean) => void;
  initialData?: TradeIdea | null;
}

const TradeIdeaForm = ({ setOpen, initialData }: TradeIdeaFormProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const form = useForm<TradeIdeaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      instrument: initialData?.instrument || '',
      breakdown: initialData?.breakdown ? (Array.isArray(initialData.breakdown) ? initialData.breakdown.join('\n') : initialData.breakdown) : '',
      image_url: initialData?.image_url || '',
      tags: initialData?.tags ? (Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags) : '',
      status: initialData?.status && typeof initialData.status === 'string' && ['open', 'closed', 'cancelled'].includes(initialData.status) ? initialData.status as 'open' | 'closed' | 'cancelled' : 'open',
      entry_price: initialData?.entry_price !== undefined ? (typeof initialData.entry_price === 'string' ? parseFloat(initialData.entry_price) || null : initialData.entry_price) : null,
      target_price: initialData?.target_price !== undefined ? (typeof initialData.target_price === 'string' ? parseFloat(initialData.target_price) || null : initialData.target_price) : null,
      stop_loss: initialData?.stop_loss !== undefined ? (typeof initialData.stop_loss === 'string' ? parseFloat(initialData.stop_loss) || null : initialData.stop_loss) : null,
      risk_reward: initialData?.risk_reward !== undefined ? (typeof initialData.risk_reward === 'string' ? parseFloat(initialData.risk_reward) || null : initialData.risk_reward) : null,
      sentiment: initialData?.sentiment && typeof initialData.sentiment === 'string' && ['Bullish', 'Bearish', 'Neutral'].includes(initialData.sentiment) ? initialData.sentiment as 'Bullish' | 'Bearish' | 'Neutral' : null,
      key_points: initialData?.key_points ? (Array.isArray(initialData.key_points) ? initialData.key_points.join(', ') : initialData.key_points) : '',
      direction: initialData?.direction && typeof initialData.direction === 'string' && ['Long', 'Short'].includes(initialData.direction) ? initialData.direction as 'Long' | 'Short' : null,
      is_pinned: initialData?.is_pinned || false,
      is_featured: false, // Default to false since it may not exist in the type definition
    },
  });

  // Fetch existing media items when editing
  useEffect(() => {
    if (initialData?.id) {
      const fetchMedia = async () => {
        const { data, error } = await supabase
          .from('trade_idea_media')
          .select('*')
          .eq('trade_idea_id', initialData.id)
          .order('position');

        if (!error && data) {
          setMediaItems(data.map(item => ({
            id: item.id.toString(), // Ensure ID is string for consistency
            type: item.media_type as 'image' | 'video' | 'link',
            url: item.url,
            title: item.title || undefined,
            description: item.description || undefined,
            thumbnail_url: item.thumbnail_url || undefined
          })));
          
          // Add media placeholders to breakdown if they don't exist
          const breakdown = form.getValues('breakdown');
          const hasPlaceholders = data.some(item => 
            breakdown.includes(`[MEDIA:${item.id}]`)
          );
          
          if (!hasPlaceholders) {
            let updatedBreakdown = breakdown;
            data.forEach(item => {
              if (!updatedBreakdown.includes(`[MEDIA:${item.id}]`)) {
                updatedBreakdown += `\n\n[MEDIA:${item.id}]\n\n`;
              }
            });
            form.setValue('breakdown', updatedBreakdown.trim());
          }
        }
      };

      fetchMedia();
    }
  }, [initialData, form]);

  const isEditing = !!initialData;

  const handleAddMediaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
    setShowMediaSelector(true);
  };

  const insertMediaPlaceholder = (item: MediaItem) => {
    const uniqueId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mediaPlaceholder = `\n\n[MEDIA:${uniqueId}]\n\n`;
    
    const breakdown = form.getValues('breakdown');
    const newBreakdown = breakdown.slice(0, cursorPosition) + mediaPlaceholder + breakdown.slice(cursorPosition);
    form.setValue('breakdown', newBreakdown);
    
    setMediaItems(prev => [...prev, { ...item, id: uniqueId }]);
    setShowMediaSelector(false);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
    
    const breakdown = form.getValues('breakdown');
    const placeholderRegex = new RegExp(`\\n\\n\\[MEDIA:${id}\\]\\n\\n`, 'g');
    form.setValue('breakdown', breakdown.replace(placeholderRegex, ''));
  };

  const moveMediaItem = (id: string, direction: 'up' | 'down') => {
    setMediaItems(prev => {
      const currentIndex = prev.findIndex(item => item.id === id);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newItems = [...prev];
      [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];
      return newItems;
    });
  };

  const mutation = useMutation({
    mutationFn: async (values: TradeIdeaFormValues) => {
      if (!user) throw new Error('User not authenticated');

      // Admin check - replace with your admin user ID or role check
      if (values.is_featured && user.id !== '73938002-b3f8-4444-ad32-6a46cbf8e075') {
        throw new Error("You are not authorized to feature trade ideas.");
      }
      
      const ideaData = {
        title: values.title,
        instrument: values.instrument,
        breakdown: values.breakdown,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        image_url: values.image_url || null,
        is_pinned: values.is_pinned,
        // AI-computed fields are excluded from manual update
        // status, entry_price, target_price, stop_loss, risk_reward, sentiment, key_points, direction are computed by AI
        // is_featured is excluded to prevent database errors
      };
      if (ideaData.breakdown) {
        // Convert breakdown to an array of non-empty lines for database storage
        ideaData.breakdown = ideaData.breakdown.split('\n').map(line => line.trim()).filter(Boolean);
      }

      let tradeIdeaId: number;

      if (isEditing) {
        tradeIdeaId = initialData.id;
        const { error } = await supabase
          .from('trade_ideas')
          .update(ideaData)
          .eq('id', tradeIdeaId);
        if (error) throw new Error(error.message);
      } else {
        const { data: newIdea, error } = await supabase
          .from('trade_ideas')
          .insert([{ ...ideaData, user_id: user.id }])
          .select()
          .single();
        if (error) throw new Error(error.message);
        tradeIdeaId = newIdea.id;
      }

      // Process media items
      const mediaToKeep = new Set<string>();
      
      // First delete any media items that were removed
      if (isEditing) {
        const { data: existingMedia } = await supabase
          .from('trade_idea_media')
          .select('id')
          .eq('trade_idea_id', tradeIdeaId);
          
        if (existingMedia) {
          const existingIds = existingMedia.map(m => m.id.toString());
          const currentIds = mediaItems.map(m => m.id);
          const toDelete = existingIds.filter(id => !currentIds.includes(id));
          
          if (toDelete.length > 0) {
            const { error: deleteError } = await supabase
              .from('trade_idea_media')
              .delete()
              .in('id', toDelete.map(Number));
            if (deleteError) throw new Error(deleteError.message);
          }
        }
      }
      
      // Then update/create remaining media items
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        let finalUrl = item.url;

        if (item.file) {
          // Upload new file
          const bucket = item.type === 'image' ? 'trade-images' : 'trade-videos';
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `public/${user.id}-${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, item.file);
          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          finalUrl = urlData.publicUrl;
        }

        const mediaData = {
          trade_idea_id: tradeIdeaId,
          media_type: item.type,
          url: finalUrl,
          title: item.title || null,
          description: item.description || null,
          thumbnail_url: item.thumbnail_url || null,
          position: i,
        };

        if (isEditing && !isNaN(Number(item.id))) {
          // Update existing media item
          const { error } = await supabase
            .from('trade_idea_media')
            .update(mediaData)
            .eq('id', Number(item.id));
          if (error) throw new Error(error.message);
        } else {
          // Create new media item
          const { error } = await supabase
            .from('trade_idea_media')
            .insert([mediaData]);
          if (error) throw new Error(error.message);
        }
        
        mediaToKeep.add(item.id);
      }

      return { tradeIdeaId, mediaToKeep };
    },
    onSuccess: () => {
      toast({ 
        title: 'Success', 
        description: `Trade idea has been ${isEditing ? 'updated' : 'posted'}`,
        variant: 'destructive' 
      });
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

  const onSubmit = (values: TradeIdeaFormValues) => {
    const capitalizedTitle = values.title
      .split(' ')
      .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
      .join(' ');

    mutation.mutate({ ...values, title: capitalizedTitle });
  };

  return (
    <>
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
                <FormLabel className="text-white flex items-center justify-between">
                  <span>Breakdown</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMediaClick}
                  >
                    Insert Media
                  </Button>
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Detailed analysis of the trade idea..." 
                    {...field} 
                    className="glass-input min-h-[300px]"
                    ref={textareaRef}
                  />
                </FormControl>
                {field.value && (
                  <div className="mt-4 p-4 rounded-lg bg-brand-gray-200/10">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Preview:</h3>
                    <div className="prose prose-invert prose-sm max-w-none break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {(String(field.value || '')).replace(/\[MEDIA:[^\]]+\]/g, '')}
                      </ReactMarkdown>
                      <InlineMediaRenderer
                        content={field.value}
                        mediaItems={mediaItems}
                      />
                    </div>
                  </div>
                )}
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

          {/* Removed fields for AI-computed values */}
          {/* Status, Entry Price, Target Price, Stop Loss, Risk/Reward, Sentiment, Key Points, and Direction are computed by AI */}

          <FormField
            control={form.control}
            name="is_pinned"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-white">
                    Pin this trade idea to the top
                  </FormLabel>
                  <FormDescription>
                    Pinned trade ideas will always appear at the top of the list.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-white">
                    Feature this trade idea
                  </FormLabel>
                  <FormDescription>
                    Featured trade ideas are highlighted on the platform.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* Media Items Preview */}
          {mediaItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Added Media</h3>
              <div className="space-y-4">
                {mediaItems.map((item, index) => (
                  <MediaPreview
                    key={item.id}
                    item={item}
                    index={index}
                    onRemove={removeMediaItem}
                    onMove={moveMediaItem}
                    totalItems={mediaItems.length}
                  />
                ))}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-brand-green text-black font-bold hover:bg-brand-green/80" disabled={mutation.isPending}>
            {mutation.isPending ? (isEditing ? 'Updating...' : 'Posting...') : (isEditing ? 'Update Trade Idea' : 'Post Trade Idea')}
          </Button>
        </form>
      </Form>

      {showMediaSelector && (
        <MediaSelector
          onAdd={insertMediaPlaceholder}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </>
  );
};

export default TradeIdeaForm;

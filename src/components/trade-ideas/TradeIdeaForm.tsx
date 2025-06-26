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
import ImageUploader from './ImageUploader';
import { useState, useRef, useEffect } from 'react';
import MediaSelector from '@/components/trade-ideas/MediaSelector';
import MediaPreview from '@/components/trade-ideas/MediaPreview';
import InlineMediaRenderer from '@/components/trade-ideas/InlineMediaRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  instrument: z.string().min(1, 'Instrument is required'),
  breakdownPages: z.array(z.string().min(1, 'Breakdown page content is required')).min(1, 'At least one breakdown page is required'),
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
});

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
  const [currentPage, setCurrentPage] = useState(0);
  const [breakdownPages, setBreakdownPages] = useState<string[]>(initialData?.breakdown ? (Array.isArray(initialData.breakdown) ? initialData.breakdown.map(String) : [String(initialData.breakdown)]) : ['']);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      instrument: initialData?.instrument || '',
      breakdownPages: [''],
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
    },
  });

  // Set initial breakdownPages value after form initialization
  useEffect(() => {
    if (initialData?.breakdown) {
      const breakdownValue = Array.isArray(initialData.breakdown)
        ? initialData.breakdown.map(item => String(item))
        : [String(initialData.breakdown)];
      form.setValue('breakdownPages', breakdownValue as string[]);
    }
  }, [initialData, form]);

  // Sync breakdownPages state with form values
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'breakdownPages' && value.breakdownPages) {
        setBreakdownPages(value.breakdownPages as string[]);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Update current page content in form when editing in textarea
  const handleBreakdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const updatedPages = [...breakdownPages];
    updatedPages[currentPage] = newContent;
    form.setValue('breakdownPages', updatedPages, { shouldValidate: true });
  };

  const addNewPage = () => {
    const updatedPages = [...breakdownPages, ''];
    form.setValue('breakdownPages', updatedPages, { shouldValidate: true });
    setCurrentPage(updatedPages.length - 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < breakdownPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const removePage = (index: number) => {
    if (breakdownPages.length > 1) {
      const updatedPages = breakdownPages.filter((_, i) => i !== index);
      form.setValue('breakdownPages', updatedPages, { shouldValidate: true });
      if (currentPage >= index && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

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
        }
      };

      fetchMedia();
    }
  }, [initialData]);

  const isEditing = !!initialData;

  const handleAddMediaClick = () => {
    setShowMediaSelector(true);
  };

  const insertMediaPlaceholder = (item: MediaItem) => {
    setMediaItems(prev => {
      const existingIndex = prev.findIndex(media => media.id === item.id);
      if (existingIndex >= 0) {
        const updatedItems = [...prev];
        updatedItems[existingIndex] = { ...item };
        return updatedItems;
      } else {
        // Generate a temporary id for new items
        const newItem = { ...item, id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}` };
        return [...prev, newItem];
      }
    });
    setShowMediaSelector(false);
  };

  const removeMediaItem = async (id: string) => {
    // Check if the ID is a numeric value and not NaN, indicating it's a database record
    const numericId = Number(id);
    if (!isNaN(numericId) && numericId !== NaN && initialData?.id) {
      try {
        const { error } = await supabase
          .from('trade_idea_media')
          .delete()
          .eq('id', numericId)
          .eq('trade_idea_id', initialData.id);
        if (error) {
          console.error('Error deleting media item from database:', error.message);
          toast({
            title: 'Error',
            description: 'Failed to delete media item from database.',
            variant: 'destructive',
          });
          return; // Don't update state if deletion fails
        }
      } catch (err) {
        console.error('Unexpected error deleting media item:', err);
        toast({
          title: 'Error',
          description: 'Unexpected error deleting media item.',
          variant: 'destructive',
        });
        return;
      }
    }
    setMediaItems(prev => prev.filter(item => item.id !== id));
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
    mutationFn: async (values: any) => {
      if (!user) throw new Error('User not authenticated');

      const ideaData = {
        title: values.title,
        instrument: values.instrument,
        breakdown: values.breakdownPages,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        image_url: values.image_url || null,
        is_pinned: values.is_pinned,
        // AI-computed fields are excluded from manual update
        // status, entry_price, target_price, stop_loss, risk_reward, sentiment, key_points, direction are computed by AI
      };

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
          const currentIds = mediaItems.map(m => m.id).filter(id => !isNaN(Number(id)));
          const toDelete = existingIds.filter(id => !currentIds.includes(id));
          
          if (toDelete.length > 0) {
            const numericIdsToDelete = toDelete.filter(id => !isNaN(Number(id))).map(Number);
            if (numericIdsToDelete.length > 0) {
              const { error: deleteError } = await supabase
                .from('trade_idea_media')
                .delete()
                .in('id', numericIdsToDelete);
              if (deleteError) throw new Error(deleteError.message);
            }
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

        if (item.id && !item.id.startsWith('temp_') && !isNaN(Number(item.id))) {
          // Update existing media item
          const { error } = await supabase
            .from('trade_idea_media')
            .update(mediaData)
            .eq('id', Number(item.id));
          if (error) throw new Error(error.message);
          mediaToKeep.add(item.id);
        } else {
          // Either new item (temp_) or malformed ID — treat as insert
          if (item.id && isNaN(Number(item.id)) && !item.id.startsWith('temp_')) {
            console.warn(`Skipping media update due to invalid ID: ${item.id}`);
          }
          const { data, error } = await supabase
            .from('trade_idea_media')
            .insert([mediaData])
            .select();
          if (error) throw new Error(error.message);
          if (data && data[0]?.id) {
            mediaToKeep.add(data[0].id.toString());
          }
        }
      }

      // Delete media items not in mediaToKeep
      if (isEditing && mediaToKeep.size > 0) {
        const formattedIds = Array.from(mediaToKeep)
          .filter(id => typeof id === 'string')
          .map(id => `"${id}"`) // wrap each in double quotes
          .join(',');
        const { error: deleteError } = await supabase
          .from('trade_idea_media')
          .delete()
          .eq('trade_idea_id', tradeIdeaId)
          .filter('id', 'not.in', `(${formattedIds})`);
        if (deleteError) throw new Error(deleteError.message);
      }

      return { tradeIdeaId, mediaToKeep };
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: `Trade idea has been ${isEditing ? 'updated' : 'posted'}`,
        variant: 'destructive',
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
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
            name={`breakdownPages.${currentPage}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white flex items-center justify-between">
                  <span>Breakdown (Page {currentPage + 1} of {breakdownPages.length})</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddMediaClick}
                    >
                      Insert Media
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addNewPage}
                    >
                      Add Page
                    </Button>
                    {breakdownPages.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePage(currentPage)}
                      >
                        Remove Page
                      </Button>
                    )}
                  </div>
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Detailed analysis of the trade idea for this page..." 
                    value={breakdownPages[currentPage]}
                    onChange={handleBreakdownChange}
                    className="glass-input min-h-[300px]"
                    ref={textareaRef}
                  />
                </FormControl>
                <div className="flex justify-between mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                  >
                    Previous Page
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === breakdownPages.length - 1}
                  >
                    Next Page
                  </Button>
                </div>
                {breakdownPages[currentPage] && (
                  <div className="mt-4 p-4 rounded-lg bg-brand-gray-200/10">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Preview (Page {currentPage + 1}):</h3>
                    <div className="prose prose-invert prose-sm max-w-none break-words">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {breakdownPages[currentPage].replace(/\[MEDIA:[^\]]+\]/g, '')}
                      </ReactMarkdown>
                      <InlineMediaRenderer
                        content={breakdownPages[currentPage]}
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

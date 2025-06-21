import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { MediaItem } from '@/types/media';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MediaSelector from '@/components/trade-ideas/MediaSelector';
import MediaPreview from '@/components/trade-ideas/MediaPreview';
import InlineMediaRenderer from '@/components/trade-ideas/InlineMediaRenderer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const CreateTradeIdea = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [title, setTitle] = useState('');
  const [instrument, setInstrument] = useState('');
  const [breakdownPages, setBreakdownPages] = useState<string[]>(['']); // Array for pages
  const [currentPageContentIndex, setCurrentPageContentIndex] = useState(0); // Current page index
  const [tags, setTags] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Map of placeholder IDs to database IDs for updating content after save
  const [mediaIdMap, setMediaIdMap] = useState<Record<string, string>>({});

  const handleAddMediaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
    setShowMediaSelector(true);
  };

  const insertMediaPlaceholder = (item: MediaItem) => {
    const uniqueId = Date.now().toString();
    const mediaItem = { ...item, id: uniqueId };
    const mediaPlaceholder = `\n[MEDIA:${uniqueId}]\n`;
    
    setBreakdownPages(prevPages => {
      const newPages = [...prevPages];
      const currentPageContent = newPages[currentPageContentIndex];
      newPages[currentPageContentIndex] = currentPageContent.slice(0, cursorPosition) + mediaPlaceholder + currentPageContent.slice(cursorPosition);
      return newPages;
    });
    setMediaItems(prev => [...prev, mediaItem]);
    setShowMediaSelector(false);

    console.log('Added media item:', mediaItem);
    console.log('Current media items:', [...mediaItems, mediaItem]);
    console.log('Current breakdown:', newBreakdown);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
    const placeholderRegex = new RegExp(`\\[MEDIA:${id}\\]`, 'g');
    setBreakdownPages(prevPages => {
      const newPages = [...prevPages];
      newPages[currentPageContentIndex] = newPages[currentPageContentIndex].replace(placeholderRegex, '');
      return newPages;
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      instrument: string;
      breakdownPages: string[]; // Changed to array
      tags: string[];
      mediaItems: MediaItem[];
    }) => {
      console.log('Submitting data:', data);

      if (!user || user.id !== '73938002-b3f8-4444-ad32-6a46cbf8e075') {
        throw new Error("You are not authorized to perform this action.");
      }

      // Find first media item for thumbnail
      let thumbnailUrl = '';
      const firstMediaItem = data.mediaItems.find(item => item.type === 'image') || 
                           data.mediaItems.find(item => item.type === 'video');

      // Create the trade idea
      const { data: tradeIdea, error: tradeIdeaError } = await supabase
        .from('trade_ideas')
        .insert([{
          title: data.title,
          instrument: data.instrument,
          breakdown: data.breakdownPages, // Pass the array
          tags: data.tags,
          user_id: user.id,
          image_url: thumbnailUrl || null,
        }])
        .select()
        .single();

      if (tradeIdeaError) {
        console.error('Error creating trade idea:', tradeIdeaError);
        throw new Error(tradeIdeaError.message);
      }

      console.log('Created trade idea:', tradeIdea);

      // Process and upload media items
      for (let i = 0; i < data.mediaItems.length; i++) {
        const item = data.mediaItems[i];
        let finalUrl = item.url;

        if (item.file) {
          // Upload file to appropriate bucket
          const bucket = item.type === 'image' ? 'trade-images' : 'trade-videos';
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `public/${user.id}-${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, item.file);

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }

          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          finalUrl = urlData.publicUrl;
        }

        // If this is the first media item and no thumbnail set yet, use it
        if (i === 0 && finalUrl) {
          thumbnailUrl = item.type === 'video' ? (item.thumbnail_url || '') : finalUrl;
          // Update the trade idea with the thumbnail
          const { error: updateError } = await supabase
            .from('trade_ideas')
            .update({ image_url: thumbnailUrl })
            .eq('id', tradeIdea.id);

          if (updateError) throw updateError;
        }

        // Save media item
        const mediaData = {
          trade_idea_id: tradeIdea.id,
          media_type: item.type,
          url: finalUrl,
          title: item.title || null,
          description: item.description || null,
          thumbnail_url: item.thumbnail_url || null,
          position: i,
          placeholder_id: item.id // Store the placeholder ID
        };

        console.log('Saving media item:', mediaData);

        const { error: mediaError } = await supabase
          .from('trade_idea_media')
          .insert([mediaData]);

        if (mediaError) {
          console.error('Error saving media item:', mediaError);
          throw new Error(mediaError.message);
        }
      }

      return tradeIdea;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Trade idea has been created.' });
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      navigate('/analysis');
    },
    onError: (error: Error) => {
      console.error('Error in mutation:', error);
      toast({
        title: 'Error creating trade idea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instrument.trim() || breakdownPages.some(page => !page.trim())) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields for all pages.',
        variant: 'destructive',
      });
      return;
    }

    const tagsArray = tags?.split(',').map(tag => tag.trim()).filter(Boolean) ?? [];
    const capitalizedTitle = title
      .split(' ')
      .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
      .join(' ');

    console.log('Submitting:', {
      title: capitalizedTitle,
      instrument,
      breakdownPages, // Pass the array
      tags: tagsArray,
      mediaItems,
    });

    createMutation.mutate({
      title: capitalizedTitle,
      instrument,
      breakdownPages, // Pass the array
      tags: tagsArray,
      mediaItems,
    });
  };

  const handleAddPage = () => {
    setBreakdownPages(prevPages => [...prevPages, '']);
    setCurrentPageContentIndex(breakdownPages.length);
  };

  const handlePageChange = (index: number) => {
    setCurrentPageContentIndex(index);
  };

  const currentPageContent = breakdownPages[currentPageContentIndex];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">Create Trade Idea</h1>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                Back
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your trade idea"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Instrument</label>
                <Input
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder="Enter the trading instrument (e.g., BTC/USD)"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-200">Analysis Breakdown</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddMediaClick}
                  >
                    Insert Media
                  </Button>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={currentPageContent}
                  onChange={(e) => {
                    setBreakdownPages(prevPages => {
                      const newPages = [...prevPages];
                      newPages[currentPageContentIndex] = e.target.value;
                      return newPages;
                    });
                  }}
                  placeholder={`Write your analysis for page ${currentPageContentIndex + 1} here...`}
                  className="min-h-[300px] w-full"
                  required
                />
                
                {/* Pagination controls for breakdown content */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePageChange(currentPageContentIndex - 1)}
                    disabled={currentPageContentIndex === 0}
                  >
                    Previous Page
                  </Button>
                  <span className="text-white">
                    Page {currentPageContentIndex + 1} of {breakdownPages.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePageChange(currentPageContentIndex + 1)}
                    disabled={currentPageContentIndex === breakdownPages.length - 1}
                  >
                    Next Page
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddPage}
                  className="mt-2 w-full"
                >
                  Add New Page
                </Button>

                {/* Live Preview */}
                {currentPageContent && (
                  <div className="mt-4 p-4 rounded-lg bg-brand-gray-200/10">
                    <h3 className="text-sm font-medium text-gray-300 mb-2">Preview (Current Page):</h3>
                    <div className="prose prose-invert max-w-none">
                      <InlineMediaRenderer
                        content={currentPageContent}
                        mediaItems={mediaItems}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200">Tags</label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas"
                  className="w-full"
                />
              </div>

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
                        onMove={() => {}} // We'll implement this later if needed
                        totalItems={mediaItems.length}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Trade Idea'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {showMediaSelector && (
        <MediaSelector
          onAdd={insertMediaPlaceholder}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </>
  );
};

export default CreateTradeIdea;

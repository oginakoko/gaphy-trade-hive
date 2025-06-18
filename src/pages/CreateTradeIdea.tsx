
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import MediaSelector from '@/components/trade-ideas/MediaSelector';
import MediaPreview from '@/components/trade-ideas/MediaPreview';
import InlineMediaRenderer from '@/components/trade-ideas/InlineMediaRenderer';
import { MediaItem } from '@/types/media';
import { TradeIdea } from '@/types';

const CreateTradeIdea = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [title, setTitle] = useState('');
  const [instrument, setInstrument] = useState('');
  const [breakdown, setBreakdown] = useState('');
  const [tags, setTags] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      instrument: string;
      breakdown: string;
      tags: string[];
      mediaItems: MediaItem[];
    }) => {
      if (!user || user.id !== '73938002-b3f8-4444-ad32-6a46cbf8e075') {
        throw new Error("You are not authorized to perform this action.");
      }

      // Ensure profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Failed to check for profile: ${profileError.message}`);
      }
      
      if (!profile) {
        const newUsername = user.email?.split('@')[0] || `user_${user.id.substring(0, 4)}`;
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({ id: user.id, username: newUsername });
        
        if (createProfileError) {
          throw new Error(`Failed to create user profile: ${createProfileError.message}`);
        }
      }

      // Create the trade idea
      const { data: tradeIdea, error: tradeIdeaError } = await supabase
        .from('trade_ideas')
        .insert([{
          title: data.title,
          instrument: data.instrument,
          breakdown: data.breakdown,
          tags: data.tags,
          user_id: user.id,
        }])
        .select()
        .single();

      if (tradeIdeaError) throw new Error(tradeIdeaError.message);

      // Process and upload media items
      for (let i = 0; i < data.mediaItems.length; i++) {
        const item = data.mediaItems[i];
        let finalUrl = item.url;

        // Upload files to appropriate buckets
        if (item.file && item.type === 'image') {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `public/${user.id}-${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('trade-images')
            .upload(filePath, item.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('trade-images')
            .getPublicUrl(filePath);

          finalUrl = urlData.publicUrl;
        } else if (item.file && item.type === 'video') {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('trade-videos')
            .upload(filePath, item.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('trade-videos')
            .getPublicUrl(filePath);

          finalUrl = urlData.publicUrl;
        }

        // Save media item to database
        const { error: mediaError } = await supabase
          .from('trade_idea_media')
          .insert([{
            trade_idea_id: tradeIdea.id,
            media_type: item.type,
            url: finalUrl,
            title: item.title,
            description: item.description,
            thumbnail_url: item.thumbnail_url,
            position: i,
          }]);

        if (mediaError) throw new Error(mediaError.message);
      }

      return tradeIdea;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Trade idea has been created.' });
      queryClient.invalidateQueries({ queryKey: ['tradeIdeas'] });
      navigate('/');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating trade idea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instrument.trim() || !breakdown.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const tagsArray = tags?.split(',').map(tag => tag.trim()).filter(Boolean) ?? [];
    const capitalizedTitle = title
      .split(' ')
      .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
      .join(' ');

    createMutation.mutate({
      title: capitalizedTitle,
      instrument,
      breakdown,
      tags: tagsArray,
      mediaItems,
    });
  };

  const handleAddMediaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
    setShowMediaSelector(true);
  };

  const insertMediaPlaceholder = (item: MediaItem) => {
    const uniqueId = `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mediaPlaceholder = `\n\n[MEDIA:${uniqueId}]\n\n`;
    
    const newBreakdown = breakdown.slice(0, cursorPosition) + mediaPlaceholder + breakdown.slice(cursorPosition);
    setBreakdown(newBreakdown);
    
    setMediaItems(prev => [...prev, { ...item, id: uniqueId }]);
    setShowMediaSelector(false);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
    
    const placeholderRegex = new RegExp(`\\n\\n\\[MEDIA:${id}\\]\\n\\n`, 'g');
    setBreakdown(prev => prev.replace(placeholderRegex, ''));
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold text-white">Create Trade Idea</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <div className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="glass-card p-6 space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Title *
                      </label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., BTC Long Opportunity"
                        className="glass-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Instrument *
                      </label>
                      <Input
                        value={instrument}
                        onChange={(e) => setInstrument(e.target.value)}
                        placeholder="e.g., BTCUSD"
                        className="glass-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2 flex items-center justify-between">
                        Analysis *
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddMediaClick}
                          className="bg-brand-green text-black hover:bg-brand-green/80"
                        >
                          <Plus size={14} className="mr-1" />
                          Insert Media
                        </Button>
                      </label>
                      <Textarea
                        ref={textareaRef}
                        value={breakdown}
                        onChange={(e) => setBreakdown(e.target.value)}
                        placeholder="Detailed analysis of the trade idea... Click 'Insert Media' to add images, videos, or links at any position in your analysis."
                        className="glass-input min-h-48"
                        required
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Tip: Position your cursor where you want to insert media, then click "Insert Media"
                      </p>
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Tags
                      </label>
                      <Input
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., crypto, btc, long"
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-1 bg-brand-green text-black hover:bg-brand-green/80"
                    >
                      <Save size={16} className="mr-2" />
                      {createMutation.isPending ? 'Creating...' : 'Create Trade Idea'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Preview Section */}
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Preview</h3>
                  {title && (
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-white">{title}</h4>
                      {instrument && (
                        <p className="text-brand-green text-sm">{instrument}</p>
                      )}
                    </div>
                  )}
                  
                  {breakdown && (
                    <div className="text-gray-300">
                      <InlineMediaRenderer 
                        content={breakdown} 
                        mediaItems={mediaItems} 
                      />
                    </div>
                  )}
                  
                  {tags && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-brand-green/20 text-brand-green text-xs rounded"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {mediaItems.length > 0 && (
                  <div className="glass-card p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Media Manager</h3>
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
              </div>
            </div>
          </div>
        </div>

        {showMediaSelector && (
          <MediaSelector
            onAdd={insertMediaPlaceholder}
            onClose={() => setShowMediaSelector(false)}
          />
        )}
      </main>
    </>
  );
};

export default CreateTradeIdea;

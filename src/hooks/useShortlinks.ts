import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { nanoid } from 'nanoid';

export const useShortlinks = () => {
  const createShortlink = useMutation({
    mutationFn: async ({ originalUrl, type }: { originalUrl: string, type?: string }) => {
      const shortCode = nanoid(6); // Generate 6-character code
      
      const { data, error } = await supabase
        .from('shortlinks')
        .insert({
          short_code: shortCode,
          original_url: originalUrl,
          type,
        })
        .select('short_code')
        .single();

      if (error) throw error;
      return data.short_code;
    }
  });

  return { createShortlink };
};

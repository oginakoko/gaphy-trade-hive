import { supabase } from '@/lib/supabaseClient';

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  createdAt: string;
}

const createShortUrl = async (originalUrl: string): Promise<string> => {
  const shortCode = Math.random().toString(36).substring(2, 8);
  
  const { error } = await supabase
    .from('short_urls')
    .insert([{ 
      originalUrl, 
      shortCode,
      createdAt: new Date().toISOString()
    }]);

  if (error) throw error;
  return `https://gaphyhive.ai/s/${shortCode}`;
};

const getOriginalUrl = async (shortCode: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('short_urls')
    .select('originalUrl')
    .eq('shortCode', shortCode)
    .single();

  if (error || !data) return null;
  return data.originalUrl;
};

export const shortUrlService = {
  createShortUrl,
  getOriginalUrl
};

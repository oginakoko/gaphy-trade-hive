import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

const ShortlinkRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getOriginalUrl = async () => {
      if (!code) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shortlinks')
          .select('original_url')
          .eq('short_code', code)
          .single();

        if (error) throw error;
        if (!data?.original_url) throw new Error('Link not found');

        // Check if it's an internal or external URL
        if (data.original_url.startsWith(window.location.origin)) {
          // For internal URLs, use navigate
          navigate(new URL(data.original_url).pathname);
        } else {
          // For external URLs, use window.location
          window.location.href = data.original_url;
        }
      } catch (err: any) {
        setError(err.message);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    getOriginalUrl();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
        <p className="text-gray-400 mb-4">{error}</p>
        <p className="text-sm text-gray-500">Redirecting to home page...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
      <p className="text-white mt-4">Redirecting...</p>
    </div>
  );
};

export default ShortlinkRedirect;

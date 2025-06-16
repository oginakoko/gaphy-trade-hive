import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shortUrlService } from '@/models/ShortUrl';
import { Loader2 } from 'lucide-react';

export default function ShortUrlRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      if (!code) return navigate('/');
      
      try {
        const originalUrl = await shortUrlService.getOriginalUrl(code);
        if (originalUrl) {
          window.location.href = originalUrl;
        } else {
          navigate('/404');
        }
      } catch (error) {
        console.error('Error resolving short URL:', error);
        navigate('/404');
      }
    };

    redirect();
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
    </div>
  );
}

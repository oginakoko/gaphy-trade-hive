
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UrlPreviewProps {
  url: string;
}

interface PreviewData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

const UrlPreview = ({ url }: UrlPreviewProps) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        // For demo purposes, we'll create a simple preview based on the URL
        // In production, you'd want to use a service like LinkPreview API
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        
        // Mock preview data based on domain
        const mockData: PreviewData = {
          title: `Link from ${domain}`,
          description: `Visit ${url}`,
          siteName: domain,
        };

        // Add some delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setPreviewData(mockData);
      } catch (err) {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [url]);

  if (isLoading) {
    return (
      <Card className="p-3 bg-gray-700 border-gray-600 max-w-sm">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4 bg-gray-600" />
          <Skeleton className="h-3 w-full bg-gray-600" />
          <Skeleton className="h-3 w-1/2 bg-gray-600" />
        </div>
      </Card>
    );
  }

  if (error || !previewData) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline"
      >
        {url}
        <ExternalLink size={12} />
      </a>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block max-w-sm">
      <Card className="p-3 bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Globe size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              {previewData.title && (
                <h4 className="text-sm font-medium text-white truncate">
                  {previewData.title}
                </h4>
              )}
              {previewData.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                  {previewData.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 truncate">
                {previewData.siteName || new URL(url).hostname}
              </p>
            </div>
            <ExternalLink size={12} className="text-gray-400 flex-shrink-0" />
          </div>
        </div>
      </Card>
    </a>
  );
};

export default UrlPreview;

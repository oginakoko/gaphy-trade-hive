
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X, ExternalLink, Image, Video, Link } from 'lucide-react';
import { MediaItem } from '@/types/media';

interface MediaPreviewProps {
  item: MediaItem;
  index: number;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  totalItems: number;
}

const MediaPreview = ({ item, index, onRemove, onMove, totalItems }: MediaPreviewProps) => {
  const getEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  };

  const renderMediaContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <div className="relative">
            <img
              src={item.url}
              alt={item.title || 'Media content'}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
              <Image size={12} />
              Image
            </div>
          </div>
        );

      case 'video':
        const embedUrl = getEmbedUrl(item.url);
        const isEmbedable = embedUrl !== item.url;

        if (isEmbedable) {
          return (
            <div className="relative">
              <iframe
                src={embedUrl}
                className="w-full h-48 rounded-lg"
                frameBorder="0"
                allowFullScreen
              />
              <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                <Video size={12} />
                Video
              </div>
            </div>
          );
        } else if (item.file) {
          return (
            <div className="relative">
              <video
                src={item.url}
                className="w-full h-48 object-cover rounded-lg"
                controls
              />
              <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                <Video size={12} />
                Video
              </div>
            </div>
          );
        } else {
          return (
            <div className="bg-brand-gray-200/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Video size={16} className="text-brand-green" />
                <span className="text-white text-sm font-medium">Video Link</span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-sm flex items-center gap-1"
              >
                {item.url}
                <ExternalLink size={12} />
              </a>
            </div>
          );
        }

      case 'link':
        return (
          <div className="bg-brand-gray-200/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link size={16} className="text-brand-green" />
              <span className="text-white text-sm font-medium">Link</span>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline text-sm flex items-center gap-1"
            >
              {item.url}
              <ExternalLink size={12} />
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">#{index + 1}</span>
          {item.title && (
            <h4 className="text-white font-medium">{item.title}</h4>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(item.id, 'up')}
            disabled={index === 0}
          >
            <ChevronUp size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMove(item.id, 'down')}
            disabled={index === totalItems - 1}
          >
            <ChevronDown size={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(item.id)}
            className="text-red-400 hover:text-red-300"
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {renderMediaContent()}

      {item.description && (
        <p className="text-gray-300 text-sm">{item.description}</p>
      )}
    </div>
  );
};

export default MediaPreview;

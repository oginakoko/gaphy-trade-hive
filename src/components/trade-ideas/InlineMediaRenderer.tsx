
import React from 'react';
import { MediaItem } from '@/types/media';

interface InlineMediaRendererProps {
  content: string;
  mediaItems: MediaItem[];
}

const InlineMediaRenderer = ({ content, mediaItems }: InlineMediaRendererProps) => {
  const renderMediaContent = (item: MediaItem) => {
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

    switch (item.type) {
      case 'image':
        return (
          <div className="my-6">
            <img
              src={item.url}
              alt={item.title || 'Analysis image'}
              className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
            />
            {item.title && (
              <p className="text-center text-gray-300 text-sm mt-2 font-medium">
                {item.title}
              </p>
            )}
            {item.description && (
              <p className="text-center text-gray-400 text-sm mt-1">
                {item.description}
              </p>
            )}
          </div>
        );

      case 'video':
        const embedUrl = getEmbedUrl(item.url);
        const isEmbedable = embedUrl !== item.url;

        if (isEmbedable) {
          return (
            <div className="my-6">
              <div className="aspect-video max-w-2xl mx-auto">
                <iframe
                  src={embedUrl}
                  className="w-full h-full rounded-lg"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
              {item.title && (
                <p className="text-center text-gray-300 text-sm mt-2 font-medium">
                  {item.title}
                </p>
              )}
              {item.description && (
                <p className="text-center text-gray-400 text-sm mt-1">
                  {item.description}
                </p>
              )}
            </div>
          );
        } else if (item.file) {
          return (
            <div className="my-6">
              <div className="max-w-2xl mx-auto">
                <video
                  src={item.url}
                  className="w-full rounded-lg"
                  controls
                />
              </div>
              {item.title && (
                <p className="text-center text-gray-300 text-sm mt-2 font-medium">
                  {item.title}
                </p>
              )}
              {item.description && (
                <p className="text-center text-gray-400 text-sm mt-1">
                  {item.description}
                </p>
              )}
            </div>
          );
        } else {
          return (
            <div className="my-6 max-w-2xl mx-auto">
              <div className="bg-brand-gray-200/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-brand-green text-sm font-medium">📹 Video Link</span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                  {item.title || item.url}
                </a>
                {item.description && (
                  <p className="text-gray-400 text-sm mt-2">{item.description}</p>
                )}
              </div>
            </div>
          );
        }

      case 'link':
        return (
          <div className="my-6 max-w-2xl mx-auto">
            <div className="bg-brand-gray-200/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-brand-green text-sm font-medium">🔗 Link</span>
              </div>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                {item.title || item.url}
              </a>
              {item.description && (
                <p className="text-gray-400 text-sm mt-2">{item.description}</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const processContent = () => {
    let processedContent = content;
    
    // Replace media placeholders with actual media content
    mediaItems.forEach(item => {
      const placeholder = `[MEDIA:${item.id}]`;
      const mediaElement = renderMediaContent(item);
      
      if (mediaElement) {
        // Convert React element to string representation for display
        const mediaHtml = `<div class="inline-media" data-media-id="${item.id}"></div>`;
        processedContent = processedContent.replace(placeholder, mediaHtml);
      }
    });

    return processedContent;
  };

  const renderProcessedContent = () => {
    const processedText = processContent();
    const parts = processedText.split(/(<div class="inline-media" data-media-id="[^"]+"><\/div>)/);
    
    return parts.map((part, index) => {
      const mediaMatch = part.match(/data-media-id="([^"]+)"/);
      if (mediaMatch) {
        const mediaId = mediaMatch[1];
        const mediaItem = mediaItems.find(item => item.id === mediaId);
        if (mediaItem) {
          return <div key={index}>{renderMediaContent(mediaItem)}</div>;
        }
      }
      
      // Regular text content
      return (
        <div key={index} className="whitespace-pre-wrap">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="prose prose-invert max-w-none">
      {renderProcessedContent()}
    </div>
  );
};

export default InlineMediaRenderer;

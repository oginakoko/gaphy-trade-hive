import React from 'react';
import { MediaItem } from '@/types/media';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
        } else {
          return (
            <div className="my-6 max-w-2xl mx-auto">
              <video
                src={item.url}
                className="w-full rounded-lg"
                controls
                preload="metadata"
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

  const renderContent = () => {
    // Render the text content first
    const textContent = String(content || '').replace(/\[MEDIA:[^\]]+\]/g, '');
    const textElement = textContent.trim() ? (
      <div key="text-content" className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
      </div>
    ) : null;

    // Render all media items after the text content based on their order in mediaItems
    const mediaElements = mediaItems.map((item, index) => (
      <div key={`media-${item.id || index}`}>{renderMediaContent(item)}</div>
    ));

    return [textElement, ...mediaElements].filter(Boolean); // Remove null entries
  };

  return (
    <div className="space-y-4">
      {renderContent()}
    </div>
  );
};

export default InlineMediaRenderer;

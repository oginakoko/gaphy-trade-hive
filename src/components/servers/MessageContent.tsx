
import React from 'react';
import UrlPreview from './UrlPreview';

interface MessageContentProps {
  content: string;
}

const MessageContent = ({ content }: MessageContentProps) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /@(\w+)/g;
  
  // Split content by URLs and mentions
  const parts = content.split(/(https?:\/\/[^\s]+|@\w+)/g);
  const urls: string[] = [];
  
  // Extract URLs for preview
  const urlMatches = content.match(urlRegex);
  if (urlMatches) {
    urls.push(...urlMatches);
  }

  const renderPart = (part: string, index: number) => {
    // Check if it's a URL
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all"
        >
          {part}
        </a>
      );
    }
    
    // Check if it's a mention
    if (mentionRegex.test(part)) {
      const username = part.slice(1); // Remove @
      return (
        <span
          key={index}
          className="text-brand-green font-semibold bg-brand-green/10 px-1 rounded mx-0.5"
        >
          @{username}
        </span>
      );
    }
    
    // Regular text
    return part;
  };

  return (
    <div className="space-y-2">
      <p className="text-gray-300 text-sm whitespace-pre-wrap">
        {parts.map(renderPart)}
      </p>
      
      {/* Render URL previews */}
      {urls.length > 0 && (
        <div className="space-y-2 mt-3">
          {urls.map((url, index) => (
            <UrlPreview key={index} url={url} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageContent;

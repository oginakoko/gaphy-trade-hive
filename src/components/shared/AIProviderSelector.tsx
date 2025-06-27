import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AIProviderSelectorProps {
  onProviderChange?: (provider: string) => void;
}

export const AIProviderSelector: React.FC<AIProviderSelectorProps> = ({ onProviderChange }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('OpenRouter');

  useEffect(() => {
    const savedProvider = localStorage.getItem('selectedAIProvider');
    if (savedProvider) {
      setSelectedProvider(savedProvider);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedAIProvider', selectedProvider);
    if (onProviderChange) {
      onProviderChange(selectedProvider);
    }
  }, [selectedProvider, onProviderChange]);

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">AI Provider:</span>
      <Select value={selectedProvider} onValueChange={handleProviderChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select AI Provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="OpenRouter">OpenRouter</SelectItem>
          <SelectItem value="Gemini">Gemini</SelectItem>
          <SelectItem value="Groq">Groq</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};


import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMessages } from '@/hooks/useMessages';
import { Loader2, Megaphone } from 'lucide-react';

interface BroadcastDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BroadcastDialog({ isOpen, onClose }: BroadcastDialogProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const { sendBroadcastMessage } = useMessages();

  const handleSend = async () => {
    if (!content.trim()) return;
    
    setSending(true);
    try {
      await sendBroadcastMessage({ content });
      setContent('');
      onClose();
    } catch (error) {
      console.error('Failed to send broadcast:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Megaphone className="h-5 w-5 text-brand-green" />
            Send Broadcast Message
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Your message will reach all users on the platform
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-brand-green/10 border border-brand-green/20 rounded-lg p-4">
            <h4 className="text-brand-green font-medium mb-2">Admin Broadcast</h4>
            <p className="text-sm text-gray-400">
              This message will be sent to all users and will appear at the top of their messages.
              Use this for important announcements only.
            </p>
          </div>
          <Textarea
            placeholder="Type your broadcast message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-brand-green focus:ring-brand-green resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!content.trim() || sending}
              className="bg-brand-green hover:bg-brand-green/90 text-black font-medium"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Broadcast Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Send Broadcast Message
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This message will be sent to all users on the platform.
          </div>
          <Textarea
            placeholder="Type your broadcast message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={!content.trim() || sending}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Megaphone className="h-4 w-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

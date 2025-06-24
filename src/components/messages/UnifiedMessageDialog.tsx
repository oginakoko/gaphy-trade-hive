import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface UnifiedMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function UnifiedMessageDialog({
  isOpen,
  onClose,
  children,
  title,
  description,
}: UnifiedMessageDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
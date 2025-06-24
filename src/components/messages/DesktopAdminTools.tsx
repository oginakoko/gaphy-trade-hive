import { Button } from '@/components/ui/button';
import { Megaphone, Users } from 'lucide-react';

interface DesktopAdminToolsProps {
  onShowBroadcast: () => void;
  onShowUserManagement: () => void; // Placeholder for future user management integration
}

export function DesktopAdminTools({ onShowBroadcast, onShowUserManagement }: DesktopAdminToolsProps) {
  return (
    <div className="space-y-4 p-4 border-t border-gray-700 bg-gray-900/50">
      <h3 className="text-lg font-semibold text-white">Admin Tools</h3>
      <Button
        variant="outline"
        className="w-full border-brand-green/30 text-brand-green hover:bg-brand-green/10"
        onClick={onShowBroadcast}
      >
        <Megaphone className="h-4 w-4 mr-2" />
        Broadcast Message
      </Button>
      {/* Placeholder for User Management */}
      <Button
        variant="outline"
        className="w-full border-gray-700 text-gray-400 hover:bg-gray-800/50"
        onClick={onShowUserManagement}
        disabled
      >
        <Users className="h-4 w-4 mr-2" />
        Manage Users (Coming Soon)
      </Button>
    </div>
  );
}
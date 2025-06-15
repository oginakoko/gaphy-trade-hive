import { useState } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';

const getNotificationContent = (notification: Notification) => {
    const { type, sender, server, reference_id } = notification;
    const senderName = <span className="font-bold">{sender.username}</span>;
    const serverName = <span className="font-bold">{server?.name}</span>;

    switch (type) {
        case 'mention':
            return {
                text: <>{senderName} mentioned you in {serverName}.</>,
                path: `/servers?server_id=${server?.id}`
            };
        case 'new_analysis':
            return {
                text: <>{senderName} posted a new analysis.</>,
                path: `/trade-idea/${reference_id}`
            };
        case 'new_comment':
            return {
                text: <>{senderName} commented on your post.</>,
                path: reference_id ? `/trade-idea/${reference_id}` : '/analysis'
            };
        case 'new_like':
            return {
                text: <>{senderName} liked your post.</>,
                path: `/trade-idea/${reference_id}`
            };
        case 'new_server':
            return {
                text: <>Discover the new server: {serverName}.</>,
                path: `/servers?server_id=${server?.id}`
            };
        case 'recommendation':
            return {
                text: <>We found a server you might like: {serverName}.</>,
                path: `/servers?server_id=${server?.id}`
            };
        default:
            return {
                text: <>You have a new notification.</>,
                path: '/'
            };
    }
};

const NotificationsBell = () => {
    const { notifications, unreadCount, markAsRead, isLoading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const handleToggle = (open: boolean) => {
        setIsOpen(open);
        if (open && unreadCount > 0) {
            const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
            if (unreadIds.length > 0) {
                markAsRead(unreadIds);
            }
        }
    };

    const handleNotificationClick = (path: string) => {
        navigate(path);
        setIsOpen(false);
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleToggle}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 rounded-full">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96 mr-2 mt-2" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-2 space-y-2">
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <p className="p-4 text-sm text-center text-gray-400">You have no notifications.</p>
                    ) : (
                        notifications.map(n => {
                            const { text, path } = getNotificationContent(n);
                            return (
                                <DropdownMenuItem key={n.id} className="items-start gap-3 p-3 data-[highlighted]:bg-white/5 cursor-pointer" onClick={() => handleNotificationClick(path)}>
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={n.sender.avatar_url ?? undefined} />
                                        <AvatarFallback>{n.sender.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm text-white/90">
                                            {text}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!n.is_read && <div className="h-2 w-2 rounded-full bg-brand-green self-center"></div>}
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationsBell;

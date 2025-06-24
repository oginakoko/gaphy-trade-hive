import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Megaphone, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const location = useLocation();

  const navItems = [
    {
      name: 'Messages',
      icon: MessageSquare,
      href: '/messages',
    },
    {
      name: 'Broadcasts',
      icon: Megaphone,
      href: '/broadcasts', // This will be a new route for mobile broadcasts
    },
    {
      name: 'Profile',
      icon: User,
      href: '/profile',
    },
    {
      name: 'Home',
      icon: Home,
      href: '/',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-50 md:hidden">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center text-xs font-medium transition-colors',
                isActive ? 'text-brand-green' : 'text-gray-400 hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5 mb-1', isActive ? 'text-brand-green' : 'text-gray-500')} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
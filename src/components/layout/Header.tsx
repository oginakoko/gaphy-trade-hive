import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { Gem, GraduationCap, Home, Lightbulb, Lock, LogOut, Settings, User, Users } from 'lucide-react';

const Header = () => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-brand-gray-200 border-b border-brand-gray-400/40 sticky top-0 z-50">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-white">
          Gaphy.AI
        </Link>

        <nav className="hidden md:flex items-center space-x-4">
          <Link to="/" className="text-gray-300 hover:text-white transition-colors flex items-center">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
          <Link to="/analysis" className="text-gray-300 hover:text-white transition-colors flex items-center">
            <Lightbulb className="mr-2 h-4 w-4" />
            Analysis
          </Link>
          <Link to="/servers" className="text-gray-300 hover:text-white transition-colors flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Servers
          </Link>
          {session ? (
            <>
              <Link to="/profile" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </>
          ) : (
            <Link to="/auth" className="text-gray-300 hover:text-white transition-colors">
              Sign In
            </Link>
          )}
        </nav>

        {session ? (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url as string} alt={user?.user_metadata?.username as string} />
                  <AvatarFallback>{(user?.user_metadata?.username as string)?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { navigate('/create-ad'); setIsMenuOpen(false); }}>
                  <Gem className="mr-2 h-4 w-4" />
                  <span>Create Ad</span>
              </DropdownMenuItem>
              {session?.user.id === 'e95c934a-449c-4169-8995-98c4ef49994c' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Admin</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Panel</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden md:flex">
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

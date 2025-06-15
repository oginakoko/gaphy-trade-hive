
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
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from '@/components/ui/button';
import { ChevronDown, Gem, Home, Lightbulb, LogOut, Menu, Settings, User, Users } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import NotificationsBell from './NotificationsBell';

const Header = () => {
  const { session } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <header className="bg-[#0D0D0D] border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex-1 flex justify-start">
            <Link to="/" className="text-xl font-bold text-white">
                GaphyHive
            </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
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
          {session && (
            <Link to="/profile" className="text-gray-300 hover:text-white transition-colors flex items-center">
                <User className="mr-2 h-4 w-4" />
                Profile
            </Link>
          )}
        </nav>

        <div className="flex-1 flex justify-end items-center gap-2">
            {session && <NotificationsBell />}
            {session ? (
              isLoadingProfile ? (
                 <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              ) : (
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 p-1 pr-2 h-auto rounded-full hover:bg-brand-gray-300">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.username ?? ''} />
                          <AvatarFallback>{profile?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:inline text-white font-medium">{profile?.username}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mr-2">
                      <DropdownMenuLabel>
                        <p className="font-medium">{profile?.username || "My Account"}</p>
                        <p className="text-xs text-gray-400">Welcome back!</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}>
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { navigate('/create-ad'); setIsMenuOpen(false); }}>
                          <Gem className="mr-2 h-4 w-4" />
                          <span>Create Ad</span>
                      </DropdownMenuItem>
                      {session?.user.id === '73938002-b3f8-4444-ad32-6a46cbf8e075' && (
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
              )
            ) : (
            <div className="hidden md:flex">
                <Link to="/auth">
                <Button>Sign In</Button>
                </Link>
            </div>
            )}
            <div className="md:hidden">
              <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6 text-white" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="bg-[#0D0D0D] border-t-brand-gray-300 p-4">
                  <nav className="flex flex-col space-y-4">
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors flex items-center">
                          <Home className="mr-3 h-5 w-5" />
                          Home
                      </Link>
                      <Link to="/analysis" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors flex items-center">
                          <Lightbulb className="mr-3 h-5 w-5" />
                          Analysis
                      </Link>
                      <Link to="/servers" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors flex items-center">
                          <Users className="mr-3 h-5 w-5" />
                          Servers
                      </Link>
                      {session && (
                          <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-gray-300 hover:text-white transition-colors flex items-center">
                              <User className="mr-3 h-5 w-5" />
                              Profile
                          </Link>
                      )}
                      {!session && (
                          <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full mt-4">Sign In</Button>
                          </Link>
                      )}
                  </nav>
                </DrawerContent>
              </Drawer>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

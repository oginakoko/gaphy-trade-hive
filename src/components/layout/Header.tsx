
import { socialLinks } from '@/data/mockData';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const Header = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="py-4">
      <div className="flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.svg" alt="GaphyHive Logo" className="h-10 w-10" />
          <h1 className="text-2xl font-bold text-white tracking-wider">GaphyHive</h1>
        </Link>
        <div className="flex items-center gap-6">
          {session && (
            <Link to="/admin" className="text-gray-300 hover:text-white font-medium transition-colors text-sm">
              Admin
            </Link>
          )}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-brand-green transition-colors"
              >
                <link.icon size={20} />
              </a>
            ))}
          </div>
          {session ? (
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-300 hover:text-white flex items-center gap-2">
              <LogOut size={16} />
              <span>Logout</span>
            </Button>
          ) : (
            <Link to="/auth" className="text-gray-300 hover:text-white font-medium transition-colors text-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

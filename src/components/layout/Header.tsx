
import { socialLinks } from '@/data/mockData';

const Header = () => {
  return (
    <header className="py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="GaphyHive Logo" className="h-10 w-10" />
          <h1 className="text-2xl font-bold text-white tracking-wider">GaphyHive</h1>
        </div>
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
      </div>
    </header>
  );
};

export default Header;

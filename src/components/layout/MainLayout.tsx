import React from 'react';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-foreground font-sans">
      <div className="container mx-auto px-2 sm:px-4 max-w-full sm:max-w-7xl">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;

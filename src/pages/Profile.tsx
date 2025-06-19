import ProfileForm from '@/components/profile/ProfileForm';
import OwnedServers from '@/components/profile/OwnedServers';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-4xl py-4 px-2 sm:py-8 sm:px-0 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile Settings</h1>
      </div>
      <div className="space-y-6 sm:space-y-8">
        <div className="glass-card p-4 sm:p-8 rounded-xl">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Account Information</h2>
          <ProfileForm />
        </div>
        <div className="glass-card p-4 sm:p-8 rounded-xl">
          <OwnedServers />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

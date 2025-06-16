
import ProfileForm from '@/components/profile/ProfileForm';
import OwnedServers from '@/components/profile/OwnedServers';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-4xl py-8 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
      </div>
      
      <div className="space-y-8">
        <div className="glass-card p-8 rounded-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>
          <ProfileForm />
        </div>
        
        <div className="glass-card p-8 rounded-xl">
          <OwnedServers />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


import ProfileForm from '@/components/profile/ProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-2xl py-8 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
      </div>
      <div className="glass-card p-8 rounded-xl">
        <ProfileForm />
      </div>
    </div>
  );
};

export default ProfilePage;

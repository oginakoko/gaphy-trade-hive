
import ProfileForm from '@/components/profile/ProfileForm';

const ProfilePage = () => {
  return (
    <div className="container mx-auto max-w-2xl py-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-white mb-6">Profile Settings</h1>
      <div className="glass-card p-8 rounded-xl">
        <ProfileForm />
      </div>
    </div>
  );
};

export default ProfilePage;

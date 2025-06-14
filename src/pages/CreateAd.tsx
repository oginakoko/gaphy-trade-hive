
import { AdForm } from '@/components/ads/AdForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateAdPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-2xl py-8 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold text-white">Create a New Ad</h1>
      </div>
      <div className="glass-card p-8 rounded-xl">
        <p className="text-gray-400 mb-6">Fill out the form below to submit your ad for admin approval. There is a fee associated with posting an ad.</p>
        <AdForm />
      </div>
    </div>
  );
};

export default CreateAdPage;

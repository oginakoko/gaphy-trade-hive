
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageUsers = () => {
    const navigate = useNavigate();

    return (
        <>
            <Header />
            <div className="py-8 animate-fade-in-up container mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-4xl font-bold text-white">Manage Users</h1>
                </div>
                <div className="glass-card p-6 text-center">
                    <p className="text-white text-lg">User management (ban, grant admin) is coming soon!</p>
                    <p className="text-gray-400 mt-2">I can build this feature for you next. Just ask!</p>
                </div>
            </div>
        </>
    );
};

export default ManageUsers;


import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const Auth = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { session, loading } = useAuth();

    useEffect(() => {
        if (!loading && session) {
            const redirectUrl = searchParams.get('redirect') || '/analysis';
            navigate(redirectUrl);
        }
    }, [session, loading, navigate, searchParams]);

    return (
        <>
            <Header />
            <div className="flex justify-center items-center py-16 animate-fade-in-up">
                <div className="w-full max-w-md p-8 glass-card rounded-xl">
                    <h2 className="text-2xl font-bold text-white text-center mb-6">Sign In / Sign Up</h2>
                    <SupabaseAuth
                        supabaseClient={supabase}
                        appearance={{ theme: ThemeSupa }}
                        theme="dark"
                        providers={['github', 'google']}
                        socialLayout="horizontal"
                    />
                </div>
            </div>
        </>
    );
};

export default Auth;

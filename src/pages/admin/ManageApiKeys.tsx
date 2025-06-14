
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Key, Loader2, Save, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const GEMINI_API_KEY_ID = 'GEMINI_API_KEY';

const ManageApiKeys = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [apiKey, setApiKey] = useState('');
    const [isTableMissing, setIsTableMissing] = useState(false);

    const { data: currentKey, isLoading, error } = useQuery({
        queryKey: ['api_key', GEMINI_API_KEY_ID],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', GEMINI_API_KEY_ID)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                throw new Error(error.message);
            }
            return data?.value || '';
        },
        retry: (failureCount, error: any) => {
            if (error?.message?.includes('relation "public.app_config" does not exist')) {
                return false;
            }
            return failureCount < 2;
        },
    });

    useEffect(() => {
        if (error && (error as any).message?.includes('relation "public.app_config" does not exist')) {
            setIsTableMissing(true);
        }
    }, [error]);

    useEffect(() => {
        if (currentKey) {
            setApiKey(currentKey);
        }
    }, [currentKey]);

    const { mutate: saveApiKey, isPending: isSaving } = useMutation({
        mutationFn: async (keyToSave: string) => {
            const { error } = await supabase
                .from('app_config')
                .upsert({ key: GEMINI_API_KEY_ID, value: keyToSave });

            if (error) throw new Error(error.message);
        },
        onSuccess: () => {
            toast.success('API Key saved successfully.');
            queryClient.invalidateQueries({ queryKey: ['api_key', GEMINI_API_KEY_ID] });
        },
        onError: (error) => {
            toast.error(`Failed to save API Key: ${error.message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        saveApiKey(apiKey);
    };

    const maskApiKey = (key: string | undefined) => {
        if (!key) return 'Not set';
        if (key.length <= 8) return '********';
        return `${key.slice(0, 4)}...${key.slice(-4)}`;
    };

    const SetupInstructions = () => {
        const sqlToRun = `
-- 1. Create the app_config table
CREATE TABLE public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create a helper function to check if a user is an admin
-- This assumes you have a 'profiles' table with a 'role' column.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Enable Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for admins to manage keys
CREATE POLICY "Allow admins full access"
ON public.app_config
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Create policy for all authenticated users to read keys
CREATE POLICY "Allow authenticated users to read"
ON public.app_config
FOR SELECT
TO authenticated
USING (true);
`;
        return (
            <>
                <Header />
                <div className="py-8 animate-fade-in-up container mx-auto px-4">
                    <div className="flex items-center gap-4 mb-8">
                        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <h1 className="text-4xl font-bold text-white">Manage API Keys - Setup Required</h1>
                    </div>
                    <Card className="glass-card max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white"><Terminal className="w-5 h-5 text-brand-green"/> Database Setup</CardTitle>
                            <CardDescription>
                                The 'app_config' table is missing. Please run the following SQL in your Supabase SQL Editor to set it up.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="default" className="bg-brand-gray-200 border-brand-gray-300">
                                <AlertTitle className="text-white">SQL Script to Run</AlertTitle>
                                <AlertDescription>
                                    <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-black p-4 text-sm text-green-400 font-mono">
                                        <code>{sqlToRun.trim()}</code>
                                    </pre>
                                    <p className="mt-4 text-gray-300">After running this script in your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-green">Supabase Dashboard</a>, refresh this page.</p>
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    };

    if (isTableMissing) {
        return <SetupInstructions />;
    }

    return (
        <>
            <Header />
            <div className="py-8 animate-fade-in-up container mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Button>
                    <h1 className="text-4xl font-bold text-white">Manage API Keys</h1>
                </div>

                <Card className="glass-card max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white"><Key className="w-5 h-5 text-brand-green"/> Google Gemini API Key</CardTitle>
                        <CardDescription>
                            This key will be used for all AI features across the application. 
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-300">Current Key</p>
                            {isLoading && !currentKey ? (
                                <Loader2 className="h-4 w-4 animate-spin mt-1" />
                            ) : (
                                <p className="font-mono text-sm text-gray-400 font-semibold">{maskApiKey(currentKey)}</p>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
                                    Set or Update API Key
                                </label>
                                <Input 
                                    id="apiKey"
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your Google Gemini API Key"
                                    className="bg-brand-gray-200 border-brand-gray-300 text-white"
                                    disabled={isSaving}
                                />
                            </div>
                            <Button type="submit" disabled={isSaving || !apiKey || apiKey === currentKey}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Key
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ManageApiKeys;

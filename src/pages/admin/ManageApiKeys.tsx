
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Key, Loader2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const GEMINI_API_KEY_ID = 'GEMINI_API_KEY';

const ManageApiKeys = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [apiKey, setApiKey] = useState('');

    const { data: currentKey, isLoading } = useQuery({
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
    });

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
                            For best security, this should be set as a Supabase secret and used via Edge Functions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-300">Current Key</p>
                            {isLoading ? (
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


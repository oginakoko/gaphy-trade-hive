import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import TradeIdeaForm from '@/components/trade-ideas/TradeIdeaForm';
import { TradeIdea } from '@/types';

const fetchTradeIdea = async (id: string): Promise<TradeIdea> => {
  const { data, error } = await supabase
    .from('trade_ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as TradeIdea;
};

const CreateTradeIdea = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: tradeIdea, isLoading, isError } = useQuery({
    queryKey: ['tradeIdea', id],
    queryFn: () => fetchTradeIdea(id!),
    enabled: !!id,
  });

  if (isLoading && id) {
    return <div>Loading...</div>;
  }

  if (isError && id) {
    return <div>Error loading trade idea.</div>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-white">{id ? 'Update Trade Idea' : 'Create Trade Idea'}</h1>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                Back
              </Button>
            </div>
            <TradeIdeaForm setOpen={() => navigate(id ? `/trade-ideas/${id}` : '/analysis')} initialData={tradeIdea || null} />
          </div>
        </div>
      </main>
    </>
  );
};

export default CreateTradeIdea;

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditTradeIdea = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/create-trade-idea/${id}`, { replace: true });
  }, [id, navigate]);

  return null;
};

export default EditTradeIdea;

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Client } from '../types';
import { ClientForm } from './ClientForm';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

export function ClientFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState<Partial<Client>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadClient();
    }
  }, [id]);

  async function loadClient() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) setClient(data);
    } catch (error) {
      console.error('Error loading client:', error);
      alert(t('common.error.generic'));
      navigate('/clients');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(updatedClient: Partial<Client>) {
    try {
      setIsLoading(true);
      const clientData = {
        ...updatedClient,
        updated_at: new Date().toISOString()
      };

      const { error } = id
        ? await supabase
            .from('clients')
            .update(clientData)
            .eq('id', id)
        : await supabase
            .from('clients')
            .insert([clientData]);

      if (error) throw error;
      navigate('/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      alert(t('common.error.generic'));
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-4">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {id ? t('client.edit') : t('client.new')}
        </h1>
        <button
          onClick={() => navigate('/clients')}
          className="inline-flex items-center px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.actions.back')}
        </button>
      </div>

      <ClientForm
        client={client}
        onSave={handleSave}
        onCancel={() => navigate('/clients')}
      />
    </div>
  );
}
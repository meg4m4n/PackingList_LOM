import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Client } from '../types';

interface ClientFormProps {
  client: Partial<Client>;
  onSave: (client: Partial<Client>) => void;
  onCancel?: () => void;
  standalone?: boolean;
}

export function ClientForm({ client: initialClient, onSave, onCancel, standalone = true }: ClientFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
      state: '',
      country: ''
    },
    ...initialClient
  });

  useEffect(() => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        postalCode: '',
        city: '',
        state: '',
        country: ''
      },
      ...initialClient
    });
  }, [initialClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      const updatedData = {
        ...formData,
        [parent]: {
          ...(formData[parent as keyof Client] || {}),
          [child]: value
        }
      };
      setFormData(updatedData);
      if (!standalone) {
        onSave(updatedData);
      }
    } else {
      const updatedData = {
        ...formData,
        [name]: value
      };
      setFormData(updatedData);
      if (!standalone) {
        onSave(updatedData);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name?.trim() || 
        !formData.email?.trim() || 
        !formData.phone?.trim() || 
        !formData.address?.street?.trim() ||
        !formData.address?.postalCode?.trim() ||
        !formData.address?.city?.trim() ||
        !formData.address?.state?.trim() ||
        !formData.address?.country?.trim()) {
      alert(t('common.error.required'));
      return;
    }

    onSave(formData);
  };

  const formFields = (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            {t('client.fields.name')} *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('client.fields.email')} *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            {t('client.fields.phone')} *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            value={formData.phone || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('client.fields.address.title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                {t('client.fields.address.street')} *
              </label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                required
                value={formData.address?.street || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700">
                {t('client.fields.address.postalCode')} *
              </label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                required
                value={formData.address?.postalCode || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                {t('client.fields.address.city')} *
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                required
                value={formData.address?.city || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                {t('client.fields.address.state')} *
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                required
                value={formData.address?.state || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                {t('client.fields.address.country')} *
              </label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                required
                value={formData.address?.country || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!standalone) {
    return <div className="space-y-6">{formFields}</div>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        {formFields}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              {t('common.actions.cancel')}
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('common.actions.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
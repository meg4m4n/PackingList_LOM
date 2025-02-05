import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, BoxModel, Size, SizeQuantity } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface BoxFormProps {
  box: Partial<Box>;
  totalBoxes: number;
  onSave: (box: Partial<Box>) => void;
  onClear: () => void;
  isEditing?: boolean;
}

const DEFAULT_SIZES: Size[] = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const emptyModel = (): Partial<BoxModel> => ({
  id: crypto.randomUUID(),
  modelReference: '',
  modelDescription: '',
  color: '',
  sizeQuantities: []
});

export function BoxForm({ box, totalBoxes, onSave, onClear, isEditing }: BoxFormProps) {
  const { t } = useTranslation();
  const [models, setModels] = useState<Partial<BoxModel>[]>(box.models || [emptyModel()]);
  const [customSizes, setCustomSizes] = useState<Record<string, string>>(
    box.sizeDescriptions || DEFAULT_SIZES.reduce((acc, size) => ({ ...acc, [size]: size }), {})
  );

  const handleBoxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['netWeight', 'grossWeight', 'dimensions.length', 'dimensions.width', 'dimensions.height'];
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      onSave({
        ...box,
        [parent]: {
          ...box[parent as keyof Box],
          [child]: numericFields.includes(name) ? Number(value) : value
        }
      });
    } else {
      onSave({
        ...box,
        [name]: numericFields.includes(name) ? Number(value) : value,
        boxNumber: box.boxNumber || totalBoxes
      });
    }
  };

  const handleModelChange = (modelIndex: number, field: keyof BoxModel, value: string) => {
    const updatedModels = [...models];
    updatedModels[modelIndex] = {
      ...updatedModels[modelIndex],
      [field]: value
    };
    setModels(updatedModels);
    onSave({
      ...box,
      models: updatedModels,
      sizeDescriptions: customSizes
    });
  };

  const handleQuantityChange = (modelIndex: number, size: Size, quantity: string) => {
    const newQuantity = parseInt(quantity) || 0;
    const updatedModels = [...models];
    const currentModel = updatedModels[modelIndex];
    const currentSizeQuantities = currentModel.sizeQuantities || [];
    
    const existingIndex = currentSizeQuantities.findIndex(sq => sq.size === size);
    let newSizeQuantities: SizeQuantity[];

    if (existingIndex >= 0) {
      newSizeQuantities = [...currentSizeQuantities];
      if (newQuantity > 0) {
        newSizeQuantities[existingIndex] = { size, quantity: newQuantity };
      } else {
        newSizeQuantities.splice(existingIndex, 1);
      }
    } else if (newQuantity > 0) {
      newSizeQuantities = [...currentSizeQuantities, { size, quantity: newQuantity }];
    } else {
      newSizeQuantities = currentSizeQuantities;
    }

    updatedModels[modelIndex] = {
      ...currentModel,
      sizeQuantities: newSizeQuantities
    };

    setModels(updatedModels);
    onSave({
      ...box,
      models: updatedModels,
      sizeDescriptions: customSizes
    });
  };

  const handleSizeDescriptionChange = (size: Size, description: string) => {
    const newCustomSizes = {
      ...customSizes,
      [size]: description
    };
    setCustomSizes(newCustomSizes);
    onSave({
      ...box,
      sizeDescriptions: newCustomSizes
    });
  };

  const handleClearForm = () => {
    setModels([emptyModel()]);
    onClear();
  };

  const addModel = () => {
    setModels([...models, emptyModel()]);
  };

  const removeModel = (modelIndex: number) => {
    const updatedModels = models.filter((_, index) => index !== modelIndex);
    setModels(updatedModels);
    onSave({
      ...box,
      models: updatedModels
    });
  };

  // Calculate totals for the current box
  const totals = models.reduce((acc, model) => {
    model.sizeQuantities?.forEach(sq => {
      if (!acc[sq.size]) acc[sq.size] = 0;
      acc[sq.size] += sq.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {isEditing ? t('box.edit') : t('box.new')}
        </h3>
        <button
          type="button"
          onClick={handleClearForm}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {t('common.actions.clear')}
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('box.sizeDescriptions')}</h4>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SIZES.map(size => (
            <div key={size} className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 w-12">{size}:</label>
              <input
                type="text"
                value={customSizes[size]}
                onChange={(e) => handleSizeDescriptionChange(size, e.target.value)}
                className="w-20 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {models.map((model, modelIndex) => (
        <div key={model.id} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{t('box.model.title')} {modelIndex + 1}</h3>
            {models.length > 1 && (
              <button
                type="button"
                onClick={() => removeModel(modelIndex)}
                className="text-red-600 hover:text-red-800"
                title={t('box.model.remove')}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor={`modelReference-${modelIndex}`} className="block text-sm font-medium text-gray-700">
                {t('box.fields.styleReference')}
              </label>
              <input
                type="text"
                id={`modelReference-${modelIndex}`}
                value={model.modelReference || ''}
                onChange={(e) => handleModelChange(modelIndex, 'modelReference', e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor={`modelDescription-${modelIndex}`} className="block text-sm font-medium text-gray-700">
                {t('box.fields.description')}
              </label>
              <input
                type="text"
                id={`modelDescription-${modelIndex}`}
                value={model.modelDescription || ''}
                onChange={(e) => handleModelChange(modelIndex, 'modelDescription', e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor={`color-${modelIndex}`} className="block text-sm font-medium text-gray-700">
                {t('box.fields.color')}
              </label>
              <input
                type="text"
                id={`color-${modelIndex}`}
                value={model.color || ''}
                onChange={(e) => handleModelChange(modelIndex, 'color', e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('box.fields.quantitiesPerSize')}
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SIZES.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <label htmlFor={`quantity-${modelIndex}-${size}`} className="text-sm text-gray-600">
                    {customSizes[size]}:
                  </label>
                  <input
                    type="number"
                    id={`quantity-${modelIndex}-${size}`}
                    min="0"
                    value={model.sizeQuantities?.find(sq => sq.size === size)?.quantity || ''}
                    onChange={(e) => handleQuantityChange(modelIndex, size, e.target.value)}
                    className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addModel}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Plus className="h-5 w-5 mr-2" />
        {t('box.model.add')}
      </button>

      <div className="grid grid-cols-5 gap-4">
        <div>
          <label htmlFor="netWeight" className="block text-sm font-medium text-gray-700">
            {t('box.fields.weight.net')}
          </label>
          <input
            type="number"
            step="0.01"
            name="netWeight"
            id="netWeight"
            value={box.netWeight || ''}
            onChange={handleBoxChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="grossWeight" className="block text-sm font-medium text-gray-700">
            {t('box.fields.weight.gross')}
          </label>
          <input
            type="number"
            step="0.01"
            name="grossWeight"
            id="grossWeight"
            value={box.grossWeight || ''}
            onChange={handleBoxChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="length" className="block text-sm font-medium text-gray-700">
            {t('box.fields.dimensions.length')}
          </label>
          <input
            type="number"
            step="0.1"
            name="dimensions.length"
            id="length"
            value={box.dimensions?.length || ''}
            onChange={handleBoxChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="width" className="block text-sm font-medium text-gray-700">
            {t('box.fields.dimensions.width')}
          </label>
          <input
            type="number"
            step="0.1"
            name="dimensions.width"
            id="width"
            value={box.dimensions?.width || ''}
            onChange={handleBoxChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700">
            {t('box.fields.dimensions.height')}
          </label>
          <input
            type="number"
            step="0.1"
            name="dimensions.height"
            id="height"
            value={box.dimensions?.height || ''}
            onChange={handleBoxChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {Object.keys(totals).length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('box.summary')}</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('box.fields.sizes')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('box.fields.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(totals).map(([size, quantity]) => (
                  <tr key={size}>
                    <td className="px-4 py-2 text-sm text-gray-900">{customSizes[size]}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 text-right">{quantity}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{t('summary.totalItems')}</td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                    {Object.values(totals).reduce((sum, qty) => sum + qty, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
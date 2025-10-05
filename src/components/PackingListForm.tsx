import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PackingList, Box, Client, Carrier } from '../types';
import { ClientForm } from './ClientForm';
import { BoxForm } from './BoxForm';
import { Package2, Printer, Eye, ArrowLeft, Plus, Search, UserPlus } from 'lucide-react';
import { printDocument } from '../services/printService';
import { generatePackingListCode } from '../utils/generatePackingListCode';
import { supabase } from '../lib/supabase';

const CARRIERS: Carrier[] = ['DHL', 'FedEx', 'UPS', 'TORRESTIR', 'Other'];

export function PackingListForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState<Partial<Client>>({});
  const [boxes, setBoxes] = useState<Partial<Box>[]>([]);
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>([]);
  const [carrier, setCarrier] = useState<Carrier>('DHL');
  const [customCarrier, setCustomCarrier] = useState<string>('');
  const [currentBox, setCurrentBox] = useState<Partial<Box>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sameTrackingNumber, setSameTrackingNumber] = useState(false);
  const [commonTrackingNumber, setCommonTrackingNumber] = useState('');
  const [showBoxForm, setShowBoxForm] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [individualTrackingNumbers, setIndividualTrackingNumbers] = useState<string[]>([]);
  const [po, setPo] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadPackingList();
    }
  }, [id]);

  useEffect(() => {
    if (clientSearchQuery) {
      searchClients();
    } else {
      setSearchResults([]);
    }
  }, [clientSearchQuery]);

  async function searchClients() {
    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .or(`name.ilike.%${clientSearchQuery}%,email.ilike.%${clientSearchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching clients:', err);
    } finally {
      setIsSearching(false);
    }
  }

  async function loadPackingList() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('code', id)
      .single();

    if (error) {
      console.error('Error loading packing list:', error);
      return;
    }

    if (data) {
      setClient(data.client_data);
      setBoxes(data.boxes_data);
      setTrackingNumbers(data.tracking_numbers);
      setCarrier(data.carrier as Carrier);
      setCustomCarrier(data.custom_carrier || '');
      setPo(data.po || '');
      setSameTrackingNumber(data.tracking_numbers?.length === 1);
      setCommonTrackingNumber(data.tracking_numbers?.[0] || '');
      setIndividualTrackingNumbers(data.tracking_numbers || []);
    }
    setIsLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client.name || !client.address || boxes.length === 0) {
      alert(t('common.error.required'));
      return;
    }

    setIsLoading(true);

    const finalTrackingNumbers = sameTrackingNumber
      ? Array(boxes.length).fill(commonTrackingNumber)
      : individualTrackingNumbers;

    const code = id || generatePackingListCode();
    const packingList = {
      code,
      client_data: client,
      boxes_data: boxes,
      tracking_numbers: finalTrackingNumbers,
      carrier,
      custom_carrier: carrier === 'Other' ? customCarrier : null,
      po: po || null,
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = id
        ? await supabase
            .from('packing_lists')
            .update(packingList)
            .eq('code', id)
        : await supabase
            .from('packing_lists')
            .insert([packingList]);

      if (error) throw error;

      setHasUnsavedChanges(false);
      navigate('/');
    } catch (error) {
      console.error('Error saving packing list:', error);
      alert(t('common.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewBox = () => {
    setCurrentBox({});
    setShowBoxForm(true);
  };

  const handleSaveBox = (box: Partial<Box>) => {
    setCurrentBox(box);
    setHasUnsavedChanges(true);
  };

  const handleAddBox = () => {
    if (Object.keys(currentBox).length > 0) {
      const boxIndex = boxes.findIndex((b) => b.id === currentBox.id);
      if (boxIndex >= 0) {
        const updatedBoxes = [...boxes];
        updatedBoxes[boxIndex] = {
          ...currentBox,
          sizeDescriptions: currentBox.sizeDescriptions || {}
        };
        setBoxes(updatedBoxes);
      } else {
        setBoxes([...boxes, { 
          ...currentBox, 
          id: crypto.randomUUID(),
          sizeDescriptions: currentBox.sizeDescriptions || {}
        }]);
      }
      setCurrentBox({});
      setShowBoxForm(false);
      setHasUnsavedChanges(true);
    }
  };

  const handleCancelBox = () => {
    setCurrentBox({});
    setShowBoxForm(false);
  };

  const handleSaveClient = (updatedClient: Partial<Client>) => {
    setClient(updatedClient);
    setHasUnsavedChanges(true);
  };

  const handleSelectClient = (selectedClient: Client) => {
    setClient(selectedClient);
    setShowClientSearch(false);
    setClientSearchQuery('');
    setSearchResults([]);
    setHasUnsavedChanges(true);
  };

  const handleNewClient = async (newClient: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([newClient])
        .select()
        .single();

      if (error) throw error;

      setClient(data);
      setShowNewClientForm(false);
      setShowClientSearch(false);
      setHasUnsavedChanges(true);
    } catch (err) {
      console.error('Error creating client:', err);
      alert(t('common.error.generic'));
    }
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      if (window.confirm(t('packingList.form.unsavedChanges'))) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const handlePrint = (type: 'a4' | 'label') => {
    const code = id || generatePackingListCode();
    const currentPackingList = {
      code,
      client: client as Client,
      boxes: boxes as Box[],
      trackingNumbers: sameTrackingNumber
        ? Array(boxes.length).fill(commonTrackingNumber)
        : trackingNumbers,
      carrier,
      customCarrier: carrier === 'Other' ? customCarrier : undefined,
      po: po || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    } as PackingList;
    
    printDocument(type, currentPackingList);
  };

  const handleSaveClientToDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .upsert([{
          ...client,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setClient(data);
      alert(t('common.status.saved'));
    } catch (err) {
      console.error('Error saving client:', err);
      alert(t('common.error.generic'));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">{t('client.title')}</h2>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleSaveClientToDatabase}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('client.save')}
              </button>
              <button
                type="button"
                onClick={() => setShowClientSearch(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Search className="h-5 w-5 mr-2" />
                {t('client.search')}
              </button>
            </div>
          </div>

          {showClientSearch && (
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    placeholder={t('client.searchPlaceholder')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewClientForm(true);
                    setShowClientSearch(false);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  {t('client.new')}
                </button>
              </div>

              {searchResults.length > 0 && (
                <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <li
                      key={result.id}
                      className="py-3 px-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectClient(result)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{result.name}</p>
                          <p className="text-sm text-gray-500">{result.email}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {result.address.city}, {result.address.country}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {showNewClientForm ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t('client.new')}</h3>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {t('common.actions.cancel')}
                </button>
              </div>
              <ClientForm
                client={{}}
                onSave={handleNewClient}
                standalone={true}
              />
            </div>
          ) : (
            <ClientForm client={client} onSave={handleSaveClient} standalone={false} />
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">{t('box.title')}</h2>
            {!showBoxForm && (
              <button
                type="button"
                onClick={handleNewBox}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t('box.new')}
              </button>
            )}
          </div>

          {showBoxForm && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-900">
                  {currentBox.id ? t('box.edit') : t('box.new')}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelBox}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {t('common.actions.cancel')}
                </button>
              </div>
              <BoxForm
                box={currentBox}
                totalBoxes={boxes.length + (currentBox.id ? 0 : 1)}
                onSave={handleSaveBox}
                onClear={handleCancelBox}
                isEditing={!!currentBox.id}
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddBox}
                  disabled={!Object.keys(currentBox).length}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    Object.keys(currentBox).length ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Package2 className="h-5 w-5 mr-2" />
                  {currentBox.id ? t('common.actions.save') : t('common.actions.add')}
                </button>
              </div>
            </div>
          )}

          {boxes.length > 0 && !showBoxForm && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t('box.addedBoxes')}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">{t('box.fields.boxNumber')}</th>
                      <th className="px-4 py-2">{t('box.fields.style')}</th>
                      <th className="px-4 py-2">{t('box.fields.color')}</th>
                      <th className="px-4 py-2">{t('box.fields.sizes')}</th>
                      <th className="px-4 py-2">{t('box.fields.total')}</th>
                      <th className="px-4 py-2">{t('box.fields.measurements')}</th>
                      <th className="px-4 py-2">{t('common.actions.edit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {boxes.map((box, index) => {
                      const totalItems = box.models?.reduce((sum, model) => 
                        sum + (model.sizeQuantities?.reduce((s, sq) => s + sq.quantity, 0) || 0), 0) || 0;
                      
                      return (
                        <tr key={box.id}>
                          <td className="px-4 py-2">{index + 1}/{boxes.length}</td>
                          <td className="px-4 py-2">
                            {box.models?.map(model => (
                              <div key={model.id}>{model.modelReference}</div>
                            ))}
                          </td>
                          <td className="px-4 py-2">
                            {box.models?.map(model => (
                              <div key={model.id}>{model.color}</div>
                            ))}
                          </td>
                          <td className="px-4 py-2">
                            {box.models?.map(model => (
                              <div key={model.id}>
                                {model.sizeQuantities
                                  ?.filter(sq => sq.quantity > 0)
                                  ?.map(sq => `${box.sizeDescriptions?.[sq.size] || sq.size}:${sq.quantity}`)
                                  ?.join(' ')}
                              </div>
                            ))}
                          </td>
                          <td className="px-4 py-2 text-right">{totalItems}</td>
                          <td className="px-4 py-2">
                            {box.dimensions && (
                              <>
                                {box.dimensions.length}x{box.dimensions.width}x{box.dimensions.height}cm
                                <br />
                                {box.grossWeight}kg
                              </>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentBox(box);
                                setShowBoxForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {t('common.actions.edit')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">{t('shipping.title')}</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="po" className="block text-sm font-medium text-gray-700">
                PO (Purchase Order)
              </label>
              <input
                type="text"
                id="po"
                value={po}
                onChange={(e) => {
                  setPo(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter PO number"
              />
            </div>

            <div>
              <label htmlFor="carrier" className="block text-sm font-medium text-gray-700">
                {t('shipping.carrier')}
              </label>
              <select
                id="carrier"
                value={carrier}
                onChange={(e) => {
                  setCarrier(e.target.value as Carrier);
                  setHasUnsavedChanges(true);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {carrier === 'Other' && (
              <div>
                <label htmlFor="customCarrier" className="block text-sm font-medium text-gray-700">
                  {t('shipping.customCarrier')}
                </label>
                <input
                  type="text"
                  id="customCarrier"
                  value={customCarrier}
                  onChange={(e) => {
                    setCustomCarrier(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required={carrier === 'Other'}
                />
              </div>
            )}

            <div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="sameTrackingNumber"
                  checked={sameTrackingNumber}
                  onChange={(e) => {
                    setSameTrackingNumber(e.target.checked);
                    if (e.target.checked) {
                      setIndividualTrackingNumbers([]);
                    } else {
                      setCommonTrackingNumber('');
                    }
                    setHasUnsavedChanges(true);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sameTrackingNumber" className="ml-2 block text-sm text-gray-900">
                  {t('shipping.tracking.same')}
                </label>
              </div>

              {sameTrackingNumber ? (
                <div>
                  <label htmlFor="commonTrackingNumber" className="block text-sm font-medium text-gray-700">
                    {t('shipping.tracking.number')}
                  </label>
                  <input
                    type="text"
                    id="commonTrackingNumber"
                    value={commonTrackingNumber}
                    onChange={(e) => {
                      setCommonTrackingNumber(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('shipping.tracking.title')}
                  </label>
                  <div className="space-y-2">
                    {boxes.map((box, index) => (
                      <div key={box.id} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 w-20">{t('box.fields.boxNumber')} {index + 1}:</span>
                        <input
                          type="text"
                          value={individualTrackingNumbers[index] || ''}
                          onChange={(e) => {
                            const newTrackingNumbers = [...individualTrackingNumbers];
                            newTrackingNumbers[index] = e.target.value;
                            setIndividualTrackingNumbers(newTrackingNumbers);
                            setHasUnsavedChanges(true);
                          }}
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder={t('shipping.tracking.placeholder', { number: index + 1 })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => handlePrint('a4')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Printer className="h-5 w-5 mr-2" />
              {t('common.actions.print.a4')}
            </button>
            <button
              type="button"
              onClick={() => handlePrint('label')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-5 w-5 mr-2" />
              {t('common.actions.print.label')}
            </button>
          </div>

          <div className="space-x-4">
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t('common.actions.back')}
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('common.actions.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
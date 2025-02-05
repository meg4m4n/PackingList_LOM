import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PackingList } from '../types';
import { supabase } from '../lib/supabase';
import { Package, Edit, Trash2, Plus, Search, Eye, Printer, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { printDocument } from '../services/printService';
import { useTranslation } from 'react-i18next';
import { QRCodeScanner } from './QRCodeScanner';

export function PackingListsOverview() {
  const { t } = useTranslation();
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLists, setFilteredLists] = useState<PackingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    loadPackingLists();
  }, []);

  useEffect(() => {
    const filtered = packingLists.filter(list => 
      list.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLists(filtered);
  }, [searchQuery, packingLists]);

  async function loadPackingLists() {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('packing_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setPackingLists(data.map(row => ({
          ...row,
          code: row.code,
          client: row.client_data,
          boxes: row.boxes_data,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        })));
      }
    } catch (err) {
      console.error('Error loading packing lists:', err);
      setError(t('common.error.generic'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(code: string) {
    if (!deleteId) {
      setDeleteId(code);
      return;
    }

    if (code === deleteId) {
      try {
        const { error } = await supabase
          .from('packing_lists')
          .delete()
          .eq('code', code);

        if (error) {
          throw error;
        }

        await loadPackingLists();
      } catch (err) {
        console.error('Error deleting packing list:', err);
        alert(t('common.error.generic'));
      }
    }

    setDeleteId(null);
  }

  const handleQuickView = (packingList: PackingList) => {
    if (!packingList.boxes || !packingList.client) {
      console.error('Invalid packing list data');
      return;
    }
    printDocument('a4', packingList);
  };

  const handleScan = (code: string) => {
    setSearchQuery(code);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-red-800">
          {error}
          <button
            onClick={loadPackingLists}
            className="ml-4 text-red-600 hover:text-red-800 underline"
          >
            {t('common.error.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('packingList.title')}</h1>
        <Link
          to="/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('packingList.new')}
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('packingList.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            onClick={() => setShowScanner(true)}
            className="ml-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <QrCode className="h-5 w-5 mr-2" />
            {t('qrcode.scan.button')}
          </button>
        </div>
      </div>

      {showScanner && (
        <QRCodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredLists.map((list) => (
            <li key={list.code}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-gray-400 mr-3" />
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {list.code}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleQuickView(list)}
                      className="inline-flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      title={t('common.actions.print.a4')}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => printDocument('label', list)}
                      className="inline-flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      title={t('common.actions.print.label')}
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <Link
                      to={`/edit/${list.code}`}
                      className="inline-flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(list.code)}
                      className="inline-flex items-center p-2 text-sm text-red-600 hover:bg-red-100 rounded-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      {list.client.name}
                    </p>
                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                      {list.boxes.length} {t('packingList.boxes')}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      {t('packingList.createdOn')} {format(list.createdAt, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                {deleteId === list.code && (
                  <div className="mt-2 bg-red-50 p-2 rounded-md">
                    <p className="text-sm text-red-800">
                      {t('packingList.delete.confirm')}
                    </p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        onClick={() => handleDelete(list.code)}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        {t('packingList.delete.yes')}
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {t('packingList.delete.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
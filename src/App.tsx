import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Package, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PackingListsOverview } from './components/PackingListsOverview';
import { PackingListForm } from './components/PackingListForm';
import { ClientList } from './components/ClientList';
import { ClientFormPage } from './components/ClientFormPage';

function App() {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('app.title')}
                </h1>
              </div>
              <nav className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('app.nav.packingLists')}
                </Link>
                <Link
                  to="/clients"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {t('app.nav.clients')}
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<PackingListsOverview />} />
            <Route path="/new" element={<PackingListForm />} />
            <Route path="/edit/:id" element={<PackingListForm />} />
            <Route path="/clients" element={<ClientList />} />
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/edit/:id" element={<ClientFormPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
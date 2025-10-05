import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Package, Users, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PackingListsOverview } from './components/PackingListsOverview';
import { PackingListForm } from './components/PackingListForm';
import { ClientList } from './components/ClientList';
import { ClientFormPage } from './components/ClientFormPage';
import { supabase } from './lib/supabase';

function App() {
  const { t } = useTranslation();

  const handleExportBackup = async () => {
    try {
      // Fetch all data from all tables
      const [packingListsResult, clientsResult] = await Promise.all([
        supabase.from('packing_lists').select('*'),
        supabase.from('clients').select('*')
      ]);

      if (packingListsResult.error) throw packingListsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      // Generate SQL statements
      let sqlContent = '-- Lomartex Database Backup\n';
      sqlContent += `-- Generated at ${new Date().toISOString()}\n`;
      sqlContent += '-- Compatible with PostgreSQL 9.2\n\n';

      // Start transaction
      sqlContent += 'BEGIN;\n\n';

      // Clients table
      sqlContent += '-- Clients table\n';
      sqlContent += 'CREATE TABLE IF NOT EXISTS clients (\n';
      sqlContent += '    id uuid PRIMARY KEY,\n';
      sqlContent += '    name text NOT NULL,\n';
      sqlContent += '    email text NOT NULL,\n';
      sqlContent += '    phone text NOT NULL,\n';
      sqlContent += '    address json NOT NULL,\n'; // Using json instead of jsonb
      sqlContent += '    created_at timestamp with time zone DEFAULT now(),\n';
      sqlContent += '    updated_at timestamp with time zone DEFAULT now()\n';
      sqlContent += ');\n\n';

      // Insert clients data
      if (clientsResult.data && clientsResult.data.length > 0) {
        sqlContent += '-- Clients data\n';
        clientsResult.data.forEach(client => {
          const escapedName = client.name.replace(/'/g, "''");
          const escapedEmail = client.email.replace(/'/g, "''");
          const escapedPhone = client.phone.replace(/'/g, "''");
          const escapedAddress = JSON.stringify(client.address).replace(/'/g, "''");
          
          sqlContent += 'INSERT INTO clients (id, name, email, phone, address, created_at, updated_at)\n';
          sqlContent += `VALUES ('${client.id}', '${escapedName}', '${escapedEmail}', '${escapedPhone}', '${escapedAddress}'::json, '${client.created_at}', '${client.updated_at}');\n`;
        });
        sqlContent += '\n';
      }

      // Packing lists table
      sqlContent += '-- Packing lists table\n';
      sqlContent += 'CREATE TABLE IF NOT EXISTS packing_lists (\n';
      sqlContent += '    code text PRIMARY KEY,\n';
      sqlContent += '    client_data json NOT NULL,\n'; // Using json instead of jsonb
      sqlContent += '    boxes_data json NOT NULL,\n'; // Using json instead of jsonb
      sqlContent += '    tracking_numbers text[],\n';
      sqlContent += '    carrier text NOT NULL,\n';
      sqlContent += '    custom_carrier text,\n';
      sqlContent += '    created_at timestamp with time zone DEFAULT now(),\n';
      sqlContent += '    updated_at timestamp with time zone DEFAULT now()\n';
      sqlContent += ');\n\n';

      // Insert packing lists data
      if (packingListsResult.data && packingListsResult.data.length > 0) {
        sqlContent += '-- Packing lists data\n';
        packingListsResult.data.forEach(list => {
          const escapedClientData = JSON.stringify(list.client_data).replace(/'/g, "''");
          const escapedBoxesData = JSON.stringify(list.boxes_data).replace(/'/g, "''");
          const escapedCode = list.code.replace(/'/g, "''");
          const escapedCarrier = list.carrier.replace(/'/g, "''");
          const escapedCustomCarrier = list.custom_carrier ? list.custom_carrier.replace(/'/g, "''") : null;
          
          sqlContent += 'INSERT INTO packing_lists (code, client_data, boxes_data, tracking_numbers, carrier, custom_carrier, created_at, updated_at)\n';
          sqlContent += `VALUES ('${escapedCode}', '${escapedClientData}'::json, '${escapedBoxesData}'::json, ${
            list.tracking_numbers && list.tracking_numbers.length > 0
              ? `ARRAY[${list.tracking_numbers.map(t => `'${t.replace(/'/g, "''")}'`).join(',')}]`
              : 'NULL::text[]'
          }, '${escapedCarrier}', ${escapedCustomCarrier ? `'${escapedCustomCarrier}'` : 'NULL'}, '${list.created_at}', '${list.updated_at}');\n`;
        });
        sqlContent += '\n';
      }

      // Commit transaction
      sqlContent += 'COMMIT;\n';

      // Create blob and trigger download
      const blob = new Blob([sqlContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lompl_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting backup:', error);
      alert(t('backup.error'));
    }
  };

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
                <button
                  onClick={handleExportBackup}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                  title={t('backup.export')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {t('backup.export')}
                </button>
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
/*
  # MySQL Compatibility Layer
  
  1. New Tables
    - clients
      - id (uuid)
      - name (text)
      - email (text)
      - phone (text)
      - address (jsonb)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - packing_lists
      - id (uuid)
      - code (text)
      - client_data (jsonb)
      - boxes_data (jsonb)
      - tracking_numbers (text[])
      - carrier (text)
      - custom_carrier (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Indexes
    - clients_email_idx
    - packing_lists_code_idx
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create packing_lists table
CREATE TABLE IF NOT EXISTS packing_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  client_data jsonb NOT NULL,
  boxes_data jsonb NOT NULL,
  tracking_numbers text[] DEFAULT '{}',
  carrier text NOT NULL,
  custom_carrier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients(email);
CREATE INDEX IF NOT EXISTS packing_lists_code_idx ON packing_lists(code);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON clients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON clients
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON clients
    FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON packing_lists
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON packing_lists
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON packing_lists
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON packing_lists
    FOR DELETE USING (true);
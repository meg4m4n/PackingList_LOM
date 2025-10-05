/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, not null)
      - `phone` (text, not null)
      - `address` (jsonb, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `clients` table
    - Add policies for public access (temporary, should be changed to authenticated users later)
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON clients
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for all users" ON clients
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON clients
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON clients
    FOR DELETE
    USING (true);
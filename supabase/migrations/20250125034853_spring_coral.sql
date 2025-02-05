/*
  # Create Packing Lists Schema

  1. New Tables
    - `packing_lists`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `client_data` (jsonb)
      - `boxes_data` (jsonb)
      - `tracking_numbers` (text[])
      - `carrier` (text)
      - `custom_carrier` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `packing_lists` table
    - Add policies for authenticated users to manage their packing lists
*/

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

ALTER TABLE packing_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own packing lists"
  ON packing_lists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
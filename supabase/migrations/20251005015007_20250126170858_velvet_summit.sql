/*
  # Fix RLS policies for packing_lists table

  1. Changes
    - Drop existing RLS policy
    - Add new policies for each operation type (SELECT, INSERT, UPDATE, DELETE)
    - Enable public access for all operations
    
  Note: We're allowing public access since authentication is not implemented yet
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage their own packing lists" ON packing_lists;

-- Create new policies for public access
CREATE POLICY "Enable read access for all users" ON packing_lists
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for all users" ON packing_lists
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON packing_lists
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON packing_lists
    FOR DELETE
    USING (true);
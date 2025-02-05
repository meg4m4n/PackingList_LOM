/*
  # Add shipping document support
  
  1. Changes
    - Add shipping_document column to packing_lists table to store PDF file information
    
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE packing_lists
ADD COLUMN IF NOT EXISTS shipping_document jsonb;

COMMENT ON COLUMN packing_lists.shipping_document IS 'Stores shipping document information including URL and metadata';
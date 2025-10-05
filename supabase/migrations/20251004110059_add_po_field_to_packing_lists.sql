/*
  # Add PO field to packing lists
  
  1. Changes
    - Add po (Purchase Order) column to packing_lists table
    
  2. Notes
    - PO is an optional text field for tracking purchase orders
    - This field will be displayed on printed documents (A4 and labels)
*/

ALTER TABLE packing_lists
ADD COLUMN IF NOT EXISTS po text;

COMMENT ON COLUMN packing_lists.po IS 'Purchase Order number or reference for tracking';
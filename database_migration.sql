-- Add order column to notes table for manual reordering
-- Run this in your Supabase SQL Editor

-- Add the order column
ALTER TABLE notes ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notes_order ON notes("order");

-- Initialize order values for existing notes (based on creation date)
UPDATE notes 
SET "order" = sub.row_num 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_num 
  FROM notes 
  WHERE "order" IS NULL
) sub 
WHERE notes.id = sub.id AND notes."order" IS NULL;

-- Optional: Create a function for atomic order swapping (recommended)
CREATE OR REPLACE FUNCTION swap_note_orders(
  note_id_1 UUID,
  new_order_1 INTEGER,
  note_id_2 UUID,
  new_order_2 INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Update both notes atomically
  UPDATE notes SET "order" = new_order_1 WHERE id = note_id_1;
  UPDATE notes SET "order" = new_order_2 WHERE id = note_id_2;
END;
$$ LANGUAGE plpgsql;

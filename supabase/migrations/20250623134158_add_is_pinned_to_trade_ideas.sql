-- Add is_pinned column to trade_ideas table
ALTER TABLE trade_ideas
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;

-- Optional: Add a down migration to revert the change
ALTER TABLE trade_ideas
DROP COLUMN is_pinned;
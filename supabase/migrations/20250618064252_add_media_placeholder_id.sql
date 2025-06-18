-- Add placeholder_id column to trade_idea_media table
ALTER TABLE trade_idea_media ADD COLUMN placeholder_id uuid;
CREATE INDEX idx_trade_idea_media_placeholder_id ON trade_idea_media(placeholder_id);

-- Update RLS policies
ALTER POLICY "Public read access" ON "public"."trade_idea_media"
    USING (true);

ALTER POLICY "Can insert own trade idea media" ON "public"."trade_idea_media"
    WITH CHECK (
        trade_idea_id IN (
            SELECT id FROM trade_ideas WHERE user_id = auth.uid()
        )
    );

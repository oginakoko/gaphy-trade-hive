DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'trade_idea_media'
        AND column_name = 'placeholder_id'
    ) THEN
        ALTER TABLE trade_idea_media ADD COLUMN placeholder_id uuid;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_trade_idea_media_placeholder_id'
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_trade_idea_media_placeholder_id ON trade_idea_media(placeholder_id);
    END IF;
END $$;

-- Update RLS policies
DO $$
BEGIN
    -- Check if policy "Public read access" exists before altering
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'trade_idea_media'
        AND policyname = 'Public read access'
    ) THEN
        ALTER POLICY "Public read access" ON "public"."trade_idea_media"
            USING (true);
    ELSE
        -- If policy doesn't exist, create it
        CREATE POLICY "Public read access" ON "public"."trade_idea_media"
            FOR SELECT USING (true);
    END IF;

    -- Check if policy "Can insert own trade idea media" exists before altering
    IF EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'trade_idea_media'
        AND policyname = 'Can insert own trade idea media'
    ) THEN
        ALTER POLICY "Can insert own trade idea media" ON "public"."trade_idea_media"
            WITH CHECK (
                trade_idea_id IN (
                    SELECT id FROM trade_ideas WHERE user_id = auth.uid()
                )
            );
    ELSE
        -- If policy doesn't exist, create it
        CREATE POLICY "Can insert own trade idea media" ON "public"."trade_idea_media"
            FOR INSERT WITH CHECK (
                trade_idea_id IN (
                    SELECT id FROM trade_ideas WHERE user_id = auth.uid()
                )
            );
    END IF;
END $$;

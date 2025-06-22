-- Add conditional constraint creation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_unique_recipient_reference_type'
    ) THEN
        ALTER TABLE notifications
        ADD CONSTRAINT notifications_unique_recipient_reference_type
        UNIQUE (recipient_id, reference_id, type);
    END IF;
END $$;
-- Add a unique constraint to prevent duplicate notifications for the same recipient, reference, and type
ALTER TABLE notifications
ADD CONSTRAINT notifications_unique_recipient_reference_type
UNIQUE (recipient_id, reference_id, type);
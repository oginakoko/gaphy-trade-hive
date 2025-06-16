-- Add a unique constraint to prevent duplicate notifications for the same recipient, reference, and type
ALTER TABLE notifications
ADD CONSTRAINT notifications_unique_recipient_reference_type
UNIQUE (recipient_id, reference_id, type);

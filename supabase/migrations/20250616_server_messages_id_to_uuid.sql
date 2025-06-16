-- MIGRATION: Change server_messages.id from int8 to uuid and ensure notifications.reference_id is uuid

-- 1. Add a new uuid column to server_messages
ALTER TABLE server_messages ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();

-- 2. Copy values from old id to new id_uuid (if you want to preserve mapping, otherwise skip)
-- UPDATE server_messages SET id_uuid = gen_random_uuid();

-- 3. Drop old primary key constraint
ALTER TABLE server_messages DROP CONSTRAINT server_messages_pkey;

-- 4. Drop the old id column
ALTER TABLE server_messages DROP COLUMN id;

-- 5. Rename id_uuid to id
ALTER TABLE server_messages RENAME COLUMN id_uuid TO id;

-- 6. Set new id as primary key
ALTER TABLE server_messages ADD PRIMARY KEY (id);

-- 7. (Optional) Update any foreign keys or references to server_messages.id in other tables
-- For notifications.reference_id, ensure it is uuid (already correct in your schema)

-- 8. (Optional) If you have other tables referencing server_messages.id, update their type to uuid as well

-- 9. Done! Now all new messages will have a uuid id, and notifications.reference_id will match type

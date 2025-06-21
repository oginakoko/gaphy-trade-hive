-- PATCH: Ensure notifications.reference_id is always uuid and all references are valid

-- 1. Update notifications.reference_id to uuid if not already
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='notifications' AND column_name='reference_id' AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN reference_id TYPE uuid USING reference_id::uuid;
  END IF;
END $$;

-- 2. Remove any notifications with invalid reference_id (not a valid uuid)
DELETE FROM public.notifications WHERE reference_id IS NOT NULL AND reference_id::text !~* '^[0-9a-fA-F-]{36}$';

-- 3. Remove orphaned notifications (reference_id not matching any valid uuid in related tables)
-- (Assume reference_id can point to profiles, server_messages, or other uuid tables)
DELETE FROM public.notifications n
WHERE reference_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = n.reference_id)
  AND NOT EXISTS (SELECT 1 FROM public.server_messages m WHERE m.id = n.reference_id)
  AND NOT EXISTS (SELECT 1 FROM public.servers s WHERE s.id = n.reference_id);

-- 4. Add a comment for future devs
COMMENT ON COLUMN public.notifications.reference_id IS 'Always uuid. May reference profiles, server_messages, or servers.';

-- 5. Add a check constraint for uuid format (if not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name='notifications' AND constraint_type='CHECK' AND constraint_name='notifications_reference_id_uuid_format'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_reference_id_uuid_format CHECK (
        reference_id IS NULL OR reference_id::text ~* '^[0-9a-fA-F-]{36}$'
      );
  END IF;
END $$;

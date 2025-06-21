-- === PATCH: FIX NOTIFICATIONS REFERENCE_ID TYPE ERROR (WITH TRIGGER RECREATION) ===
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_new_follow'
  ) THEN
    DROP TRIGGER on_new_follow ON public.user_follows;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_follow_notification'
  ) THEN
    DROP FUNCTION public.handle_new_follow_notification();
  END IF;
END $$;

CREATE FUNCTION public.handle_new_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    type,
    reference_id,
    server_id
  )
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'new_follow',
    NEW.follower_id, -- Use follower_id (uuid) as reference_id
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_follow
AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow_notification();

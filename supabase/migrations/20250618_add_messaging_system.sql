-- Drop existing objects
DROP TRIGGER IF EXISTS update_messages_updated_at ON private_messages;
DROP TRIGGER IF EXISTS auto_follow_admin ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
    id bigint generated always as identity primary key,
    follower_id uuid references auth.users(id) on delete cascade,
    following_id uuid references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    -- Ensure users can't follow the same person twice
    unique(follower_id, following_id),
    -- Prevent self-follows
    constraint no_self_follow check (follower_id != following_id)
);

-- Create private messages table
create table if not exists public.private_messages (
    id bigint generated always as identity primary key,
    sender_id uuid references auth.users(id) on delete set null,
    recipient_id uuid references auth.users(id) on delete set null,
    content text not null,
    is_read boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create function to auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Add trigger for updated_at
create trigger update_messages_updated_at
    before update on private_messages
    for each row
    execute procedure update_updated_at_column();

-- Create message attachments table for multiple attachments per message
create table if not exists public.message_attachments (
    id bigint generated always as identity primary key,
    message_id bigint references private_messages(id) on delete cascade,
    url text not null,
    type text check (type in ('image', 'video', 'audio', 'document')) not null,
    filename text,
    created_at timestamptz default now()
);

-- Create unread messages counter
create table if not exists public.unread_message_counts (
    id bigint generated always as identity primary key,
    user_id uuid references auth.users(id) on delete cascade unique,
    unread_count int default 0,
    last_checked_at timestamptz default now()
);

-- Create function to auto-follow admin for new users
create or replace function auto_follow_admin()
returns trigger as $$
declare
    admin_ids uuid[];
begin
    -- Get all admin user IDs
    select array_agg(auth.users.id)
    into admin_ids
    from auth.users
    join public.profiles on auth.users.id = profiles.user_id
    where profiles.is_admin = true;
    
    if admin_ids is not null then
        -- New user follows all admins
        insert into public.user_follows (follower_id, following_id)
        select new.id, admin_id
        from unnest(admin_ids) as admin_id;
        
        -- All admins follow new user
        insert into public.user_follows (follower_id, following_id)
        select admin_id, new.id
        from unnest(admin_ids) as admin_id;
    end if;
    
    return new;
end;
$$ language plpgsql;

-- Add trigger for auto-following admin
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure auto_follow_admin();

-- Create indexes for better performance
create index if not exists idx_private_messages_sender on private_messages(sender_id);
create index if not exists idx_private_messages_recipient on private_messages(recipient_id);
create index if not exists idx_private_messages_created_at on private_messages(created_at desc);
create index if not exists idx_user_follows_follower on user_follows(follower_id);
create index if not exists idx_user_follows_following on user_follows(following_id);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Create follows policies
CREATE POLICY view_follows ON public.user_follows 
    TO authenticated
    USING (true);

CREATE POLICY insert_follows ON public.user_follows 
    TO authenticated
    USING (auth.uid() = follower_id);

CREATE POLICY delete_follows ON public.user_follows 
    TO authenticated
    USING (auth.uid() = follower_id);

-- Create messages policies
CREATE POLICY view_messages ON public.private_messages 
    TO authenticated
    USING (
        auth.uid() IN (sender_id, recipient_id) 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY send_messages ON public.private_messages 
    TO authenticated
    USING (
        auth.uid() = sender_id 
        AND (
            EXISTS (
                SELECT 1 FROM user_follows f1
                JOIN user_follows f2 
                    ON f1.follower_id = f2.following_id 
                    AND f1.following_id = f2.follower_id
                WHERE f1.follower_id = auth.uid() 
                    AND f1.following_id = recipient_id
            )
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                    AND is_admin = true
            )
            OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = recipient_id 
                    AND is_admin = true
            )
        )
    );

CREATE POLICY update_messages ON public.private_messages 
    TO authenticated
    USING (
        auth.uid() = recipient_id 
        AND OLD.is_read = false 
        AND NEW.is_read = true 
        AND OLD.content = NEW.content 
        AND OLD.sender_id = NEW.sender_id 
        AND OLD.recipient_id = NEW.recipient_id
    );
    for insert
    with check (auth.uid() = follower_id);

create policy "Users can delete their own follows"
    on public.user_follows
    for delete
    using (auth.uid() = follower_id);

-- Messages policies
alter table public.private_messages enable row level security;

create policy "Users can see messages they're part of"
    on public.private_messages
    for select
    using (
        auth.uid() = sender_id 
        or auth.uid() = recipient_id 
        or exists (
            select 1 from profiles 
            where id = auth.uid() 
            and is_admin = true
        )
    );

create policy "Users can send messages"
    on public.private_messages
    for insert
    with check (
        auth.uid() = sender_id 
        and (
            -- Allow if mutual follow exists
            exists (
                select 1 from user_follows f1
                join user_follows f2 
                on f1.follower_id = f2.following_id 
                and f1.following_id = f2.follower_id
                where f1.follower_id = auth.uid() 
                and f1.following_id = recipient_id
            )
            -- Or if sender is admin
            or exists (
                select 1 from profiles 
                where user_id = auth.uid() 
                and is_admin = true
            )
            -- Or if it's a message to admin
            or exists (
                select 1 from profiles 
                where user_id = recipient_id 
                and is_admin = true
            )
        )
    );

create policy "Users can mark messages as read"
    on public.private_messages
    for update
    using (auth.uid() = recipient_id)
    with check (
        auth.uid() = recipient_id 
        and OLD.is_read = false 
        and NEW.is_read = true 
        and OLD.content = NEW.content 
        and OLD.sender_id = NEW.sender_id 
        and OLD.recipient_id = NEW.recipient_id
    );
    for insert
    with check (auth.uid() = follower_id);

create policy "Users can remove their own follows"
    on public.user_follows
    for delete
    using (auth.uid() = follower_id);

-- Messages policy
alter table public.private_messages enable row level security;

create policy "Users can see messages they're part of"
    on public.private_messages
    for select
    using (
        auth.uid() = sender_id 
        or (
            auth.uid() = recipient_id 
            and exists (
                select 1 from user_follows f1, user_follows f2
                where 
                    -- Mutual follow check (except for admin)
                    (
                        (f1.follower_id = auth.uid() and f1.following_id = sender_id)
                        and
                        (f2.follower_id = sender_id and f2.following_id = auth.uid())
                    )
                    or
                    -- Admin check (admin's email needs to be configured)
                    exists (
                        select 1 from auth.users 
                        where id = sender_id 
                        and email = 'admin@gaphyhive.com'
                    )
            )
        )
    );

create policy "Users can send messages to followers or admin"
    on public.private_messages
    for insert
    with check (
        auth.uid() = sender_id
        and (
            -- Can message if mutual follow exists
            exists (
                select 1 from user_follows f1, user_follows f2
                where 
                    (f1.follower_id = auth.uid() and f1.following_id = recipient_id)
                    and
                    (f2.follower_id = recipient_id and f2.following_id = auth.uid())
            )
            or
            -- Or if recipient is admin
            exists (
                select 1 from auth.users 
                where id = recipient_id 
                and email = 'admin@gaphyhive.com'
            )
            or
            -- Or if sender is admin
            exists (
                select 1 from auth.users 
                where id = auth.uid() 
                and email = 'admin@gaphyhive.com'
            )
        )
    );

create policy "Users can update their own messages"
    on public.private_messages
    for update
    using (auth.uid() = sender_id);

-- Attachments policy
alter table public.message_attachments enable row level security;

create policy "Users can see attachments from their messages"
    on public.message_attachments
    for select
    using (
        exists (
            select 1 from private_messages
            where id = message_attachments.message_id
            and (sender_id = auth.uid() or recipient_id = auth.uid())
        )
    );

create policy "Users can add attachments to their messages"
    on public.message_attachments
    for insert
    with check (
        exists (
            select 1 from private_messages
            where id = message_attachments.message_id
            and sender_id = auth.uid()
        )
    );

-- Unread counts policy
alter table public.unread_message_counts enable row level security;

create policy "Users can see their own unread counts"
    on public.unread_message_counts
    for select
    using (auth.uid() = user_id);

create policy "Users can update their own unread counts"
    on public.unread_message_counts
    for update
    using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists private_messages_sender_id_idx on private_messages(sender_id);
create index if not exists private_messages_recipient_id_idx on private_messages(recipient_id);
create index if not exists private_messages_thread_id_idx on private_messages(thread_id);
create index if not exists user_follows_follower_id_idx on user_follows(follower_id);
create index if not exists user_follows_following_id_idx on user_follows(following_id);
create index if not exists message_attachments_message_id_idx on message_attachments(message_id);

-- Create function to update unread counts
create or replace function update_unread_message_count()
returns trigger as $$
begin
    insert into public.unread_message_counts (user_id, unread_count)
    values (new.recipient_id, 1)
    on conflict (user_id)
    do update set 
        unread_count = unread_message_counts.unread_count + 1,
        last_checked_at = now();
    return new;
end;
$$ language plpgsql;

-- Add trigger for updating unread counts
create trigger on_new_message
    after insert on private_messages
    for each row
    execute procedure update_unread_message_count();

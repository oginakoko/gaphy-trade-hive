CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can block other users" ON user_blocks
FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their own blocks" ON user_blocks
FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can delete their own blocks" ON user_blocks
FOR DELETE USING (auth.uid() = blocker_id);
-- Create messages table for anonymous chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID NOT NULL REFERENCES designs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS messages_design_id_idx ON messages(design_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Designer can see messages for their designs
CREATE POLICY "designer_view_own_design_messages" ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designs
      WHERE designs.id = messages.design_id
      AND designs.designer_id = auth.uid()
    )
  );

-- Policy: Brand owners can see messages for designs they've interacted with
CREATE POLICY "buyer_view_own_messages" ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM messages m2
      WHERE m2.design_id = messages.design_id
      AND m2.sender_id = auth.uid()
    )
  );

-- Policy: Authenticated users can insert messages
CREATE POLICY "authenticated_insert_messages" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Policy: Users can update their own messages (mark as read)
CREATE POLICY "users_update_own_messages" ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

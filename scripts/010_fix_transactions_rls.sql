-- Add RLS policy for designers to view their own transactions
CREATE POLICY "designer_select_own_transactions" ON transactions
  FOR SELECT
  TO authenticated
  USING (designer_id = auth.uid());

-- Add RLS policy for buyers to view their own transactions
CREATE POLICY "buyer_select_own_transactions" ON transactions
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Add RLS policy for admins to view all transactions
CREATE POLICY "admin_select_all_transactions" ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

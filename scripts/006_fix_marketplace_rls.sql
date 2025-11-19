-- Fix the RLS policy to allow anonymous users to see approved designs
-- The issue: the original policy uses OR with auth.uid() which returns NULL for anonymous users
-- This causes the entire condition to evaluate as NULL, blocking access

DROP POLICY IF EXISTS "designs_select_approved" ON public.designs;

-- Create a new policy that properly handles anonymous access
-- Split into multiple policies for clarity and proper NULL handling
CREATE POLICY "public_select_approved_designs" ON public.designs
  FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "designer_select_own_designs" ON public.designs
  FOR SELECT 
  USING (designer_id = auth.uid());

CREATE POLICY "admin_select_all_designs" ON public.designs
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

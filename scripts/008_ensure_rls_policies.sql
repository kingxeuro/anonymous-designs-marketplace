-- This script ensures all RLS policies are properly set up
-- Run this if designs aren't showing up in the admin panel

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "designs_select_approved" ON public.designs;
DROP POLICY IF EXISTS "designs_insert_own" ON public.designs;
DROP POLICY IF EXISTS "designs_update_own_or_admin" ON public.designs;
DROP POLICY IF EXISTS "designs_delete_own_or_admin" ON public.designs;

-- Recreate all designs RLS policies
CREATE POLICY "designs_select_approved" ON public.designs
  FOR SELECT USING (
    status = 'approved' OR 
    designer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "designs_insert_own" ON public.designs
  FOR INSERT WITH CHECK (designer_id = auth.uid());

CREATE POLICY "designs_update_own_or_admin" ON public.designs
  FOR UPDATE USING (
    designer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "designs_delete_own_or_admin" ON public.designs
  FOR DELETE USING (
    designer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Verify RLS is enabled
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Insert admin user profile (you'll need to sign up with this email first)
-- This is just example data - replace with actual admin user ID after signup
INSERT INTO public.profiles (id, display_name, role, bio)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Admin', 'admin', 'Platform Administrator')
ON CONFLICT (id) DO NOTHING;

-- Note: Real users will be created through the signup flow
-- This seed file is just for reference

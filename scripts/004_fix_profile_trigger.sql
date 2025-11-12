-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_display_name TEXT;
  user_role user_role;
BEGIN
  -- Extract metadata with fallbacks
  user_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    'User_' || substring(NEW.id::text from 1 for 8)
  );
  
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'brand_owner'::user_role
  );

  -- Insert profile with conflict handling
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (NEW.id, user_display_name, user_role)
  ON CONFLICT (id) DO NOTHING;
  
  -- If display_name conflicts, append timestamp
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
      NEW.id,
      user_display_name || '_' || extract(epoch from now())::bigint,
      user_role
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

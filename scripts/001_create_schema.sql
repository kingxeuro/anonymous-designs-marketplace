-- Create enum types for roles and statuses
CREATE TYPE user_role AS ENUM ('designer', 'brand_owner', 'admin');
CREATE TYPE design_status AS ENUM ('pending', 'approved', 'rejected', 'sold_exclusive');
CREATE TYPE license_type AS ENUM ('non_exclusive', 'exclusive_buyout');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Profiles table: stores user information with anonymity
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Designs table: stores design listings
CREATE TABLE IF NOT EXISTS public.designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  preview_url TEXT,
  price_non_exclusive DECIMAL(10, 2) NOT NULL,
  price_exclusive DECIMAL(10, 2) NOT NULL,
  status design_status DEFAULT 'pending',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases table: tracks design purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_type license_type NOT NULL,
  price_paid DECIMAL(10, 2) NOT NULL,
  download_url TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table: payment records
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  designer_earnings DECIMAL(10, 2) NOT NULL,
  status transaction_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Designs RLS Policies
CREATE POLICY "designs_select_approved" ON public.designs
  FOR SELECT USING (status = 'approved' OR designer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

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

-- Purchases RLS Policies
CREATE POLICY "purchases_select_own" ON public.purchases
  FOR SELECT USING (
    buyer_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.designs WHERE id = design_id AND designer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "purchases_insert_own" ON public.purchases
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Transactions RLS Policies
CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (
    buyer_id = auth.uid() OR 
    designer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "transactions_insert_system" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_designs_designer_id ON public.designs(designer_id);
CREATE INDEX idx_designs_status ON public.designs(status);
CREATE INDEX idx_purchases_buyer_id ON public.purchases(buyer_id);
CREATE INDEX idx_purchases_design_id ON public.purchases(design_id);
CREATE INDEX idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_designer_id ON public.transactions(designer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

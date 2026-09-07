-- =============================================
-- Awards Voting & Nomination Platform Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. EVENT SETTINGS (singleton row)
-- =============================================
CREATE TABLE IF NOT EXISTS event_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL DEFAULT 'NASPA GCAA Awards & Movie 2026',
  event_date TIMESTAMPTZ,
  nomination_start TIMESTAMPTZ,
  nomination_end TIMESTAMPTZ,
  voting_start TIMESTAMPTZ,
  voting_end TIMESTAMPTZ,
  vote_cost_pesewas INTEGER NOT NULL DEFAULT 100,
  allow_multiple_votes BOOLEAN DEFAULT true,
  max_votes_per_person INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO event_settings (event_name, vote_cost_pesewas) 
VALUES ('NASPA GCAA Awards & Movie 2026', 100)
ON CONFLICT DO NOTHING;

-- =============================================
-- 2. CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. NOMINATIONS (raw, unverified)
-- =============================================
CREATE TABLE IF NOT EXISTS nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  nominee_name TEXT NOT NULL,
  nominee_phone TEXT,
  nominee_email TEXT,
  reason TEXT,
  nominator_name TEXT NOT NULL,
  nominator_phone TEXT,
  nominator_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. NOMINEES (admin-verified, with codes & photos)
-- =============================================
CREATE TABLE IF NOT EXISTS nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  phone TEXT,
  email TEXT,
  bio TEXT,
  vote_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. VOTES (each row = 1 paid vote transaction)
-- =============================================
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  voter_name TEXT,
  voter_phone TEXT,
  voter_email TEXT NOT NULL,
  amount_pesewas INTEGER NOT NULL DEFAULT 100,
  quantity INTEGER NOT NULL DEFAULT 1,
  paystack_reference TEXT NOT NULL UNIQUE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. ADMIN USERS
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRIGGER: Auto-update nominee vote_count
-- =============================================
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'success' AND (OLD IS NULL OR OLD.payment_status != 'success') THEN
    UPDATE nominees
    SET vote_count = vote_count + NEW.quantity
    WHERE id = NEW.nominee_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_verified
  AFTER INSERT OR UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_count();

-- =============================================
-- TRIGGER: Auto-update event_settings.updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_settings_update
  BEFORE UPDATE ON event_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- EVENT SETTINGS: Public can read, admins can manage
CREATE POLICY "Public can read event settings" ON event_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage event settings" ON event_settings
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- CATEGORIES: Public can read active, admins can manage
CREATE POLICY "Public can read active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- NOMINATIONS: Public can insert, admins manage
CREATE POLICY "Public can create nominations" ON nominations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage nominations" ON nominations
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- NOMINEES: Public can read active, admins manage
CREATE POLICY "Public can read active nominees" ON nominees
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage nominees" ON nominees
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- VOTES: Public can insert, read own votes
CREATE POLICY "Public can create votes" ON votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage votes" ON votes
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ADMIN USERS: Only service role
CREATE POLICY "Service role can manage admin users" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can read own record" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- STORAGE: Create bucket for nominee photos
-- =============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nominee-photos', 'nominee-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public can view nominee photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'nominee-photos');

CREATE POLICY "Authenticated users can upload nominee photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'nominee-photos');

CREATE POLICY "Authenticated users can update nominee photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'nominee-photos');

-- =============================================
-- REALTIME: Enable realtime for nominees table
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE nominees;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

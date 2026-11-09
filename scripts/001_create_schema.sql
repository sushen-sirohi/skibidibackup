-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  gmail_connected BOOLEAN DEFAULT FALSE,
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,
  sync_status TEXT DEFAULT 'idle',
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create emails table for cached Gmail emails
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  from_address TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  preview TEXT,
  body TEXT,
  date TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'inbox',
  labels JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  raw_data JSONB,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, gmail_id)
);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emails_select_own" ON public.emails FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "emails_insert_own" ON public.emails FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "emails_update_own" ON public.emails FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "emails_delete_own" ON public.emails FOR DELETE USING (auth.uid() = user_id);

-- Create index for fast queries
CREATE INDEX idx_emails_user_category ON public.emails(user_id, category);
CREATE INDEX idx_emails_user_date ON public.emails(user_id, date DESC);
CREATE INDEX idx_emails_user_read ON public.emails(user_id, is_read);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- SQL to create the contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  responded BOOLEAN DEFAULT false,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Set up RLS policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anonymous users to insert new messages
CREATE POLICY "Allow anonymous message submission" 
  ON public.contact_messages FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Allow authenticated users to read all messages
CREATE POLICY "Allow authenticated users to read messages" 
  ON public.contact_messages FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to update messages
CREATE POLICY "Allow authenticated users to update messages" 
  ON public.contact_messages FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

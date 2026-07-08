-- SQL Migration script to setup Site Feedbacks table and RLS policies
-- Both handtohandloans@gmail.com and utkrashtkumar@gmail.com are recognized as admins

CREATE TABLE IF NOT EXISTS public.site_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    name TEXT,
    email TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_feedbacks ENABLE ROW LEVEL SECURITY;

-- 1. Policy to allow anyone (anonymous or authenticated) to insert a feedback
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.site_feedbacks;
CREATE POLICY "Allow anonymous inserts" ON public.site_feedbacks
    FOR INSERT WITH CHECK (true);

-- 2. Policy to allow only both administrators to view feedbacks
DROP POLICY IF EXISTS "Allow admin select" ON public.site_feedbacks;
CREATE POLICY "Allow admin select" ON public.site_feedbacks
    FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 3. Policy to allow only both administrators to delete feedbacks
DROP POLICY IF EXISTS "Allow admin delete" ON public.site_feedbacks;
CREATE POLICY "Allow admin delete" ON public.site_feedbacks
    FOR DELETE TO authenticated
    USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

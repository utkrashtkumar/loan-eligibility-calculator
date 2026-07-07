-- ============================================
-- SQL Migration to add Blogs Table and Policies
-- Run this in the Supabase SQL Editor
-- ============================================

-- Create blogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_image TEXT,
  published BOOLEAN DEFAULT false,
  author TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index on slug for fast query lookups
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);

-- Enable Row Level Security (RLS)
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to published blogs
DROP POLICY IF EXISTS "Allow public read on published blogs" ON public.blogs;
CREATE POLICY "Allow public read on published blogs"
  ON public.blogs FOR SELECT
  USING (published = true);

-- Policy 2: Allow authenticated admin accounts to manage all blogs
DROP POLICY IF EXISTS "Admin can manage all blogs" ON public.blogs;
CREATE POLICY "Admin can manage all blogs"
  ON public.blogs FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

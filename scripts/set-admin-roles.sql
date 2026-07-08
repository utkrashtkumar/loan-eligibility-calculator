-- ============================================================
-- SQL Migration to set Admin Roles in the database
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Drop the existing constraint limiting roles to 'user' and 'agent'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add the updated constraint including 'admin' role
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'agent', 'admin'));

-- 3. Update the profiles table to assign the admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com');

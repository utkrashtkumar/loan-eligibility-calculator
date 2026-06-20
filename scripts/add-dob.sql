-- =======================================================
-- Add dob column to user_inquiries table
-- Run this in Supabase SQL Editor
-- =======================================================

ALTER TABLE user_inquiries ADD COLUMN IF NOT EXISTS dob TEXT;

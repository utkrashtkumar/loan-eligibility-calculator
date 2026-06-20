-- Create site_stats table for visitor tracking
CREATE TABLE IF NOT EXISTS site_stats (
  id TEXT PRIMARY KEY DEFAULT 'main',
  visitor_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial row
INSERT INTO site_stats (id, visitor_count) VALUES ('main', 0)
ON CONFLICT (id) DO NOTHING;

-- Create atomic increment function
CREATE OR REPLACE FUNCTION increment_visitor_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE site_stats
  SET visitor_count = visitor_count + 1,
      updated_at = NOW()
  WHERE id = 'main'
  RETURNING visitor_count INTO new_count;
  RETURN new_count;
END;
$$;

-- Allow anonymous and authenticated users to call the function
GRANT EXECUTE ON FUNCTION increment_visitor_count() TO anon;
GRANT EXECUTE ON FUNCTION increment_visitor_count() TO authenticated;

-- Allow anyone to read the count
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on site_stats"
  ON site_stats FOR SELECT
  USING (true);

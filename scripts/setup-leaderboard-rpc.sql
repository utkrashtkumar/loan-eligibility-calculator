-- Create Postgres RPC function to securely get agent leaderboard bypassing RLS but masking names
CREATE OR REPLACE FUNCTION public.get_agent_leaderboard()
RETURNS TABLE (
  agent_rank INT,
  masked_name TEXT,
  disbursed_volume NUMERIC,
  is_current_user BOOLEAN
)
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID calling this function
  v_current_user_id := auth.uid();

  RETURN QUERY
  WITH RankedAgents AS (
    SELECT 
      a.agent_id,
      p.full_name,
      SUM(a.loan_amount) as total_volume,
      ROW_NUMBER() OVER (ORDER BY SUM(a.loan_amount) DESC) as rnk
    FROM public.applications a
    JOIN public.profiles p ON a.agent_id = p.id
    WHERE a.status = 'Disbursed' OR a.status = 'disbursed'
    GROUP BY a.agent_id, p.full_name
  )
  SELECT 
    ra.rnk::INT as agent_rank,
    CASE 
      WHEN ra.agent_id = v_current_user_id THEN ra.full_name
      ELSE 
        CASE 
          WHEN ra.full_name IS NULL OR ra.full_name = '' THEN 'Partner Agent'
          ELSE 
            -- Mask name (e.g., "Utkrasht Kumar" -> "Utkrasht K.")
            split_part(ra.full_name, ' ', 1) || ' ' || 
            CASE 
              WHEN array_length(string_to_array(ra.full_name, ' '), 1) > 1 
              THEN left(split_part(ra.full_name, ' ', 2), 1) || '.'
              ELSE ''
            END
        END
    END as masked_name,
    ra.total_volume::NUMERIC as disbursed_volume,
    (ra.agent_id = v_current_user_id) as is_current_user
  FROM RankedAgents ra
  ORDER BY ra.rnk ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Fix the incomplete JOIN in get_leaderboard function
DROP FUNCTION IF EXISTS public.get_leaderboard(INT);

CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INT DEFAULT 10)
RETURNS TABLE (
  email VARCHAR,
  total_points BIGINT,
  correct_answers BIGINT,
  total_attempts BIGINT,
  accuracy_percentage NUMERIC,
  last_attempt_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.email::VARCHAR,
    COALESCE(SUM(ga.points_earned), 0)::BIGINT as total_points,
    COALESCE(COUNT(CASE WHEN ga.is_correct THEN 1 END), 0)::BIGINT as correct_answers,
    COALESCE(COUNT(ga.id), 0)::BIGINT as total_attempts,
    CASE
      WHEN COUNT(ga.id) > 0 THEN ROUND(
        (COUNT(CASE WHEN ga.is_correct THEN 1 END)::NUMERIC / COUNT(ga.id)) * 100, 2
      )
      ELSE 0
    END as accuracy_percentage,
    MAX(ga.attempted_at) as last_attempt_at
  FROM
    profiles p
    -- Fix incomplete JOIN - add proper join condition using p.id
    LEFT JOIN game_attempts ga ON p.id = ga.user_id
  WHERE
    p.role = 'player'
  GROUP BY
    p.id, p.email
  ORDER BY
    total_points DESC,
    accuracy_percentage DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

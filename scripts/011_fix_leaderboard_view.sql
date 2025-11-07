-- Drop and recreate the leaderboard view to correctly query the profiles table
DROP VIEW IF EXISTS public.leaderboard;

-- Create leaderboard view that correctly aggregates player statistics
CREATE VIEW public.leaderboard AS
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
FROM public.profiles p
LEFT JOIN public.game_attempts ga ON p.id = ga.user_id
WHERE p.role = 'player'
GROUP BY p.id, p.email
ORDER BY total_points DESC, accuracy_percentage DESC;

-- Grant select on the leaderboard view to all authenticated users
GRANT SELECT ON public.leaderboard TO authenticated, anon;

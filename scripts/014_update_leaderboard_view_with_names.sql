-- Drop existing leaderboard view and recreate with player names
DROP VIEW IF EXISTS public.leaderboard CASCADE;

CREATE VIEW public.leaderboard AS
SELECT 
  CONCAT(p.first_name, ' ', p.last_name) as player_name,
  COALESCE(SUM(ga.points_earned), 0) as total_points,
  COUNT(ga.id) as total_attempts,
  SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) as correct_answers,
  ROUND(
    100.0 * SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) / 
    NULLIF(COUNT(ga.id), 0), 
    2
  ) as accuracy_percentage,
  MAX(ga.attempted_at) as last_attempt_at,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ga.points_earned), 0) DESC) as rank
FROM public.profiles p
LEFT JOIN public.game_attempts ga ON p.id = ga.user_id
WHERE p.role = 'player'
GROUP BY p.id, p.first_name, p.last_name
ORDER BY total_points DESC, accuracy_percentage DESC;

GRANT SELECT ON public.leaderboard TO anon, authenticated;

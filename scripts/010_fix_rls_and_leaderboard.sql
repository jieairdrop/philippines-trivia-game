-- Add RLS policy to allow leaderboard view to read all game_attempts
ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all game attempts for leaderboard
CREATE POLICY "game_attempts_select_leaderboard" ON public.game_attempts 
FOR SELECT 
USING (true);

-- Allow leaderboard view to be accessible to all authenticated users
GRANT SELECT ON public.leaderboard TO authenticated;

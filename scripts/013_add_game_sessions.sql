-- Create game_sessions table to track active game sessions and lock users during gameplay
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id) -- Only one active session per user
);

-- Enable RLS on game_sessions
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Add policies for game sessions - users can only manage their own sessions
CREATE POLICY game_sessions_select_own ON public.game_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY game_sessions_insert_own ON public.game_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY game_sessions_update_own ON public.game_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY game_sessions_delete_own ON public.game_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS game_sessions_user_id_idx ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS game_sessions_is_active_idx ON public.game_sessions(is_active);

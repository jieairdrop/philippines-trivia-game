-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  points INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Create question_options table
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Create game_attempts table
CREATE TABLE IF NOT EXISTS public.game_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID NOT NULL REFERENCES public.question_options(id),
  is_correct BOOLEAN NOT NULL,
  points_earned INT NOT NULL DEFAULT 0,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Create leaderboard view for easy access
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  u.email,
  COUNT(ga.id) as total_attempts,
  SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) as correct_answers,
  SUM(ga.points_earned) as total_points,
  ROUND(100.0 * SUM(CASE WHEN ga.is_correct THEN 1 ELSE 0 END) / COUNT(ga.id), 2) as accuracy_percentage,
  MAX(ga.attempted_at) as last_attempt_at
FROM auth.users u
LEFT JOIN public.game_attempts ga ON u.id = ga.user_id
WHERE u.raw_user_meta_data->>'role' = 'player'
GROUP BY u.id, u.email
ORDER BY total_points DESC;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for questions (everyone can select)
CREATE POLICY "questions_select_all" ON public.questions FOR SELECT USING (true);

-- RLS Policies for question_options (everyone can select)
CREATE POLICY "question_options_select_all" ON public.question_options FOR SELECT USING (true);

-- RLS Policies for game_attempts (users can only see their own)
CREATE POLICY "game_attempts_select_own" ON public.game_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "game_attempts_insert_own" ON public.game_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

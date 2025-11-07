-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_emoji VARCHAR(10),
  color_code VARCHAR(7),
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Add category_id column to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Create categories from existing question categories
INSERT INTO public.categories (name, description, icon_emoji, color_code, display_order, is_active)
VALUES 
  ('History', 'Philippines History trivia questions', '📚', '#3B82F6', 1, true),
  ('Culture', 'Philippines Culture trivia questions', '🎭', '#EC4899', 2, true),
  ('Geography', 'Philippines Geography trivia questions', '🗺️', '#10B981', 3, true),
  ('Sports', 'Philippines Sports trivia questions', '⚽', '#F59E0B', 4, true),
  ('Government', 'Philippines Government trivia questions', '🏛️', '#8B5CF6', 5, true)
ON CONFLICT (name) DO NOTHING;

-- Update questions to link with categories
UPDATE public.questions 
SET category_id = (
  SELECT id 
  FROM public.categories 
  WHERE public.categories.name = public.questions.category
)
WHERE category IS NOT NULL AND category_id IS NULL;

-- Enable Row Level Security on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop policies first (to avoid duplicates)
DROP POLICY IF EXISTS categories_select_all ON public.categories;
DROP POLICY IF EXISTS categories_insert_admin ON public.categories;
DROP POLICY IF EXISTS categories_update_admin ON public.categories;
DROP POLICY IF EXISTS categories_delete_admin ON public.categories;

-- RLS Policies for categories (public read access)
CREATE POLICY categories_select_all ON public.categories 
FOR SELECT USING (true);

-- RLS Policy for admin to manage categories
CREATE POLICY categories_insert_admin ON public.categories 
FOR INSERT
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY categories_update_admin ON public.categories 
FOR UPDATE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY categories_delete_admin ON public.categories 
FOR DELETE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

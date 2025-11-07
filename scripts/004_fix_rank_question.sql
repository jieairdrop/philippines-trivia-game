-- Fix the rank question syntax error by properly escaping single quotes
-- The issue was with "Philippines' rank" - need to use proper PostgreSQL escaping

DELETE FROM public.question_options 
WHERE question_id IN (
  SELECT id FROM public.questions 
  WHERE question_text = 'What is the Philippines'' rank in the world by population?'
);

DELETE FROM public.questions 
WHERE question_text = 'What is the Philippines'' rank in the world by population?';

-- Insert the corrected question with proper escaping
INSERT INTO public.questions (question_text, category, difficulty, points) VALUES
  ('What is the Philippines rank in the world by population?', 'Geography', 'hard', 30);

-- Add options for the corrected question
INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  ((SELECT id FROM public.questions WHERE question_text = 'What is the Philippines rank in the world by population?'), '13th', true, 1),
  ((SELECT id FROM public.questions WHERE question_text = 'What is the Philippines rank in the world by population?'), '10th', false, 2),
  ((SELECT id FROM public.questions WHERE question_text = 'What is the Philippines rank in the world by population?'), '15th', false, 3),
  ((SELECT id FROM public.questions WHERE question_text = 'What is the Philippines rank in the world by population?'), '12th', false, 4);

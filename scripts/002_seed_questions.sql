-- Seed sample questions about Philippine news and current events
INSERT INTO public.questions (question_text, category, difficulty, points) VALUES
('What is the capital of the Philippines?', 'Geography', 'easy', 10),
('Which city hosted the 2019 SEA Games?', 'Sports', 'medium', 20),
('In what year did the Philippines gain independence from Spain?', 'History', 'hard', 30),
('Which is the longest river in the Philippines?', 'Geography', 'medium', 20),
('What is the most populous city in the Philippines?', 'Geography', 'easy', 10),
('Who is the current President of the Philippines as of 2024?', 'Politics', 'medium', 20),
('How many islands does the Philippines have?', 'Geography', 'hard', 30),
('What is the national bird of the Philippines?', 'Biology', 'easy', 10),
('When did Mount Mayon last erupt significantly?', 'Geography', 'hard', 30),
('What is the official language of the Philippines?', 'Culture', 'easy', 10)
ON CONFLICT DO NOTHING;

-- Add options for each question
DO $$
DECLARE
  q_id UUID;
  q_text TEXT;
  correct_idx INT;
BEGIN
  -- Question 1: Capital
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'What is the capital of the Philippines?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, 'Manila', TRUE, 1),
  (q_id, 'Cebu', FALSE, 2),
  (q_id, 'Davao', FALSE, 3),
  (q_id, 'Quezon City', FALSE, 4);

  -- Question 2: SEA Games 2019
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'Which city hosted the 2019 SEA Games?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, 'Makati', FALSE, 1),
  (q_id, 'Manila', TRUE, 2),
  (q_id, 'Quezon City', FALSE, 3),
  (q_id, 'Pasay', FALSE, 4);

  -- Question 3: Independence
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'In what year did the Philippines gain independence from Spain?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, '1896', FALSE, 1),
  (q_id, '1898', TRUE, 2),
  (q_id, '1901', FALSE, 3),
  (q_id, '1935', FALSE, 4);

  -- Question 4: Longest River
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'Which is the longest river in the Philippines?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, 'Cagayan River', TRUE, 1),
  (q_id, 'Pasig River', FALSE, 2),
  (q_id, 'Rio Grande de Mindanao', FALSE, 3),
  (q_id, 'Abra River', FALSE, 4);

  -- Question 5: Most Populous City
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'What is the most populous city in the Philippines?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, 'Cebu', FALSE, 1),
  (q_id, 'Davao', FALSE, 2),
  (q_id, 'Quezon City', TRUE, 3),
  (q_id, 'Caloocan', FALSE, 4);

  -- Question 6: Current President
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'Who is the current President of the Philippines as of 2024?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, 'Ferdinand Marcos Jr.', TRUE, 1),
  (q_id, 'Manuel Roxas', FALSE, 2),
  (q_id, 'Rodrigo Duterte', FALSE, 3),
  (q_id, 'Bongbong Marcos', FALSE, 4);

  -- Question 7: Number of Islands
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'How many islands does the Philippines have?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, '7,101', TRUE, 1),
  (q_id, '5,000', FALSE, 2),
  (q_id, '9,000', FALSE, 3),
  (q_id, '3,500', FALSE, 4);

  -- Question 8: National Bird
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'What is the national bird of the Philippines?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, 'Philippine Eagle', TRUE, 1),
  (q_id, 'Cadet', FALSE, 2),
  (q_id, 'Maya', FALSE, 3),
  (q_id, 'Chicken', FALSE, 4);

  -- Question 9: Mount Mayon
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'When did Mount Mayon last erupt significantly?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, '2018', TRUE, 1),
  (q_id, '2015', FALSE, 2),
  (q_id, '2020', FALSE, 3),
  (q_id, '2010', FALSE, 4);

  -- Question 10: Official Language
  SELECT id INTO q_id FROM public.questions WHERE question_text = 'What is the official language of the Philippines?';
  INSERT INTO public.question_options (question_id, option_text, is_correct, display_order) VALUES
  (q_id, 'Filipino', TRUE, 1),
  (q_id, 'English', FALSE, 2),
  (q_id, 'Tagalog', FALSE, 3),
  (q_id, 'Spanish', FALSE, 4);

END $$;

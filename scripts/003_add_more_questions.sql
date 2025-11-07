-- Add more Philippines trivia questions
INSERT INTO questions (question_text, category, difficulty, points) VALUES
  ('Who is the current President of the Philippines (as of 2024)?', 'Politics', 'easy', 10),
  ('What year did the Philippines become independent from the United States?', 'History', 'hard', 30),
  ('Which Philippine island is known as the ''Island Garden''?', 'Geography', 'medium', 20),
  ('What are the official languages of the Philippines?', 'Culture', 'easy', 10),
  ('In what year did Mount Pinatubo erupt?', 'History', 'medium', 20),
  ('Which Filipino boxing legend is known as ''Pac-Man''?', 'Sports', 'easy', 10),
  ('What is the largest island in the Philippines?', 'Geography', 'medium', 20),
  ('Which Philippine mountain range is the longest?', 'Geography', 'hard', 30),
  ('What year did the Philippines host the APEC summit?', 'Recent Events', 'hard', 30),
  ('Which Philippine city is known as the ''Summer Capital''?', 'Geography', 'easy', 10),
  ('What is the deepest trench in the world, located near the Philippines?', 'Geography', 'hard', 30),
  ('In what year did the Marcos regime end?', 'History', 'medium', 20),
  ('Which Philippine festival honors the Holy Child?', 'Culture', 'medium', 20),
  ('Who composed the Philippine national anthem?', 'Culture', 'hard', 30),
  ('What is the traditional Filipino rice cake commonly eaten during Christmas?', 'Culture', 'easy', 10),
  ('How many regions does the Philippines have?', 'Geography', 'hard', 30),
  ('Which Philippine destination is famous for its white sand beaches?', 'Geography', 'medium', 20),
  ('What is currently considered one of the fastest-growing cities in the Philippines?', 'Recent Events', 'medium', 20),
  ('Which Philippine senator is known for her advocacy on health and social welfare?', 'Politics', 'medium', 20),
  ('What is the Philippines'' world ranking by population size?', 'Geography', 'hard', 30);

-- Add options for the above questions
INSERT INTO question_options (question_id, option_text, is_correct, display_order) VALUES
  ((SELECT id FROM questions WHERE question_text = 'Who is the current President of the Philippines (as of 2024)?' LIMIT 1), 'Ferdinand Marcos Jr.', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Who is the current President of the Philippines (as of 2024)?' LIMIT 1), 'Rodrigo Duterte', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Who is the current President of the Philippines (as of 2024)?' LIMIT 1), 'Leni Robredo', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Who is the current President of the Philippines (as of 2024)?' LIMIT 1), 'Gloria Macapagal-Arroyo', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines become independent from the United States?' LIMIT 1), '1946', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines become independent from the United States?' LIMIT 1), '1935', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines become independent from the United States?' LIMIT 1), '1898', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines become independent from the United States?' LIMIT 1), '1950', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Which Philippine island is known as the ''Island Garden''?' LIMIT 1), 'Samal Island', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine island is known as the ''Island Garden''?' LIMIT 1), 'Camiguin', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine island is known as the ''Island Garden''?' LIMIT 1), 'Palawan', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine island is known as the ''Island Garden''?' LIMIT 1), 'Bohol', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What are the official languages of the Philippines?' LIMIT 1), 'Filipino and English', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What are the official languages of the Philippines?' LIMIT 1), 'Tagalog and Spanish', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What are the official languages of the Philippines?' LIMIT 1), 'Filipino only', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What are the official languages of the Philippines?' LIMIT 1), 'English only', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'In what year did Mount Pinatubo erupt?' LIMIT 1), '1991', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'In what year did Mount Pinatubo erupt?' LIMIT 1), '1990', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'In what year did Mount Pinatubo erupt?' LIMIT 1), '1992', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'In what year did Mount Pinatubo erupt?' LIMIT 1), '1989', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Which Filipino boxing legend is known as ''Pac-Man''?' LIMIT 1), 'Manny Pacquiao', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Which Filipino boxing legend is known as ''Pac-Man''?' LIMIT 1), 'Nonito Donaire', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Which Filipino boxing legend is known as ''Pac-Man''?' LIMIT 1), 'Jerwin Ancajas', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Which Filipino boxing legend is known as ''Pac-Man''?' LIMIT 1), 'Ricky Hatton', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What is the largest island in the Philippines?' LIMIT 1), 'Luzon', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What is the largest island in the Philippines?' LIMIT 1), 'Mindanao', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What is the largest island in the Philippines?' LIMIT 1), 'Visayas', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What is the largest island in the Philippines?' LIMIT 1), 'Palawan', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Which Philippine mountain range is the longest?' LIMIT 1), 'Sierra Madre', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine mountain range is the longest?' LIMIT 1), 'Cordillera Central', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine mountain range is the longest?' LIMIT 1), 'Zambales Range', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine mountain range is the longest?' LIMIT 1), 'Mount Apo Range', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines host the APEC summit?' LIMIT 1), '2015', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines host the APEC summit?' LIMIT 1), '2014', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines host the APEC summit?' LIMIT 1), '2016', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What year did the Philippines host the APEC summit?' LIMIT 1), '2017', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Which Philippine city is known as the ''Summer Capital''?' LIMIT 1), 'Baguio', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine city is known as the ''Summer Capital''?' LIMIT 1), 'Tagaytay', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine city is known as the ''Summer Capital''?' LIMIT 1), 'Sagada', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine city is known as the ''Summer Capital''?' LIMIT 1), 'Bukidnon', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What is the deepest trench in the world, located near the Philippines?' LIMIT 1), 'Mariana Trench', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What is the deepest trench in the world, located near the Philippines?' LIMIT 1), 'Tonga Trench', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What is the deepest trench in the world, located near the Philippines?' LIMIT 1), 'Philippine Trench', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What is the deepest trench in the world, located near the Philippines?' LIMIT 1), 'Kuril Trench', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'In what year did the Marcos regime end?' LIMIT 1), '1986', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'In what year did the Marcos regime end?' LIMIT 1), '1987', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'In what year did the Marcos regime end?' LIMIT 1), '1985', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'In what year did the Marcos regime end?' LIMIT 1), '1984', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Which Philippine festival honors the Holy Child?' LIMIT 1), 'Sinulog Festival', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine festival honors the Holy Child?' LIMIT 1), 'Ati-Atihan Festival', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine festival honors the Holy Child?' LIMIT 1), 'Dinagyang Festival', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine festival honors the Holy Child?' LIMIT 1), 'Pahiyas Festival', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Who composed the Philippine national anthem?' LIMIT 1), 'Julián Felipe', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Who composed the Philippine national anthem?' LIMIT 1), 'José Rizal', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Who composed the Philippine national anthem?' LIMIT 1), 'Emilio Aguinaldo', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Who composed the Philippine national anthem?' LIMIT 1), 'Andres Bonifacio', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What is the traditional Filipino rice cake commonly eaten during Christmas?' LIMIT 1), 'Bibingka', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What is the traditional Filipino rice cake commonly eaten during Christmas?' LIMIT 1), 'Lechon', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What is the traditional Filipino rice cake commonly eaten during Christmas?' LIMIT 1), 'Lumpia', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What is the traditional Filipino rice cake commonly eaten during Christmas?' LIMIT 1), 'Balut', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'How many regions does the Philippines have?' LIMIT 1), '17', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'How many regions does the Philippines have?' LIMIT 1), '16', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'How many regions does the Philippines have?' LIMIT 1), '15', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'How many regions does the Philippines have?' LIMIT 1), '18', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Which Philippine destination is famous for its white sand beaches?' LIMIT 1), 'Boracay', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine destination is famous for its white sand beaches?' LIMIT 1), 'El Nido', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine destination is famous for its white sand beaches?' LIMIT 1), 'Siargao', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine destination is famous for its white sand beaches?' LIMIT 1), 'Batanes', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What is currently considered one of the fastest-growing cities in the Philippines?' LIMIT 1), 'Taguig (BGC)', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What is currently considered one of the fastest-growing cities in the Philippines?' LIMIT 1), 'Davao City', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What is currently considered one of the fastest-growing cities in the Philippines?' LIMIT 1), 'Cebu City', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What is currently considered one of the fastest-growing cities in the Philippines?' LIMIT 1), 'Manila', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'Which Philippine senator is known for her advocacy on health and social welfare?' LIMIT 1), 'Risa Hontiveros', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine senator is known for her advocacy on health and social welfare?' LIMIT 1), 'Imee Marcos', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine senator is known for her advocacy on health and social welfare?' LIMIT 1), 'Grace Poe', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'Which Philippine senator is known for her advocacy on health and social welfare?' LIMIT 1), 'Cynthia Villar', false, 4),

  ((SELECT id FROM questions WHERE question_text = 'What is the Philippines'' world ranking by population size?' LIMIT 1), '13th', true, 1),
  ((SELECT id FROM questions WHERE question_text = 'What is the Philippines'' world ranking by population size?' LIMIT 1), '10th', false, 2),
  ((SELECT id FROM questions WHERE question_text = 'What is the Philippines'' world ranking by population size?' LIMIT 1), '15th', false, 3),
  ((SELECT id FROM questions WHERE question_text = 'What is the Philippines'' world ranking by population size?' LIMIT 1), '12th', false, 4);

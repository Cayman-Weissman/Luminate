-- Clear existing topics
DELETE FROM trending_topics;

-- Reset the sequence
ALTER SEQUENCE trending_topics_id_seq RESTART WITH 1;

-- Insert new topics with ON CONFLICT DO NOTHING to skip duplicates
INSERT INTO trending_topics (name, description) VALUES
  ('Web Development', ''),
  ('Mobile App Development', ''),
  ('Data Science', ''),
  ('Artificial Intelligence & Machine Learning', ''),
  ('Cloud Computing', ''),
  ('Blockchain & Cryptocurrency', ''),
  ('Digital Marketing', ''),
  ('UX/UI Design', ''),
  ('Graphic Design', ''),
  ('Game Development', ''),
  ('Programming Languages', ''),
  ('E-Commerce Development', ''),
  ('Video Editing & Production', ''),
  ('Cloud DevOps', ''),
  ('Cybersecurity', ''),
  ('Finance & Accounting', ''),
  ('Economics', ''),
  ('Public Speaking & Communication', ''),
  ('Entrepreneurship', ''),
  ('Photography & Videography', ''),
  ('Business Management', ''),
  ('Fitness & Nutrition', ''),
  ('Cooking & Culinary Arts', ''),
  ('Psychology', ''),
  ('Sociology', ''),
  ('Conflict Resolution & Negotiation', ''),
  ('Supply Chain Management & Logistics', '')

ON CONFLICT (name) DO NOTHING; 
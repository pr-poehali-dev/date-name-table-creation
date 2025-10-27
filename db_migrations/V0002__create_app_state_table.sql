-- Create table for storing app state
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS app_state_single_row ON app_state ((id));

-- Insert initial row if not exists
INSERT INTO app_state (id, data) 
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
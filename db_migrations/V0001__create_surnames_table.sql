CREATE TABLE IF NOT EXISTS surnames (
    id SERIAL PRIMARY KEY,
    surname VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT 'blue',
    counter INTEGER DEFAULT 1,
    linked_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_surnames_date ON surnames(date);
CREATE INDEX idx_surnames_surname ON surnames(surname);
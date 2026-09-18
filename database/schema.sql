-- =========================================
-- CLOUDLIFE DATABASE
-- =========================================

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Pending',
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT DEFAULT 'Other',
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notes (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

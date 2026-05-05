-- Run this once in psql as the postgres superuser to create the local database
-- psql -U postgres -f setup_postgres.sql

-- Create the database
CREATE DATABASE voiceiq;

-- (Optional) Create a dedicated app user instead of using the default postgres user
-- CREATE USER voiceiq_user WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE voiceiq TO voiceiq_user;

-- Then update .env:
-- DATABASE_URL=postgresql://voiceiq_user:your_secure_password@localhost:5432/voiceiq

\echo 'Database voiceiq created successfully.'
\echo 'Now run: python migrate.py   (from dealcrm-backend directory)'

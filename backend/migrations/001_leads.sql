-- Run in Supabase SQL editor (or psql) if the leads table does not exist yet.
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    company VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    status VARCHAR NOT NULL DEFAULT 'new',
    source VARCHAR,
    notes TEXT,
    ai_score DOUBLE PRECISION,
    ai_score_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_leads_owner_id ON leads (owner_id);
CREATE INDEX IF NOT EXISTS ix_leads_id ON leads (id);

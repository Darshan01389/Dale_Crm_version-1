-- Pipeline stages (seed defaults)
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_key VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(200) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_closed_won BOOLEAN NOT NULL DEFAULT false,
    is_closed_lost BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO pipeline_stages (stage_key, label, sort_order, is_closed_won, is_closed_lost)
SELECT * FROM (VALUES
    ('new', 'New', 10, false, false),
    ('qualified', 'Qualified', 20, false, false),
    ('proposal', 'Proposal', 30, false, false),
    ('negotiation', 'Negotiation', 40, false, false),
    ('closed_won', 'Closed Won', 50, true, false),
    ('closed_lost', 'Closed Lost', 60, false, true)
) AS v(stage_key, label, sort_order, is_closed_won, is_closed_lost)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages LIMIT 1);

CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    probability DOUBLE PRECISION NOT NULL DEFAULT 0,
    expected_close_date DATE,
    closed_at TIMESTAMPTZ,
    outcome VARCHAR(32) NOT NULL DEFAULT 'open',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS ix_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS ix_deals_stage_id ON deals(stage_id);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    activity_type VARCHAR(32) NOT NULL,
    subject VARCHAR(500),
    body TEXT,
    extra_metadata TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_activities_owner_id ON activities(owner_id);
CREATE INDEX IF NOT EXISTS ix_activities_deal_id ON activities(deal_id);
CREATE INDEX IF NOT EXISTS ix_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS ix_activities_activity_type ON activities(activity_type);

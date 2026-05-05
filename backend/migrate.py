#!/usr/bin/env python3
"""Run database migrations."""

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    engine = create_engine(settings.DATABASE_URL)

    # Execute the migration SQL directly
    sql = """
-- Migration 005: Lead automation and WhatsApp tracking fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_platform VARCHAR(120);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_status VARCHAR(64);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_last_sent_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_delivery_status VARCHAR(120);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notification_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS website_visits INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_website_visit_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_seen_status VARCHAR(64);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_open_status VARCHAR(64);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_rank INTEGER DEFAULT NULL;
"""

    # Execute the migration
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()

    print("Migration 005 applied successfully!")

if __name__ == "__main__":
    run_migration()
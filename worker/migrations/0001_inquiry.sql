PRAGMA foreign_keys = ON;

CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status = 'accepted'),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'id')),
  privacy_notice_version TEXT NOT NULL,
  marketing_consent INTEGER NOT NULL CHECK (marketing_consent IN (0, 1)),
  marketing_consent_recorded_at INTEGER NOT NULL,
  marketing_consent_version TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  retention_expires_at INTEGER NOT NULL
);

CREATE INDEX inquiries_retention_idx ON inquiries(retention_expires_at);

CREATE TABLE idempotency_keys (
  key_hash TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  inquiry_id TEXT NOT NULL UNIQUE REFERENCES inquiries(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idempotency_expiry_idx ON idempotency_keys(expires_at);

CREATE TABLE email_deliveries (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('internal', 'buyer')),
  status TEXT NOT NULL CHECK (
    status IN (
      'pending',
      'sent',
      'retry_scheduled',
      'failed_permanent',
      'bounced',
      'complained'
    )
  ),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER,
  provider_email_id TEXT,
  last_error_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (inquiry_id, kind)
);

CREATE INDEX email_deliveries_due_idx
  ON email_deliveries(status, next_attempt_at);
CREATE INDEX email_deliveries_provider_idx
  ON email_deliveries(provider_email_id);

CREATE TABLE marketing_consent_records (
  id TEXT PRIMARY KEY,
  source_inquiry_id TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('granted', 'withdrawn')),
  locale TEXT NOT NULL CHECK (locale IN ('en', 'id')),
  text_version TEXT NOT NULL,
  recorded_at INTEGER NOT NULL,
  retention_expires_at INTEGER NOT NULL
);

CREATE INDEX marketing_consent_email_idx
  ON marketing_consent_records(email_hash, recorded_at);
CREATE INDEX marketing_consent_retention_idx
  ON marketing_consent_records(retention_expires_at);

CREATE TABLE rate_limit_events (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX rate_limit_window_idx ON rate_limit_events(ip_hash, created_at);
CREATE INDEX rate_limit_expiry_idx ON rate_limit_events(expires_at);

CREATE TABLE webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  provider_email_id TEXT NOT NULL,
  processed_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX webhook_events_expiry_idx ON webhook_events(expires_at);

CREATE TABLE marketing_suppressions (
  email_hash TEXT PRIMARY KEY,
  reason TEXT NOT NULL CHECK (reason IN ('hard_bounce', 'complaint', 'opt_out')),
  source_event_id TEXT,
  created_at INTEGER NOT NULL,
  last_reviewed_at INTEGER,
  annual_review_due_at INTEGER NOT NULL
);

CREATE INDEX marketing_suppressions_review_idx
  ON marketing_suppressions(annual_review_due_at);

CREATE TABLE maintenance_runs (
  id TEXT PRIMARY KEY,
  run_at INTEGER NOT NULL,
  executor TEXT NOT NULL,
  inquiries_deleted INTEGER NOT NULL,
  consent_records_deleted INTEGER NOT NULL,
  rate_limit_records_deleted INTEGER NOT NULL,
  idempotency_keys_deleted INTEGER NOT NULL,
  webhook_events_deleted INTEGER NOT NULL,
  suppressions_due_for_review INTEGER NOT NULL
);

-- MANUAL TEMPLATE ONLY. Do not run without approval and a verified backup.
-- Replace __RUN_ID__ with a random non-PII identifier and __EXECUTOR__ with
-- the accountable operator identifier. Never put inquiry content in either.

BEGIN;

CREATE TEMP TABLE maintenance_context AS
SELECT
  '__RUN_ID__' AS run_id,
  CAST(strftime('%s', 'now') AS INTEGER) AS run_at,
  '__EXECUTOR__' AS executor;

CREATE TEMP TABLE maintenance_before AS
SELECT
  (SELECT COUNT(*) FROM inquiries
    WHERE retention_expires_at <= (SELECT run_at FROM maintenance_context)) AS inquiries_count,
  (SELECT COUNT(*) FROM marketing_consent_records
    WHERE retention_expires_at <= (SELECT run_at FROM maintenance_context)) AS consent_count,
  (SELECT COUNT(*) FROM rate_limit_events
    WHERE expires_at <= (SELECT run_at FROM maintenance_context)) AS rate_count,
  (SELECT COUNT(*) FROM idempotency_keys
    WHERE expires_at <= (SELECT run_at FROM maintenance_context)) AS idempotency_count,
  (SELECT COUNT(*) FROM webhook_events
    WHERE expires_at <= (SELECT run_at FROM maintenance_context)) AS webhook_count,
  (SELECT COUNT(*) FROM marketing_suppressions
    WHERE annual_review_due_at <= (SELECT run_at FROM maintenance_context)) AS suppression_review_count;

DELETE FROM idempotency_keys
WHERE expires_at <= (SELECT run_at FROM maintenance_context);

DELETE FROM marketing_consent_records
WHERE retention_expires_at <= (SELECT run_at FROM maintenance_context);

DELETE FROM rate_limit_events
WHERE expires_at <= (SELECT run_at FROM maintenance_context);

DELETE FROM webhook_events
WHERE expires_at <= (SELECT run_at FROM maintenance_context);

DELETE FROM inquiries
WHERE retention_expires_at <= (SELECT run_at FROM maintenance_context);

INSERT INTO maintenance_runs (
  id,
  run_at,
  executor,
  inquiries_deleted,
  consent_records_deleted,
  rate_limit_records_deleted,
  idempotency_keys_deleted,
  webhook_events_deleted,
  suppressions_due_for_review
)
SELECT
  context.run_id,
  context.run_at,
  context.executor,
  before.inquiries_count,
  before.consent_count,
  before.rate_count,
  before.idempotency_count,
  before.webhook_count,
  before.suppression_review_count
FROM maintenance_context AS context
CROSS JOIN maintenance_before AS before;

DROP TABLE maintenance_before;
DROP TABLE maintenance_context;

COMMIT;

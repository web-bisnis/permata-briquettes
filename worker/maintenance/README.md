# Monthly inquiry retention maintenance

This procedure is manual and inactive by default. It records only the run time,
record counts, and accountable operator identifier; it never copies inquiry
content into the maintenance log.

1. Confirm written authorization, the target environment, a verified backup,
   and the monthly maintenance window.
2. Copy `monthly-maintenance.sql` to a temporary file outside the repository.
3. Replace `__RUN_ID__` with a new random identifier and `__EXECUTOR__` with the
   approved non-PII operator identifier. Do not add names, email addresses, or
   inquiry data.
4. Review the transaction. It removes expired idempotency keys, consent
   records, rate-limit records, webhook events, and inquiries. Suppression
   records are never automatically deleted; records due for annual review are
   only counted.
5. During this stage, validation may target only the local D1 simulator. Do not
   add `--remote` and do not run against a real database.
6. After execution, query `maintenance_runs` by the run ID and retain the
   result as the operational record. Review each suppression record reported as
   due, then update `last_reviewed_at` and `annual_review_due_at` only under an
   approved suppression procedure.

Example local-only validation after applying local migrations:

```powershell
npx wrangler d1 execute DB --local --file worker/maintenance/monthly-maintenance.local.sql
```

The checked-in template intentionally contains unresolved placeholders so it
cannot create a misleading production maintenance record by accident.

import type {
  D1DatabaseLike,
  DeliveryKind,
  DeliveryRecord,
  InquiryRepository,
  StoredInquiry,
} from "./domain";
import { SECURITY_RETENTION_SECONDS } from "./domain";

interface InquiryRow {
  id: string;
  status: "accepted";
  name: string;
  email: string;
  company: string;
  phone: string | null;
  message: string | null;
  locale: "en" | "id";
  privacy_notice_version: string;
  marketing_consent: number;
  marketing_consent_version: string;
  created_at: number;
  last_activity_at: number;
  retention_expires_at: number;
}

interface DeliveryRow {
  id: string;
  inquiry_id: string;
  kind: DeliveryKind;
  status: DeliveryRecord["status"];
  attempt_count: number;
  next_attempt_at: number | null;
  provider_email_id: string | null;
}

export class D1InquiryRepository implements InquiryRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  async consumeRateLimit(ipHash: string, now: number) {
    const expiresAt = now + SECURITY_RETENTION_SECONDS;
    const results = await this.db.batch<{ results?: Array<{ request_count: number }> }>([
      this.db
        .prepare(
          `INSERT INTO rate_limit_events (id, ip_hash, created_at, expires_at)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), ipHash, now, expiresAt),
      this.db
        .prepare(
          `SELECT COUNT(*) AS request_count FROM rate_limit_events
           WHERE ip_hash = ? AND created_at > ?`,
        )
        .bind(ipHash, now - 900),
      this.db
        .prepare(
          `SELECT COUNT(*) AS request_count FROM rate_limit_events
           WHERE ip_hash = ? AND created_at > ?`,
        )
        .bind(ipHash, now - 86400),
    ]);
    const fifteenMinuteCount = Number(results[1]?.results?.[0]?.request_count ?? 0);
    const dailyCount = Number(results[2]?.results?.[0]?.request_count ?? 0);
    return {
      allowed: fifteenMinuteCount <= 5 && dailyCount <= 10,
      fifteenMinuteCount,
      dailyCount,
    };
  }

  async findIdempotency(keyHash: string, now: number) {
    const row = await this.db
      .prepare(
        `SELECT inquiry_id, request_hash
         FROM idempotency_keys
         WHERE key_hash = ? AND expires_at > ?`,
      )
      .bind(keyHash, now)
      .first<{ inquiry_id: string; request_hash: string }>();
    return row ? { inquiryId: row.inquiry_id, requestHash: row.request_hash } : null;
  }

  async createAcceptedInquiry(input: {
    inquiry: StoredInquiry;
    idempotencyKeyHash: string;
    requestHash: string;
    emailHash: string;
    idempotencyExpiresAt: number;
    consentRetentionExpiresAt: number | null;
  }): Promise<"created" | "conflict"> {
    const { inquiry } = input;
    const statements = [
      this.db
        .prepare(
          `INSERT INTO inquiries (
            id, status, name, email, company, phone, message, locale,
            privacy_notice_version, marketing_consent,
            marketing_consent_recorded_at, marketing_consent_version,
            created_at, last_activity_at, retention_expires_at
          ) VALUES (?, 'accepted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          inquiry.id,
          inquiry.name,
          inquiry.email,
          inquiry.company,
          inquiry.phone,
          inquiry.message,
          inquiry.locale,
          inquiry.privacyNoticeVersion,
          inquiry.marketingConsent ? 1 : 0,
          inquiry.createdAt,
          inquiry.consentTextVersion,
          inquiry.createdAt,
          inquiry.lastActivityAt,
          inquiry.retentionExpiresAt,
        ),
      this.db
        .prepare(
          `INSERT INTO idempotency_keys (
            key_hash, request_hash, inquiry_id, created_at, expires_at
          ) VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          input.idempotencyKeyHash,
          input.requestHash,
          inquiry.id,
          inquiry.createdAt,
          input.idempotencyExpiresAt,
        ),
      this.deliveryInsert(inquiry.id, "internal", inquiry.createdAt),
      this.deliveryInsert(inquiry.id, "buyer", inquiry.createdAt),
    ];

    if (inquiry.marketingConsent && input.consentRetentionExpiresAt) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO marketing_consent_records (
              id, source_inquiry_id, email_hash, status, locale, text_version,
              recorded_at, retention_expires_at
            ) VALUES (?, ?, ?, 'granted', ?, ?, ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            inquiry.id,
            input.emailHash,
            inquiry.locale,
            inquiry.consentTextVersion,
            inquiry.createdAt,
            input.consentRetentionExpiresAt,
          ),
      );
    }

    try {
      await this.db.batch(statements);
      return "created";
    } catch {
      return "conflict";
    }
  }

  async getInquiry(id: string): Promise<StoredInquiry | null> {
    const row = await this.db
      .prepare("SELECT * FROM inquiries WHERE id = ?")
      .bind(id)
      .first<InquiryRow>();
    return row ? mapInquiry(row) : null;
  }

  async getDelivery(inquiryId: string, kind: DeliveryKind): Promise<DeliveryRecord | null> {
    const row = await this.db
      .prepare("SELECT * FROM email_deliveries WHERE inquiry_id = ? AND kind = ?")
      .bind(inquiryId, kind)
      .first<DeliveryRow>();
    return row ? mapDelivery(row) : null;
  }

  async listDueDeliveries(now: number, limit: number): Promise<DeliveryRecord[]> {
    const rows = await this.db
      .prepare(
        `SELECT * FROM email_deliveries
         WHERE status = 'retry_scheduled' AND next_attempt_at <= ?
         ORDER BY next_attempt_at ASC
         LIMIT ?`,
      )
      .bind(now, limit)
      .all<DeliveryRow>();
    return rows.results.map(mapDelivery);
  }

  async recordDeliverySuccess(input: {
    deliveryId: string;
    providerEmailId: string;
    now: number;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE email_deliveries
           SET status = 'sent', attempt_count = attempt_count + 1,
               next_attempt_at = NULL, provider_email_id = ?,
               last_error_code = NULL, updated_at = ?
           WHERE id = ?`,
        )
        .bind(input.providerEmailId, input.now, input.deliveryId),
      this.touchInquiryForDelivery(input.deliveryId, input.now),
    ]);
  }

  async recordDeliveryFailure(input: {
    deliveryId: string;
    attemptCount: number;
    status: "retry_scheduled" | "failed_permanent";
    nextAttemptAt: number | null;
    errorCode: string;
    now: number;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE email_deliveries
           SET status = ?, attempt_count = ?, next_attempt_at = ?,
               last_error_code = ?, updated_at = ?
           WHERE id = ?`,
        )
        .bind(
          input.status,
          input.attemptCount,
          input.nextAttemptAt,
          input.errorCode,
          input.now,
          input.deliveryId,
        ),
      this.touchInquiryForDelivery(input.deliveryId, input.now),
    ]);
  }

  async isWebhookProcessed(eventId: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT 1 AS found FROM webhook_events WHERE event_id = ?")
      .bind(eventId)
      .first<{ found: number }>();
    return row !== null && row !== undefined;
  }

  async recordWebhookOnce(input: {
    eventId: string;
    eventType: string;
    providerEmailId: string;
    processedAt: number;
    expiresAt: number;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT OR IGNORE INTO webhook_events (
          event_id, event_type, provider_email_id, processed_at, expires_at
        ) VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        input.eventId,
        input.eventType,
        input.providerEmailId,
        input.processedAt,
        input.expiresAt,
      )
      .run();
    return Number(result.meta?.changes ?? 0) > 0;
  }

  async findDeliveryByProviderId(providerEmailId: string): Promise<DeliveryRecord | null> {
    const row = await this.db
      .prepare("SELECT * FROM email_deliveries WHERE provider_email_id = ?")
      .bind(providerEmailId)
      .first<DeliveryRow>();
    return row ? mapDelivery(row) : null;
  }

  async markDeliveryFeedback(input: {
    deliveryId: string;
    status: "bounced" | "complained";
    now: number;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE email_deliveries
           SET status = ?, next_attempt_at = NULL, updated_at = ?
           WHERE id = ?`,
        )
        .bind(input.status, input.now, input.deliveryId),
      this.touchInquiryForDelivery(input.deliveryId, input.now),
    ]);
  }

  async addSuppression(input: {
    emailHash: string;
    reason: "hard_bounce" | "complaint";
    sourceEventId: string;
    now: number;
    annualReviewDueAt: number;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO marketing_suppressions (
          email_hash, reason, source_event_id, created_at, annual_review_due_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email_hash) DO UPDATE SET
          reason = excluded.reason,
          source_event_id = excluded.source_event_id,
          annual_review_due_at = excluded.annual_review_due_at`,
      )
      .bind(
        input.emailHash,
        input.reason,
        input.sourceEventId,
        input.now,
        input.annualReviewDueAt,
      )
      .run();
  }

  private deliveryInsert(inquiryId: string, kind: DeliveryKind, now: number) {
    return this.db
      .prepare(
        `INSERT INTO email_deliveries (
          id, inquiry_id, kind, status, attempt_count, created_at, updated_at
        ) VALUES (?, ?, ?, 'pending', 0, ?, ?)`,
      )
      .bind(crypto.randomUUID(), inquiryId, kind, now, now);
  }

  private touchInquiryForDelivery(deliveryId: string, now: number) {
    return this.db
      .prepare(
        `UPDATE inquiries
         SET last_activity_at = ?, retention_expires_at = ?
         WHERE id = (SELECT inquiry_id FROM email_deliveries WHERE id = ?)`,
      )
      .bind(now, addMonths(now, 12), deliveryId);
  }
}

function mapInquiry(row: InquiryRow): StoredInquiry {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    email: row.email,
    company: row.company,
    phone: row.phone,
    message: row.message,
    locale: row.locale,
    privacyNoticeVersion: row.privacy_notice_version,
    marketingConsent: row.marketing_consent === 1,
    consentTextVersion: row.marketing_consent_version,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    retentionExpiresAt: row.retention_expires_at,
  };
}

function mapDelivery(row: DeliveryRow): DeliveryRecord {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    kind: row.kind,
    status: row.status,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    providerEmailId: row.provider_email_id,
  };
}

function addMonths(unixSeconds: number, months: number): number {
  const value = new Date(unixSeconds * 1000);
  value.setUTCMonth(value.getUTCMonth() + months);
  return Math.floor(value.getTime() / 1000);
}

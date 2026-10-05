import type {
  DeliveryKind,
  DeliveryRecord,
  InquiryRepository,
  RateLimitResult,
  StoredInquiry,
} from "../src/domain";
import { BUYER_CONFIRMATION } from "../../src/config/inquiry-copy";

export class MemoryRepository implements InquiryRepository {
  inquiries = new Map<string, StoredInquiry>();
  deliveries = new Map<string, DeliveryRecord>();
  idempotency = new Map<string, { inquiryId: string; requestHash: string; expiresAt: number }>();
  rate = new Map<string, number[]>();
  webhooks = new Set<string>();
  suppressions: Array<{ emailHash: string; reason: string; sourceEventId: string }> = [];
  events: string[] = [];
  forceRateLimit = false;

  async consumeRateLimit(ipHash: string, now: number): Promise<RateLimitResult> {
    const events = this.rate.get(ipHash) ?? [];
    events.push(now);
    this.rate.set(ipHash, events);
    const fifteenMinuteCount = events.filter((createdAt) => createdAt > now - 900).length;
    const dailyCount = events.filter((createdAt) => createdAt > now - 86400).length;
    return {
      allowed: !this.forceRateLimit && fifteenMinuteCount <= 5 && dailyCount <= 10,
      fifteenMinuteCount,
      dailyCount,
    };
  }

  async findIdempotency(keyHash: string, now: number) {
    const record = this.idempotency.get(keyHash);
    if (!record || record.expiresAt <= now) return null;
    return { inquiryId: record.inquiryId, requestHash: record.requestHash };
  }

  async createAcceptedInquiry(input: {
    inquiry: StoredInquiry;
    idempotencyKeyHash: string;
    requestHash: string;
    emailHash: string;
    idempotencyExpiresAt: number;
    consentRetentionExpiresAt: number | null;
  }): Promise<"created" | "conflict"> {
    if (this.idempotency.has(input.idempotencyKeyHash)) return "conflict";
    this.events.push("stored");
    this.inquiries.set(input.inquiry.id, input.inquiry);
    this.idempotency.set(input.idempotencyKeyHash, {
      inquiryId: input.inquiry.id,
      requestHash: input.requestHash,
      expiresAt: input.idempotencyExpiresAt,
    });
    for (const kind of ["internal", "buyer"] as const) {
      const delivery: DeliveryRecord = {
        id: `${input.inquiry.id}-${kind}`,
        inquiryId: input.inquiry.id,
        kind,
        status: "pending",
        attemptCount: 0,
        nextAttemptAt: null,
        providerEmailId: null,
      };
      this.deliveries.set(delivery.id, delivery);
    }
    return "created";
  }

  async getInquiry(id: string) {
    return this.inquiries.get(id) ?? null;
  }

  async getDelivery(inquiryId: string, kind: DeliveryKind) {
    return this.deliveries.get(`${inquiryId}-${kind}`) ?? null;
  }

  async listDueDeliveries(now: number, limit: number) {
    return Array.from(this.deliveries.values())
      .filter(
        (delivery) =>
          delivery.status === "retry_scheduled" &&
          delivery.nextAttemptAt !== null &&
          delivery.nextAttemptAt <= now,
      )
      .slice(0, limit);
  }

  async recordDeliverySuccess(input: {
    deliveryId: string;
    providerEmailId: string;
    now: number;
  }) {
    const delivery = this.deliveries.get(input.deliveryId)!;
    delivery.status = "sent";
    delivery.attemptCount += 1;
    delivery.nextAttemptAt = null;
    delivery.providerEmailId = input.providerEmailId;
  }

  async recordDeliveryFailure(input: {
    deliveryId: string;
    attemptCount: number;
    status: "retry_scheduled" | "failed_permanent";
    nextAttemptAt: number | null;
    errorCode: string;
    now: number;
  }) {
    const delivery = this.deliveries.get(input.deliveryId)!;
    delivery.status = input.status;
    delivery.attemptCount = input.attemptCount;
    delivery.nextAttemptAt = input.nextAttemptAt;
  }

  async isWebhookProcessed(eventId: string) {
    return this.webhooks.has(eventId);
  }

  async recordWebhookOnce(input: {
    eventId: string;
    eventType: string;
    providerEmailId: string;
    processedAt: number;
    expiresAt: number;
  }) {
    if (this.webhooks.has(input.eventId)) return false;
    this.webhooks.add(input.eventId);
    return true;
  }

  async findDeliveryByProviderId(providerEmailId: string) {
    return Array.from(this.deliveries.values()).find(
      (delivery) => delivery.providerEmailId === providerEmailId,
    ) ?? null;
  }

  async markDeliveryFeedback(input: {
    deliveryId: string;
    status: "bounced" | "complained";
    now: number;
  }) {
    this.deliveries.get(input.deliveryId)!.status = input.status;
  }

  async addSuppression(input: {
    emailHash: string;
    reason: "hard_bounce" | "complaint";
    sourceEventId: string;
    now: number;
    annualReviewDueAt: number;
  }) {
    // Mirrors the D1 upsert on email_hash.
    this.suppressions = this.suppressions.filter((entry) => entry.emailHash !== input.emailHash);
    this.suppressions.push({
      emailHash: input.emailHash,
      reason: input.reason,
      sourceEventId: input.sourceEventId,
    });
  }
}

export function testConfig() {
  return {
    runtimeMode: "local" as const,
    useLocalMocks: true,
    turnstileSecret: "local-mock",
    resendApiKey: "local-mock",
    resendWebhookSecret: "whsec_bG9jYWwtbW9jaw==",
    rateLimitHashKey: "rate-test-key",
    suppressionHashKey: "suppression-test-key",
    notificationTo: "routing@example.invalid",
    fromAddress: "routing@example.invalid",
    replyTo: "routing@example.invalid",
    privacyNoticeVersion: "test-privacy-version",
    marketingConsentVersion: "test-consent-version",
    confirmation: {
      en: BUYER_CONFIRMATION.en,
      id: BUYER_CONFIRMATION.id,
    },
  };
}

export function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: "A",
    email: "a@example.invalid",
    company: "X",
    phone: null,
    message: null,
    marketingConsent: false,
    locale: "en",
    consentTextVersion: "test-consent-version",
    privacyNoticeVersion: "test-privacy-version",
    turnstileToken: "local-turnstile-pass",
    ...overrides,
  };
}

export function inquiryRequest(
  payload: Record<string, unknown> = validPayload(),
  options: { origin?: string; key?: string; method?: string; contentType?: string } = {},
) {
  const origin = options.origin ?? "http://localhost:8787";
  return new Request(`${origin}/api/inquiries`, {
    method: options.method ?? "POST",
    headers: {
      origin,
      "content-type": options.contentType ?? "application/json",
      "idempotency-key": options.key ?? "test-idempotency-key-0001",
      "cf-connecting-ip": "192.0.2.1",
    },
    body: options.method === "GET" ? undefined : JSON.stringify(payload),
  });
}

export class TestContext {
  promises: Promise<unknown>[] = [];
  waitUntil(promise: Promise<unknown>) {
    this.promises.push(promise);
  }
  async drain() {
    await Promise.all(this.promises);
  }
}

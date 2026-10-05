export type Locale = "en" | "id";
export type RuntimeMode = "local" | "staging" | "production";
export type DeliveryKind = "internal" | "buyer";
export type DeliveryStatus =
  | "pending"
  | "sent"
  | "retry_scheduled"
  | "failed_permanent"
  | "bounced"
  | "complained";

export interface InquiryInput {
  name: string;
  email: string;
  company: string;
  phone: string | null;
  message: string | null;
  marketingConsent: boolean;
  locale: Locale;
  consentTextVersion: string;
  privacyNoticeVersion: string;
  turnstileToken: string;
}

export interface StoredInquiry extends Omit<InquiryInput, "turnstileToken"> {
  id: string;
  status: "accepted";
  createdAt: number;
  lastActivityAt: number;
  retentionExpiresAt: number;
}

export interface DeliveryRecord {
  id: string;
  inquiryId: string;
  kind: DeliveryKind;
  status: DeliveryStatus;
  attemptCount: number;
  nextAttemptAt: number | null;
  providerEmailId: string | null;
}

export interface EmailMessage {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

export type EmailSendResult =
  | { ok: true; providerId: string }
  | { ok: false; retryable: boolean; code: string };

export interface TurnstileVerifier {
  verify(input: {
    token: string;
    ip: string;
    expectedHostname: string;
    idempotencyKey: string;
  }): Promise<boolean>;
}

export interface EmailSender {
  send(message: EmailMessage, idempotencyKey: string): Promise<EmailSendResult>;
}

export interface IdempotencyRecord {
  inquiryId: string;
  requestHash: string;
}

export interface RateLimitResult {
  allowed: boolean;
  fifteenMinuteCount: number;
  dailyCount: number;
}

export interface InquiryRepository {
  consumeRateLimit(ipHash: string, now: number): Promise<RateLimitResult>;
  findIdempotency(keyHash: string, now: number): Promise<IdempotencyRecord | null>;
  createAcceptedInquiry(input: {
    inquiry: StoredInquiry;
    idempotencyKeyHash: string;
    requestHash: string;
    emailHash: string;
    idempotencyExpiresAt: number;
    consentRetentionExpiresAt: number | null;
  }): Promise<"created" | "conflict">;
  getInquiry(id: string): Promise<StoredInquiry | null>;
  getDelivery(inquiryId: string, kind: DeliveryKind): Promise<DeliveryRecord | null>;
  listDueDeliveries(now: number, limit: number): Promise<DeliveryRecord[]>;
  recordDeliverySuccess(input: {
    deliveryId: string;
    providerEmailId: string;
    now: number;
  }): Promise<void>;
  recordDeliveryFailure(input: {
    deliveryId: string;
    attemptCount: number;
    status: "retry_scheduled" | "failed_permanent";
    nextAttemptAt: number | null;
    errorCode: string;
    now: number;
  }): Promise<void>;
  isWebhookProcessed(eventId: string): Promise<boolean>;
  recordWebhookOnce(input: {
    eventId: string;
    eventType: string;
    providerEmailId: string;
    processedAt: number;
    expiresAt: number;
  }): Promise<boolean>;
  findDeliveryByProviderId(providerEmailId: string): Promise<DeliveryRecord | null>;
  markDeliveryFeedback(input: {
    deliveryId: string;
    status: "bounced" | "complained";
    now: number;
  }): Promise<void>;
  addSuppression(input: {
    emailHash: string;
    reason: "hard_bounce" | "complaint";
    sourceEventId: string;
    now: number;
    annualReviewDueAt: number;
  }): Promise<void>;
}

export interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta?: Record<string, unknown> }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<T[]>;
}

export interface WorkerEnv {
  ASSETS?: AssetsBinding;
  DB?: D1DatabaseLike;
  INQUIRY_ENABLED?: string;
  RUNTIME_MODE?: string;
  USE_LOCAL_MOCKS?: string;
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  RATE_LIMIT_HASH_KEY?: string;
  SUPPRESSION_HASH_KEY?: string;
  RESEND_NOTIFICATION_TO?: string;
  RESEND_FROM_ADDRESS?: string;
  RESEND_REPLY_TO?: string;
  PRIVACY_NOTICE_VERSION?: string;
  MARKETING_CONSENT_VERSION?: string;
  BUYER_CONFIRMATION_SUBJECT_EN?: string;
  BUYER_CONFIRMATION_TEXT_EN?: string;
  BUYER_CONFIRMATION_SUBJECT_ID?: string;
  BUYER_CONFIRMATION_TEXT_ID?: string;
}

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

export const PUBLIC_ORIGINS = new Set([
  "https://www.permatabriquettes.com",
  "https://staging.permatabriquettes.com",
]);

export const LOCAL_ORIGINS = new Set([
  "http://localhost:8787",
  "http://127.0.0.1:8787",
]);

export const MAX_PAYLOAD_BYTES = 16 * 1024;
export const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
export const SECURITY_RETENTION_SECONDS = 30 * 24 * 60 * 60;
export const RETRY_DELAYS_SECONDS = [5 * 60, 30 * 60, 2 * 60 * 60] as const;

export function addUtcMonths(unixSeconds: number, months: number): number {
  const value = new Date(unixSeconds * 1000);
  value.setUTCMonth(value.getUTCMonth() + months);
  return Math.floor(value.getTime() / 1000);
}

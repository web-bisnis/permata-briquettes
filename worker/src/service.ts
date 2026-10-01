import type { ActiveConfig } from "./config";
import { hmacSha256Hex, sha256Hex } from "./crypto";
import type {
  DeliveryKind,
  DeliveryRecord,
  EmailMessage,
  EmailSender,
  ExecutionContextLike,
  InquiryRepository,
  StoredInquiry,
  TurnstileVerifier,
} from "./domain";
import {
  addUtcMonths,
  IDEMPOTENCY_TTL_SECONDS,
  LOCAL_ORIGINS,
  MAX_PAYLOAD_BYTES,
  PUBLIC_ORIGINS,
  RETRY_DELAYS_SECONDS,
} from "./domain";
import { canonicalInquiryForHash, validateInquiryPayload } from "./validation";

export interface ServiceDependencies {
  repository: InquiryRepository;
  turnstile: TurnstileVerifier;
  emailSender: EmailSender;
  now: () => number;
  uuid: () => string;
}

export async function handleInquiry(
  request: Request,
  config: ActiveConfig,
  dependencies: ServiceDependencies,
  context: ExecutionContextLike,
): Promise<Response> {
  if (request.method !== "POST") return jsonError(405, "method_not_allowed", { Allow: "POST" });

  const origin = validateOrigin(request, config.runtimeMode);
  if (!origin.ok) return jsonError(403, "forbidden_origin");

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") return jsonError(415, "unsupported_media_type");

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PAYLOAD_BYTES) {
    return jsonError(413, "payload_too_large");
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[A-Za-z0-9._:-]{16,128}$/u.test(idempotencyKey)) {
    return jsonError(400, "invalid_idempotency_key");
  }

  const ip = request.headers.get("cf-connecting-ip")?.trim() ||
    (config.runtimeMode === "local" ? "127.0.0.1" : "");
  if (!ip) return jsonError(400, "missing_client_address");

  const now = dependencies.now();
  const ipHash = await hmacSha256Hex(config.rateLimitHashKey, ip);
  const rate = await dependencies.repository.consumeRateLimit(ipHash, now);
  if (!rate.allowed) return jsonError(429, "rate_limited", { "Retry-After": "900" });

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_PAYLOAD_BYTES) return jsonError(413, "payload_too_large");

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return jsonError(400, "invalid_json");
  }

  const validation = validateInquiryPayload(
    rawPayload,
    config.marketingConsentVersion,
    config.privacyNoticeVersion,
  );
  if (!validation.ok) return jsonError(400, validation.code);

  const keyHash = await hmacSha256Hex(config.rateLimitHashKey, idempotencyKey);
  const requestHash = await sha256Hex(canonicalInquiryForHash(validation.value));
  const existing = await dependencies.repository.findIdempotency(keyHash, now);
  if (existing) {
    if (existing.requestHash !== requestHash) return jsonError(409, "idempotency_conflict");
    return jsonResponse(200, {
      ok: true,
      status: "accepted",
      referenceId: existing.inquiryId,
      duplicate: true,
    });
  }

  const turnstileValid = await dependencies.turnstile.verify({
    token: validation.value.turnstileToken,
    ip,
    expectedHostname: new URL(origin.value).hostname,
    idempotencyKey,
  });
  if (!turnstileValid) return jsonError(400, "turnstile_failed");

  const inquiry: StoredInquiry = {
    id: dependencies.uuid(),
    status: "accepted",
    name: validation.value.name,
    email: validation.value.email,
    company: validation.value.company,
    phone: validation.value.phone,
    message: validation.value.message,
    marketingConsent: validation.value.marketingConsent,
    locale: validation.value.locale,
    consentTextVersion: validation.value.consentTextVersion,
    privacyNoticeVersion: validation.value.privacyNoticeVersion,
    createdAt: now,
    lastActivityAt: now,
    retentionExpiresAt: addUtcMonths(now, 12),
  };

  const emailHash = await hmacSha256Hex(config.suppressionHashKey, inquiry.email);
  const created = await dependencies.repository.createAcceptedInquiry({
    inquiry,
    idempotencyKeyHash: keyHash,
    requestHash,
    emailHash,
    idempotencyExpiresAt: now + IDEMPOTENCY_TTL_SECONDS,
    consentRetentionExpiresAt: inquiry.marketingConsent ? addUtcMonths(now, 24) : null,
  });

  if (created === "conflict") {
    const raced = await dependencies.repository.findIdempotency(keyHash, now);
    if (raced?.requestHash === requestHash) {
      return jsonResponse(200, {
        ok: true,
        status: "accepted",
        referenceId: raced.inquiryId,
        duplicate: true,
      });
    }
    return jsonError(409, "idempotency_conflict");
  }

  context.waitUntil(processInitialDeliveries(inquiry, config, dependencies));
  return jsonResponse(202, {
    ok: true,
    status: "accepted",
    referenceId: inquiry.id,
    duplicate: false,
  });
}

export async function processInitialDeliveries(
  inquiry: StoredInquiry,
  config: ActiveConfig,
  dependencies: ServiceDependencies,
): Promise<void> {
  for (const kind of ["internal", "buyer"] as const) {
    const delivery = await dependencies.repository.getDelivery(inquiry.id, kind);
    if (delivery) await processDelivery(delivery, inquiry, config, dependencies);
  }
}

export async function processDueDeliveries(
  config: ActiveConfig,
  dependencies: ServiceDependencies,
): Promise<void> {
  const now = dependencies.now();
  const deliveries = await dependencies.repository.listDueDeliveries(now, 50);
  for (const delivery of deliveries) {
    const inquiry = await dependencies.repository.getInquiry(delivery.inquiryId);
    if (inquiry) await processDelivery(delivery, inquiry, config, dependencies);
  }
}

async function processDelivery(
  delivery: DeliveryRecord,
  inquiry: StoredInquiry,
  config: ActiveConfig,
  dependencies: ServiceDependencies,
): Promise<void> {
  const now = dependencies.now();
  const attemptCount = delivery.attemptCount + 1;
  let result;
  try {
    result = await dependencies.emailSender.send(
      buildMessage(delivery.kind, inquiry, config),
      `inquiry/${inquiry.id}/${delivery.kind}`,
    );
  } catch {
    result = { ok: false as const, retryable: true, code: "email_network_error" };
  }

  if (result.ok) {
    await dependencies.repository.recordDeliverySuccess({
      deliveryId: delivery.id,
      providerEmailId: result.providerId,
      now,
    });
    return;
  }

  const retryDelay = RETRY_DELAYS_SECONDS[attemptCount - 1];
  const retryable = result.retryable && retryDelay !== undefined;
  await dependencies.repository.recordDeliveryFailure({
    deliveryId: delivery.id,
    attemptCount,
    status: retryable ? "retry_scheduled" : "failed_permanent",
    nextAttemptAt: retryable ? now + retryDelay : null,
    errorCode: result.code,
    now,
  });
}

function buildMessage(
  kind: DeliveryKind,
  inquiry: StoredInquiry,
  config: ActiveConfig,
): EmailMessage {
  const from = `Permata Briquettes <${config.fromAddress}>`;
  if (kind === "buyer") {
    const template = config.confirmation[inquiry.locale];
    return {
      from,
      to: inquiry.email,
      replyTo: config.replyTo,
      subject: template.subject,
      text: template.text,
    };
  }

  return {
    from,
    to: config.notificationTo,
    replyTo: config.replyTo,
    subject: `Website inquiry ${inquiry.id}`,
    text: [
      `Reference: ${inquiry.id}`,
      `Locale: ${inquiry.locale}`,
      `Name: ${inquiry.name}`,
      `Email: ${inquiry.email}`,
      `Company: ${inquiry.company}`,
      `Phone: ${inquiry.phone ?? ""}`,
      `Marketing consent: ${inquiry.marketingConsent ? "yes" : "no"}`,
      "Message:",
      inquiry.message ?? "",
    ].join("\n"),
  };
}

function validateOrigin(
  request: Request,
  mode: ActiveConfig["runtimeMode"],
): { ok: true; value: string } | { ok: false } {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return { ok: false };
  const allowed = mode === "local" ? LOCAL_ORIGINS : PUBLIC_ORIGINS;
  return allowed.has(origin) ? { ok: true, value: origin } : { ok: false };
}

export function jsonError(
  status: number,
  code: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return jsonResponse(status, { ok: false, code }, extraHeaders);
}

export function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

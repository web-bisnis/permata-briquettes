import type { ActiveConfig } from "./config";
import {
  decodeWebhookSecret,
  hmacSha256Base64,
  hmacSha256Hex,
  timingSafeEqual,
} from "./crypto";
import type { InquiryRepository } from "./domain";
import { addUtcMonths, SECURITY_RETENTION_SECONDS } from "./domain";
import { jsonError } from "./service";

const MAX_WEBHOOK_BYTES = 64 * 1024;

interface WebhookEvent {
  type?: string;
  data?: {
    email_id?: string;
    bounce?: { type?: string; subType?: string };
  };
}

export async function handleResendWebhook(
  request: Request,
  config: ActiveConfig,
  repository: InquiryRepository,
  now: number,
): Promise<Response> {
  if (request.method !== "POST") return jsonError(405, "method_not_allowed", { Allow: "POST" });
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") return jsonError(415, "unsupported_media_type");

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_WEBHOOK_BYTES) return jsonError(413, "payload_too_large");
  const rawBody = new TextDecoder().decode(bytes);

  const eventId = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signature = request.headers.get("svix-signature") ?? "";
  if (
    !(await verifyWebhookSignature({
      eventId,
      timestamp,
      signature,
      rawBody,
      secret: config.resendWebhookSecret,
      now,
    }))
  ) {
    return jsonError(400, "invalid_webhook_signature");
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    return jsonError(400, "invalid_json");
  }

  if (event.type !== "email.bounced" && event.type !== "email.complained") {
    return new Response(null, { status: 204 });
  }
  const providerEmailId = event.data?.email_id;
  if (!providerEmailId) return jsonError(400, "invalid_webhook_payload");

  if (event.type === "email.bounced" && !isHardBounce(event)) {
    return new Response(null, { status: 204 });
  }

  const firstProcessing = await repository.recordWebhookOnce({
    eventId,
    eventType: event.type,
    providerEmailId,
    processedAt: now,
    expiresAt: now + SECURITY_RETENTION_SECONDS,
  });
  if (!firstProcessing) return new Response(null, { status: 204 });

  const delivery = await repository.findDeliveryByProviderId(providerEmailId);
  if (!delivery) return new Response(null, { status: 204 });

  const feedbackStatus = event.type === "email.complained" ? "complained" : "bounced";
  await repository.markDeliveryFeedback({
    deliveryId: delivery.id,
    status: feedbackStatus,
    now,
  });

  if (delivery.kind === "buyer") {
    const inquiry = await repository.getInquiry(delivery.inquiryId);
    if (inquiry) {
      const emailHash = await hmacSha256Hex(config.suppressionHashKey, inquiry.email);
      await repository.addSuppression({
        emailHash,
        reason: event.type === "email.complained" ? "complaint" : "hard_bounce",
        sourceEventId: eventId,
        now,
        annualReviewDueAt: addUtcMonths(now, 12),
      });
    }
  }

  return new Response(null, { status: 204 });
}

export async function verifyWebhookSignature(input: {
  eventId: string;
  timestamp: string;
  signature: string;
  rawBody: string;
  secret: string;
  now: number;
}): Promise<boolean> {
  const timestampSeconds = Number(input.timestamp);
  if (
    !input.eventId ||
    !Number.isInteger(timestampSeconds) ||
    Math.abs(input.now - timestampSeconds) > 5 * 60
  ) {
    return false;
  }

  let expected: string;
  try {
    expected = await hmacSha256Base64(
      decodeWebhookSecret(input.secret),
      `${input.eventId}.${input.timestamp}.${input.rawBody}`,
    );
  } catch {
    return false;
  }

  return input.signature
    .split(/\s+/u)
    .map((part) => part.split(",", 2))
    .some(([version, value]) => version === "v1" && timingSafeEqual(value ?? "", expected));
}

function isHardBounce(event: WebhookEvent): boolean {
  const type = event.data?.bounce?.type?.toLowerCase();
  const subtype = event.data?.bounce?.subType?.toLowerCase();
  return type === "permanent" || type === "hard" || subtype === "hardbounce";
}

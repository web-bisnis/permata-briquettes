import { describe, expect, it } from "vitest";
import { decodeWebhookSecret, hmacSha256Base64 } from "../src/crypto";
import type { StoredInquiry } from "../src/domain";
import { handleResendWebhook } from "../src/webhook";
import { MemoryRepository, testConfig } from "./helpers";

const now = 2_000_000_000;

async function seededRepository() {
  const repository = new MemoryRepository();
  const inquiry: StoredInquiry = {
    id: "inquiry-webhook",
    status: "accepted",
    name: "A",
    email: "a@example.invalid",
    company: "X",
    phone: null,
    message: null,
    marketingConsent: true,
    locale: "en",
    consentTextVersion: "test-consent-version",
    privacyNoticeVersion: "test-privacy-version",
    createdAt: now,
    lastActivityAt: now,
    retentionExpiresAt: now + 1,
  };
  await repository.createAcceptedInquiry({
    inquiry,
    idempotencyKeyHash: "key",
    requestHash: "request",
    emailHash: "email",
    idempotencyExpiresAt: now + 1,
    consentRetentionExpiresAt: now + 1,
  });
  await repository.recordDeliverySuccess({
    deliveryId: "inquiry-webhook-buyer",
    providerEmailId: "provider-buyer",
    now,
  });
  return repository;
}

async function signedRequest(eventId: string, body: string, signatureOverride?: string) {
  const config = testConfig();
  const signature = signatureOverride ?? await hmacSha256Base64(
    decodeWebhookSecret(config.resendWebhookSecret),
    `${eventId}.${now}.${body}`,
  );
  return new Request("https://worker.invalid/api/webhooks/resend", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": eventId,
      "svix-timestamp": String(now),
      "svix-signature": `v1,${signature}`,
    },
    body,
  });
}

describe("Resend webhook", () => {
  it.each([
    ["email.bounced", "hard_bounce", "bounced", { bounce: { type: "Permanent" } }],
    ["email.complained", "complaint", "complained", {}],
  ])("verifies and suppresses buyer marketing on %s", async (type, reason, status, extra) => {
    const repository = await seededRepository();
    const body = JSON.stringify({
      type,
      data: { email_id: "provider-buyer", ...extra },
    });
    const request = await signedRequest(`event-${type}`, body);
    const response = await handleResendWebhook(request, testConfig(), repository, now);
    expect(response.status).toBe(204);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
    expect(repository.suppressions).toHaveLength(1);
    expect(repository.suppressions[0]?.reason).toBe(reason);
    expect((await repository.getDelivery("inquiry-webhook", "buyer"))?.status).toBe(status);

    const duplicate = await handleResendWebhook(
      await signedRequest(`event-${type}`, body),
      testConfig(),
      repository,
      now,
    );
    expect(duplicate.status).toBe(204);
    expect(repository.suppressions).toHaveLength(1);
  });

  it("rejects an invalid signature and ignores non-hard bounce", async () => {
    const repository = await seededRepository();
    const body = JSON.stringify({
      type: "email.bounced",
      data: { email_id: "provider-buyer", bounce: { type: "Transient" } },
    });
    expect((await handleResendWebhook(
      await signedRequest("invalid", body, "invalid"),
      testConfig(),
      repository,
      now,
    )).status).toBe(400);

    expect((await handleResendWebhook(
      await signedRequest("soft", body),
      testConfig(),
      repository,
      now,
    )).status).toBe(204);
    expect(repository.suppressions).toHaveLength(0);
  });
});

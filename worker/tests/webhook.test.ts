import { describe, expect, it } from "vitest";
import { decodeWebhookSecret, hmacSha256Base64 } from "../src/crypto";
import type { StoredInquiry } from "../src/domain";
import { handleFetch } from "../src/app";
import { handleResendWebhook } from "../src/webhook";
import { MemoryRepository, TestContext, testConfig } from "./helpers";

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

  it("answers 503 when an effect fails and processes the same event on retry", async () => {
    class FlakyRepository extends MemoryRepository {
      failNext = true;
      async addSuppression(input: Parameters<MemoryRepository["addSuppression"]>[0]) {
        if (this.failNext) {
          this.failNext = false;
          throw new Error("D1 unavailable");
        }
        return super.addSuppression(input);
      }
    }
    const repository = new FlakyRepository();
    const seeded = await seededRepository();
    repository.inquiries = seeded.inquiries;
    repository.deliveries = seeded.deliveries;
    const env = {
      DB: {} as never,
      INQUIRY_ENABLED: "true",
      RUNTIME_MODE: "local",
      USE_LOCAL_MOCKS: "true",
      RATE_LIMIT_HASH_KEY: "rate-test-key",
      SUPPRESSION_HASH_KEY: "suppression-test-key",
      RESEND_NOTIFICATION_TO: "routing@example.invalid",
      RESEND_FROM_ADDRESS: "routing@example.invalid",
      RESEND_REPLY_TO: "routing@example.invalid",
      PRIVACY_NOTICE_VERSION: "p",
      MARKETING_CONSENT_VERSION: "c",
      BUYER_CONFIRMATION_SUBJECT_EN: "s",
      BUYER_CONFIRMATION_TEXT_EN: "t",
      BUYER_CONFIRMATION_SUBJECT_ID: "s",
      BUYER_CONFIRMATION_TEXT_ID: "t",
    };
    const body = JSON.stringify({ type: "email.complained", data: { email_id: "provider-buyer" } });
    const send = async () =>
      handleFetch(await signedRequest("event-retry", body), env, new TestContext(), {
        repository,
        now: () => now,
      });

    expect((await send()).status).toBe(503);
    expect(repository.webhooks.has("event-retry")).toBe(false);
    expect(repository.suppressions).toHaveLength(0);

    expect((await send()).status).toBe(204);
    expect(repository.suppressions).toHaveLength(1);
    expect(repository.webhooks.has("event-retry")).toBe(true);

    expect((await send()).status).toBe(204);
    expect(repository.suppressions).toHaveLength(1);
  });

  it("does not repeat effects for an event that already succeeded", async () => {
    const repository = await seededRepository();
    let effects = 0;
    const markDeliveryFeedback = repository.markDeliveryFeedback.bind(repository);
    repository.markDeliveryFeedback = async (input) => {
      effects += 1;
      return markDeliveryFeedback(input);
    };
    const body = JSON.stringify({ type: "email.complained", data: { email_id: "provider-buyer" } });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await handleResendWebhook(
        await signedRequest("event-twice", body),
        testConfig(),
        repository,
        now,
      );
      expect(response.status).toBe(204);
    }
    expect(effects).toBe(1);
    expect(repository.suppressions).toHaveLength(1);
  });

  it("ignores an unknown email id without suppression or any record", async () => {
    const repository = await seededRepository();
    const body = JSON.stringify({
      type: "email.bounced",
      data: { email_id: "provider-from-staging", bounce: { type: "Permanent" } },
    });
    const response = await handleResendWebhook(
      await signedRequest("event-unknown", body),
      testConfig(),
      repository,
      now,
    );
    expect(response.status).toBe(204);
    expect(repository.suppressions).toHaveLength(0);
    expect(repository.webhooks.size).toBe(0);
    expect((await repository.getDelivery("inquiry-webhook", "buyer"))?.status).toBe("sent");
  });
});

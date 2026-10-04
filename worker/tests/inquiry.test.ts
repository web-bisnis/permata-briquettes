import { describe, expect, it, vi } from "vitest";
import type { EmailMessage, EmailSender, TurnstileVerifier } from "../src/domain";
import { handleInquiry, processDueDeliveries } from "../src/service";
import {
  inquiryRequest,
  MemoryRepository,
  TestContext,
  testConfig,
  validPayload,
} from "./helpers";
import { BUYER_CONFIRMATION } from "../../src/config/inquiry-copy";

function dependencies(repository = new MemoryRepository()) {
  let now = 2_000_000_000;
  const sent: EmailMessage[] = [];
  const turnstile: TurnstileVerifier = { verify: vi.fn(async () => true) };
  const emailSender: EmailSender = {
    send: vi.fn(async (message) => {
      repository.events.push("email");
      sent.push(message);
      return { ok: true as const, providerId: `provider-${sent.length}` };
    }),
  };
  return {
    repository,
    sent,
    turnstile,
    emailSender,
    setNow(value: number) { now = value; },
    service: {
      repository,
      turnstile,
      emailSender,
      now: () => now,
      uuid: () => `inquiry-${repository.inquiries.size + 1}`,
    },
  };
}

describe("inquiry endpoint", () => {
  it("rejects wrong method, origin, content type, oversized payload, and Turnstile", async () => {
    const deps = dependencies();
    const context = new TestContext();
    expect((await handleInquiry(inquiryRequest(validPayload(), { method: "GET" }), testConfig(), deps.service, context)).status).toBe(405);

    const foreign = inquiryRequest();
    const foreignRequest = new Request(foreign.url, {
      method: "POST",
      headers: { ...Object.fromEntries(foreign.headers), origin: "https://unapproved.invalid" },
      body: await foreign.text(),
    });
    expect((await handleInquiry(foreignRequest, testConfig(), deps.service, context)).status).toBe(403);
    expect((await handleInquiry(inquiryRequest(validPayload(), { contentType: "multipart/form-data" }), testConfig(), deps.service, context)).status).toBe(415);
    expect((await handleInquiry(inquiryRequest(validPayload({ message: "x".repeat(17_000) })), testConfig(), deps.service, context)).status).toBe(413);

    deps.turnstile.verify = vi.fn(async () => false);
    expect((await handleInquiry(inquiryRequest(), testConfig(), deps.service, context)).status).toBe(400);
  });

  it.each([
    ["https://staging.permatabriquettes.com", 202],
    ["https://www.permatabriquettes.com", 202],
    ["https://www.staging.permatabriquettes.com", 403],
    ["https://permatabriquettes.com", 403],
    ["http://localhost:8787", 403],
  ] as const)("applies the public origin allowlist outside local mode: %s -> %i", async (origin, status) => {
    const deps = dependencies();
    const config = { ...testConfig(), runtimeMode: "staging" as const };
    const response = await handleInquiry(
      inquiryRequest(validPayload(), { origin }),
      config,
      deps.service,
      new TestContext(),
    );
    expect(response.status).toBe(status);
  });

  it.each(["en", "id"] as const)("stores before email and keeps %s buyer confirmation free of reflected PII", async (locale) => {
    const deps = dependencies();
    const context = new TestContext();
    const response = await handleInquiry(
      inquiryRequest(validPayload({
        name: "Sensitive Buyer Name",
        email: "buyer-person@example.invalid",
        company: "Sensitive Company Name",
        phone: "+62000111222",
        message: "Sensitive project message",
        marketingConsent: true,
        locale,
      })),
      testConfig(),
      deps.service,
      context,
    );
    expect(response.status).toBe(202);
    expect(deps.repository.inquiries.size).toBe(1);
    await context.drain();
    expect(deps.repository.events.slice(0, 2)).toEqual(["stored", "email"]);
    const buyer = deps.sent[1];
    expect(buyer.subject).toBe(BUYER_CONFIRMATION[locale].subject);
    expect(buyer.text).toBe(BUYER_CONFIRMATION[locale].text);
    for (const pii of [
      "Sensitive Buyer Name",
      "buyer-person@example.invalid",
      "Sensitive Company Name",
      "+62000111222",
      "Sensitive project message",
    ]) expect(buyer.text).not.toContain(pii);
  });

  it("deduplicates the same request for 24 hours and rejects key reuse with changed data", async () => {
    const deps = dependencies();
    const firstContext = new TestContext();
    expect((await handleInquiry(inquiryRequest(), testConfig(), deps.service, firstContext)).status).toBe(202);
    await firstContext.drain();
    const sentCount = deps.sent.length;

    const duplicate = await handleInquiry(inquiryRequest(), testConfig(), deps.service, new TestContext());
    expect(duplicate.status).toBe(200);
    expect(((await duplicate.json()) as { duplicate: boolean }).duplicate).toBe(true);
    expect(deps.sent.length).toBe(sentCount);

    const conflict = await handleInquiry(
      inquiryRequest(validPayload({ company: "Changed" })),
      testConfig(),
      deps.service,
      new TestContext(),
    );
    expect(conflict.status).toBe(409);
  });

  it("enforces 5 requests per 15 minutes and 10 per 24 hours", async () => {
    const short = dependencies();
    for (let index = 0; index < 5; index += 1) {
      const response = await handleInquiry(
        inquiryRequest(validPayload(), { key: `short-window-key-${index.toString().padStart(4, "0")}` }),
        testConfig(),
        short.service,
        new TestContext(),
      );
      expect(response.status).toBe(202);
    }
    expect((await handleInquiry(
      inquiryRequest(validPayload(), { key: "short-window-key-9999" }),
      testConfig(),
      short.service,
      new TestContext(),
    )).status).toBe(429);

    const daily = dependencies();
    for (let index = 0; index < 10; index += 1) {
      daily.setNow(2_000_000_000 + index * 901);
      const response = await handleInquiry(
        inquiryRequest(validPayload(), { key: `daily-window-key-${index.toString().padStart(4, "0")}` }),
        testConfig(),
        daily.service,
        new TestContext(),
      );
      expect(response.status).toBe(202);
    }
    daily.setNow(2_000_000_000 + 10 * 901);
    expect((await handleInquiry(
      inquiryRequest(validPayload(), { key: "daily-window-key-9999" }),
      testConfig(),
      daily.service,
      new TestContext(),
    )).status).toBe(429);
  });

  it("retries network/5xx failures at 5m, 30m, and 2h, then stops", async () => {
    const deps = dependencies();
    deps.emailSender.send = vi.fn(async () => ({
      ok: false as const,
      retryable: true,
      code: "resend_http_500",
    }));
    const context = new TestContext();
    await handleInquiry(inquiryRequest(), testConfig(), deps.service, context);
    await context.drain();
    const delivery = await deps.repository.getDelivery("inquiry-1", "internal");
    expect(delivery?.nextAttemptAt).toBe(2_000_000_300);

    deps.setNow(2_000_000_300);
    await processDueDeliveries(testConfig(), deps.service);
    expect(delivery?.nextAttemptAt).toBe(2_000_002_100);

    deps.setNow(2_000_002_100);
    await processDueDeliveries(testConfig(), deps.service);
    expect(delivery?.nextAttemptAt).toBe(2_000_009_300);

    deps.setNow(2_000_009_300);
    await processDueDeliveries(testConfig(), deps.service);
    expect(delivery?.status).toBe("failed_permanent");
    expect(delivery?.nextAttemptAt).toBeNull();
  });
});

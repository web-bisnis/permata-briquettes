import { describe, expect, it } from "vitest";
import { createDependencies, handleFetch } from "../src/app";
import { LocalEmailSender } from "../src/resend";
import { LocalTurnstileVerifier } from "../src/turnstile";
import type { WorkerEnv } from "../src/domain";
import { MemoryRepository, TestContext, inquiryRequest, testConfig } from "./helpers";
import { BUYER_CONFIRMATION } from "../../src/config/inquiry-copy";

const configuredEnv = (): WorkerEnv => ({
  DB: {} as WorkerEnv["DB"],
  INQUIRY_ENABLED: "true",
  RUNTIME_MODE: "local",
  USE_LOCAL_MOCKS: "true",
  RATE_LIMIT_HASH_KEY: "rate-test-key",
  SUPPRESSION_HASH_KEY: "suppression-test-key",
  RESEND_NOTIFICATION_TO: "routing@example.invalid",
  RESEND_FROM_ADDRESS: "routing@example.invalid",
  RESEND_REPLY_TO: "routing@example.invalid",
  PRIVACY_NOTICE_VERSION: "test-privacy-version",
  MARKETING_CONSENT_VERSION: "test-consent-version",
  BUYER_CONFIRMATION_SUBJECT_EN: BUYER_CONFIRMATION.en.subject,
  BUYER_CONFIRMATION_TEXT_EN: BUYER_CONFIRMATION.en.text,
  BUYER_CONFIRMATION_SUBJECT_ID: BUYER_CONFIRMATION.id.subject,
  BUYER_CONFIRMATION_TEXT_ID: BUYER_CONFIRMATION.id.text,
});

describe("fail-closed application shell", () => {
  it("returns 503 while disabled and still protects the method", async () => {
    const env = { ...configuredEnv(), INQUIRY_ENABLED: "false" };
    const post = await handleFetch(inquiryRequest(), env, new TestContext());
    expect(post.status).toBe(503);
    expect(post.headers.has("access-control-allow-origin")).toBe(false);

    const get = await handleFetch(
      new Request("http://localhost:8787/api/inquiries", { method: "GET" }),
      env,
      new TestContext(),
    );
    expect(get.status).toBe(405);
  });

  it("fails closed if approved copy configuration is absent", async () => {
    const env = configuredEnv();
    delete env.PRIVACY_NOTICE_VERSION;
    expect((await handleFetch(inquiryRequest(), env, new TestContext())).status).toBe(503);
  });

  it("uses local mock adapters and not public HTTP clients in local mode", () => {
    const deps = createDependencies(configuredEnv(), testConfig());
    expect(deps.turnstile).toBeInstanceOf(LocalTurnstileVerifier);
    expect(deps.emailSender).toBeInstanceOf(LocalEmailSender);
  });

  it("can execute with injected local mocks only when explicitly enabled", async () => {
    const repository = new MemoryRepository();
    const dependencies = {
      repository,
      turnstile: new LocalTurnstileVerifier(),
      emailSender: new LocalEmailSender(),
      now: () => 2_000_000_000,
      uuid: () => "local-inquiry",
    };
    const response = await handleFetch(
      inquiryRequest(),
      configuredEnv(),
      new TestContext(),
      { dependencies },
    );
    expect(response.status).toBe(202);
  });
});

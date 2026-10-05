import { describe, expect, it } from "vitest";
import { resolveActivation } from "../src/config";
import type { WorkerEnv } from "../src/domain";

const completeEnv = (): WorkerEnv => ({
  DB: {} as WorkerEnv["DB"],
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
});

describe("resolveActivation address consistency", () => {
  it("activates when the three Resend addresses are identical", () => {
    expect(resolveActivation(completeEnv()).active).toBe(true);
  });

  it.each(["RESEND_NOTIFICATION_TO", "RESEND_FROM_ADDRESS", "RESEND_REPLY_TO"] as const)(
    "stays inactive when %s differs from the others",
    (name) => {
      const env = { ...completeEnv(), [name]: "other@example.invalid" };
      expect(resolveActivation(env)).toEqual({
        active: false,
        reason: "incomplete_configuration",
      });
    },
  );
});

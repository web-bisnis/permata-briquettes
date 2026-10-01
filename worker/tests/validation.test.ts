import { describe, expect, it } from "vitest";
import { validateInquiryPayload } from "../src/validation";
import { validPayload } from "./helpers";
import { INQUIRY_COPY, INQUIRY_LIMITS } from "../../src/config/inquiry-copy";

describe("server payload validation", () => {
  const validate = (payload: unknown) =>
    validateInquiryPayload(payload, "test-consent-version", "test-privacy-version");

  it("accepts the approved field contract and keeps marketing consent optional", () => {
    const result = validate(validPayload());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.marketingConsent).toBe(false);
  });

  it("uses the same field limits as the client copy contract", () => {
    const maximumLengthEmail = `${"a".repeat(INQUIRY_LIMITS.email - 10)}@x.invalid`;
    expect(maximumLengthEmail).toHaveLength(INQUIRY_LIMITS.email);
    expect(validate(validPayload({
      name: "n".repeat(INQUIRY_LIMITS.name),
      email: maximumLengthEmail,
      company: "c".repeat(INQUIRY_LIMITS.company),
      phone: "1".repeat(INQUIRY_LIMITS.phone),
      message: "m".repeat(INQUIRY_LIMITS.message),
    })).ok).toBe(true);

    for (const [field, value] of [
      ["name", "n".repeat(INQUIRY_LIMITS.name + 1)],
      ["email", `${"a".repeat(INQUIRY_LIMITS.email - 9)}@x.invalid`],
      ["company", "c".repeat(INQUIRY_LIMITS.company + 1)],
      ["phone", "1".repeat(INQUIRY_LIMITS.phone + 1)],
      ["message", "m".repeat(INQUIRY_LIMITS.message + 1)],
    ] as const) expect(validate(validPayload({ [field]: value })).ok).toBe(false);

    expect(INQUIRY_COPY.en.validation.name).toBe("Enter your name, up to 100 characters.");
    expect(INQUIRY_COPY.id.validation.message).toBe("Pesan tidak boleh lebih dari 2.000 karakter.");
  });

  it.each([
    ["name", ""],
    ["name", "a".repeat(101)],
    ["email", "invalid"],
    ["email", `${"a".repeat(250)}@x.invalid`],
    ["company", ""],
    ["company", "x".repeat(151)],
    ["phone", "1".repeat(31)],
    ["message", "x".repeat(2001)],
  ])("rejects an invalid %s", (field, value) => {
    expect(validate(validPayload({ [field]: value }))).toEqual({
      ok: false,
      code: "invalid_payload",
    });
  });

  it("rejects attachment-like and unknown fields", () => {
    expect(validate(validPayload({ attachment: "blocked" }))).toEqual({
      ok: false,
      code: "attachment_not_allowed",
    });
    expect(validate(validPayload({ unexpected: true }))).toEqual({
      ok: false,
      code: "invalid_payload",
    });
  });

  it("requires exact approved copy versions", () => {
    expect(validate(validPayload({ consentTextVersion: "other" })).ok).toBe(false);
    expect(validate(validPayload({ privacyNoticeVersion: "other" })).ok).toBe(false);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUYER_CONFIRMATION,
  INQUIRY_COPY,
  MARKETING_CONSENT_TEXT,
} from "../src/config/inquiry-copy";
import { resolveInquiryFeature } from "../src/config/inquiry-feature";
import {
  deterministicContentVersion,
  MARKETING_CONSENT_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "../src/config/inquiry-versions";

describe("approved inquiry copy", () => {
  it("uses the six approved validation messages in each locale", () => {
    expect(INQUIRY_COPY.id.validation).toMatchObject({
      name: "Masukkan nama Anda, maksimum 100 karakter.",
      emailRequired: "Masukkan alamat email Anda.",
      emailInvalid: "Masukkan alamat email yang valid.",
      company: "Masukkan nama perusahaan, maksimum 150 karakter.",
      phone: "Nomor telepon tidak boleh lebih dari 30 karakter.",
      message: "Pesan tidak boleh lebih dari 2.000 karakter.",
    });
    expect(INQUIRY_COPY.en.validation).toMatchObject({
      name: "Enter your name, up to 100 characters.",
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter a valid email address.",
      company: "Enter your company name, up to 150 characters.",
      phone: "Telephone number must not exceed 30 characters.",
      message: "Message must not exceed 2,000 characters.",
    });
  });

  it("uses the approved consent and confirmation copy", () => {
    expect(INQUIRY_COPY.id.marketingConsentLabel).toBe(MARKETING_CONSENT_TEXT.id);
    expect(INQUIRY_COPY.en.marketingConsentLabel).toBe(MARKETING_CONSENT_TEXT.en);
    expect(BUYER_CONFIRMATION.id).toEqual({
      subject: "Inquiry Anda telah diterima | Permata Briquettes",
      text: "Terima kasih. Inquiry Anda telah kami terima. Tim kami akan meninjaunya dan berupaya merespons dalam satu hari kerja. Untuk pertanyaan terkait data pribadi, hubungi office@permatabriquettes.com.",
    });
    expect(BUYER_CONFIRMATION.en).toEqual({
      subject: "Your inquiry has been received | Permata Briquettes",
      text: "Thank you. We have received your inquiry. Our team will review it and aims to respond within one business day. For questions about personal data, please contact office@permatabriquettes.com.",
    });
  });

  it("derives stable SHA-256 versions from canonical content", async () => {
    expect(PRIVACY_NOTICE_VERSION).toMatch(/^sha256-[a-f0-9]{64}$/u);
    expect(MARKETING_CONSENT_VERSION).toBe(
      await deterministicContentVersion("marketing-consent", MARKETING_CONSENT_TEXT),
    );
    expect(
      await deterministicContentVersion("marketing-consent", {
        ...MARKETING_CONSENT_TEXT,
        en: `${MARKETING_CONSENT_TEXT.en} changed`,
      }),
    ).not.toBe(MARKETING_CONSENT_VERSION);
  });
});

describe("inquiry feature gate", () => {
  it("fails closed unless the flag and a valid mode are explicit", () => {
    expect(resolveInquiryFeature({})).toMatchObject({ enabled: false, mode: "off" });
    expect(resolveInquiryFeature({ PUBLIC_INQUIRY_FORM_ENABLED: "true" })).toMatchObject({
      enabled: false,
      mode: "off",
    });
    expect(resolveInquiryFeature({
      PUBLIC_INQUIRY_FORM_ENABLED: "true",
      PUBLIC_INQUIRY_FORM_MODE: "live",
    })).toMatchObject({ enabled: false, mode: "off" });
  });

  it("allows an explicit local mock without a Turnstile key", () => {
    expect(resolveInquiryFeature({
      PUBLIC_INQUIRY_FORM_ENABLED: "true",
      PUBLIC_INQUIRY_FORM_MODE: "local-mock",
    })).toMatchObject({ enabled: true, mode: "local-mock", useLocalMock: true });
  });
});

describe("Worker version configuration", () => {
  // The page sends versions hashed from the built content; the Worker rejects any
  // payload whose versions differ from its own variables (400 invalid_payload).
  // A drifted value silently breaks every live submission, so pin it here.
  const root = process.cwd();
  const wrangler = JSON.parse(readFileSync(join(root, "wrangler.jsonc"), "utf8"));
  const devVars = readFileSync(join(root, ".dev.vars.example"), "utf8");

  it.each(["staging", "production"])("%s Worker versions match the built content", (target) => {
    const vars = wrangler.env[target].vars;
    expect(vars.PRIVACY_NOTICE_VERSION).toBe(PRIVACY_NOTICE_VERSION);
    expect(vars.MARKETING_CONSENT_VERSION).toBe(MARKETING_CONSENT_VERSION);
  });

  it("keeps the example local variables in step", () => {
    expect(devVars).toContain(`PRIVACY_NOTICE_VERSION="${PRIVACY_NOTICE_VERSION}"`);
    expect(devVars).toContain(`MARKETING_CONSENT_VERSION="${MARKETING_CONSENT_VERSION}"`);
  });
});

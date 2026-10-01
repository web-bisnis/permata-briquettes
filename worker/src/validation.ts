import type { InquiryInput } from "./domain";

const ALLOWED_FIELDS = new Set([
  "name",
  "email",
  "company",
  "phone",
  "message",
  "marketingConsent",
  "locale",
  "consentTextVersion",
  "privacyNoticeVersion",
  "turnstileToken",
]);

const ATTACHMENT_FIELDS = new Set([
  "attachment",
  "attachments",
  "file",
  "files",
  "upload",
  "uploads",
]);

export type ValidationResult =
  | { ok: true; value: InquiryInput }
  | { ok: false; code: "invalid_payload" | "attachment_not_allowed" };

export function validateInquiryPayload(
  payload: unknown,
  expectedConsentVersion: string,
  expectedPrivacyVersion: string,
): ValidationResult {
  if (!isPlainObject(payload)) return { ok: false, code: "invalid_payload" };

  const keys = Object.keys(payload);
  if (keys.some((key) => ATTACHMENT_FIELDS.has(key.toLowerCase()))) {
    return { ok: false, code: "attachment_not_allowed" };
  }
  if (keys.some((key) => !ALLOWED_FIELDS.has(key))) {
    return { ok: false, code: "invalid_payload" };
  }

  const name = normalizeText(payload.name);
  const email = normalizeEmail(payload.email);
  const company = normalizeText(payload.company);
  const phone = normalizeOptionalText(payload.phone);
  const message = normalizeOptionalText(payload.message, true);
  const token = normalizeText(payload.turnstileToken);

  if (
    !name ||
    charLength(name) > 100 ||
    !email ||
    charLength(email) > 254 ||
    !isValidEmail(email) ||
    !company ||
    charLength(company) > 150 ||
    phone === undefined ||
    (phone !== null && charLength(phone) > 30) ||
    message === undefined ||
    (message !== null && charLength(message) > 2000) ||
    !token ||
    charLength(token) > 2048 ||
    (payload.locale !== "en" && payload.locale !== "id") ||
    typeof payload.marketingConsent !== "boolean" ||
    payload.consentTextVersion !== expectedConsentVersion ||
    payload.privacyNoticeVersion !== expectedPrivacyVersion
  ) {
    return { ok: false, code: "invalid_payload" };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      company,
      phone,
      message,
      marketingConsent: payload.marketingConsent,
      locale: payload.locale,
      consentTextVersion: payload.consentTextVersion,
      privacyNoticeVersion: payload.privacyNoticeVersion,
      turnstileToken: token,
    },
  };
}

export function canonicalInquiryForHash(input: InquiryInput): string {
  return JSON.stringify({
    name: input.name,
    email: input.email,
    company: input.company,
    phone: input.phone,
    message: input.message,
    marketingConsent: input.marketingConsent,
    locale: input.locale,
    consentTextVersion: input.consentTextVersion,
    privacyNoticeVersion: input.privacyNoticeVersion,
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEmail(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : null;
}

function normalizeText(value: unknown, preserveNewlines = false): string | null {
  if (typeof value !== "string") return null;
  const lineNormalized = value.replace(/\r\n?/g, "\n").normalize("NFC").trim();
  if (/[^\P{Cc}\t\n]/u.test(lineNormalized)) return null;
  return preserveNewlines ? lineNormalized : lineNormalized.replace(/\s+/g, " ");
}

function normalizeOptionalText(
  value: unknown,
  preserveNewlines = false,
): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const normalized = normalizeText(value, preserveNewlines);
  return normalized === null ? undefined : normalized || null;
}

function charLength(value: string): number {
  return Array.from(value).length;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
}

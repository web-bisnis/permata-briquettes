import privacyNoticeEn from "../content/pages/en/privacy.md?raw";
import privacyNoticeId from "../content/pages/id/privasi.md?raw";
import { MARKETING_CONSENT_TEXT } from "./inquiry-copy";

type LocalizedContent = Readonly<Record<"en" | "id", string>>;

function normalize(value: string): string {
  return value.replace(/\r\n?/gu, "\n").trim();
}

export async function deterministicContentVersion(
  namespace: string,
  content: LocalizedContent,
): Promise<string> {
  const canonical = JSON.stringify({
    namespace,
    en: normalize(content.en),
    id: normalize(content.id),
  });
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  return `sha256-${hex}`;
}

const privacyNoticeContent = {
  en: privacyNoticeEn,
  id: privacyNoticeId,
};

export const PRIVACY_NOTICE_VERSION = await deterministicContentVersion(
  "privacy-notice",
  privacyNoticeContent,
);

export const MARKETING_CONSENT_VERSION = await deterministicContentVersion(
  "marketing-consent",
  MARKETING_CONSENT_TEXT,
);

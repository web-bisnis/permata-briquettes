export type InquiryFormMode = "off" | "local-mock" | "live";

interface InquiryFeatureEnvironment {
  PUBLIC_INQUIRY_FORM_ENABLED?: string;
  PUBLIC_INQUIRY_FORM_MODE?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
}

export interface InquiryFeature {
  enabled: boolean;
  mode: InquiryFormMode;
  useLocalMock: boolean;
  turnstileSiteKey: string;
}

export function resolveInquiryFeature(
  environment: InquiryFeatureEnvironment,
): InquiryFeature {
  const requested = environment.PUBLIC_INQUIRY_FORM_ENABLED === "true";
  const mode = environment.PUBLIC_INQUIRY_FORM_MODE;
  const turnstileSiteKey = environment.PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  if (!requested) {
    return { enabled: false, mode: "off", useLocalMock: false, turnstileSiteKey: "" };
  }

  if (mode === "local-mock") {
    return { enabled: true, mode, useLocalMock: true, turnstileSiteKey: "" };
  }

  if (mode === "live" && turnstileSiteKey) {
    return { enabled: true, mode, useLocalMock: false, turnstileSiteKey };
  }

  return { enabled: false, mode: "off", useLocalMock: false, turnstileSiteKey: "" };
}

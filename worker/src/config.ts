import type { RuntimeMode, WorkerEnv } from "./domain";

export interface ActiveConfig {
  runtimeMode: RuntimeMode;
  useLocalMocks: boolean;
  turnstileSecret: string;
  resendApiKey: string;
  resendWebhookSecret: string;
  rateLimitHashKey: string;
  suppressionHashKey: string;
  notificationTo: string;
  fromAddress: string;
  replyTo: string;
  privacyNoticeVersion: string;
  marketingConsentVersion: string;
  confirmation: Record<"en" | "id", { subject: string; text: string }>;
}

export type ActivationResult =
  | { active: true; config: ActiveConfig }
  | { active: false; reason: "disabled" | "incomplete_configuration" };

const required = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export function resolveActivation(env: WorkerEnv): ActivationResult {
  if (env.INQUIRY_ENABLED !== "true") {
    return { active: false, reason: "disabled" };
  }

  const mode = env.RUNTIME_MODE;
  if (mode !== "local" && mode !== "staging" && mode !== "production") {
    return { active: false, reason: "incomplete_configuration" };
  }

  const useLocalMocks = mode === "local" && env.USE_LOCAL_MOCKS === "true";
  if (mode === "local" && !useLocalMocks) {
    return { active: false, reason: "incomplete_configuration" };
  }

  const values = {
    rateLimitHashKey: required(env.RATE_LIMIT_HASH_KEY),
    suppressionHashKey: required(env.SUPPRESSION_HASH_KEY),
    privacyNoticeVersion: required(env.PRIVACY_NOTICE_VERSION),
    marketingConsentVersion: required(env.MARKETING_CONSENT_VERSION),
    subjectEn: required(env.BUYER_CONFIRMATION_SUBJECT_EN),
    textEn: required(env.BUYER_CONFIRMATION_TEXT_EN),
    subjectId: required(env.BUYER_CONFIRMATION_SUBJECT_ID),
    textId: required(env.BUYER_CONFIRMATION_TEXT_ID),
    notificationTo: required(env.RESEND_NOTIFICATION_TO),
    fromAddress: required(env.RESEND_FROM_ADDRESS),
    replyTo: required(env.RESEND_REPLY_TO),
  };

  if (Object.values(values).some((value) => value === null) || !env.DB) {
    return { active: false, reason: "incomplete_configuration" };
  }

  if (
    values.notificationTo !== values.fromAddress ||
    values.fromAddress !== values.replyTo
  ) {
    return { active: false, reason: "incomplete_configuration" };
  }

  const turnstileSecret = useLocalMocks ? "local-mock" : required(env.TURNSTILE_SECRET);
  const resendApiKey = useLocalMocks ? "local-mock" : required(env.RESEND_API_KEY);
  const resendWebhookSecret = useLocalMocks
    ? required(env.RESEND_WEBHOOK_SECRET) ?? "whsec_bG9jYWwtbW9jaw=="
    : required(env.RESEND_WEBHOOK_SECRET);

  if (!turnstileSecret || !resendApiKey || !resendWebhookSecret) {
    return { active: false, reason: "incomplete_configuration" };
  }

  return {
    active: true,
    config: {
      runtimeMode: mode,
      useLocalMocks,
      turnstileSecret,
      resendApiKey,
      resendWebhookSecret,
      rateLimitHashKey: values.rateLimitHashKey!,
      suppressionHashKey: values.suppressionHashKey!,
      notificationTo: values.notificationTo!,
      fromAddress: values.fromAddress!,
      replyTo: values.replyTo!,
      privacyNoticeVersion: values.privacyNoticeVersion!,
      marketingConsentVersion: values.marketingConsentVersion!,
      confirmation: {
        en: { subject: values.subjectEn!, text: values.textEn! },
        id: { subject: values.subjectId!, text: values.textId! },
      },
    },
  };
}

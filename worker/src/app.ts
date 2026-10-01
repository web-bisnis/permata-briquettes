import type { ActiveConfig } from "./config";
import { resolveActivation } from "./config";
import { D1InquiryRepository } from "./d1-repository";
import type {
  ExecutionContextLike,
  InquiryRepository,
  WorkerEnv,
} from "./domain";
import { LocalEmailSender, ResendEmailSender } from "./resend";
import {
  handleInquiry,
  jsonError,
  processDueDeliveries,
  type ServiceDependencies,
} from "./service";
import { CloudflareTurnstileVerifier, LocalTurnstileVerifier } from "./turnstile";
import { handleResendWebhook } from "./webhook";

export interface AppOverrides {
  dependencies?: ServiceDependencies;
  repository?: InquiryRepository;
  now?: () => number;
}

export async function handleFetch(
  request: Request,
  env: WorkerEnv,
  context: ExecutionContextLike,
  overrides: AppOverrides = {},
): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/inquiries") {
    const activation = resolveActivation(env);
    if (!activation.active) return jsonError(503, "inquiry_unavailable");
    if (request.method !== "POST") return jsonError(405, "method_not_allowed", { Allow: "POST" });
    try {
      const dependencies = overrides.dependencies ?? createDependencies(env, activation.config);
      return await handleInquiry(request, activation.config, dependencies, context);
    } catch {
      return jsonError(503, "inquiry_unavailable");
    }
  }

  if (pathname === "/api/webhooks/resend") {
    const activation = resolveActivation(env);
    if (!activation.active) return jsonError(503, "webhook_unavailable");
    if (request.method !== "POST") return jsonError(405, "method_not_allowed", { Allow: "POST" });
    try {
      const repository = overrides.repository ?? new D1InquiryRepository(env.DB!);
      const now = (overrides.now ?? unixNow)();
      return await handleResendWebhook(request, activation.config, repository, now);
    } catch {
      return jsonError(503, "webhook_unavailable");
    }
  }

  if (!env.ASSETS) return new Response("Not found", { status: 404 });
  return env.ASSETS.fetch(request);
}

export async function handleScheduled(
  env: WorkerEnv,
  overrides: AppOverrides = {},
): Promise<void> {
  const activation = resolveActivation(env);
  if (!activation.active) return;
  const dependencies = overrides.dependencies ?? createDependencies(env, activation.config);
  await processDueDeliveries(activation.config, dependencies);
}

export function createDependencies(env: WorkerEnv, config: ActiveConfig): ServiceDependencies {
  if (!env.DB) throw new Error("D1 binding unavailable");
  return {
    repository: new D1InquiryRepository(env.DB),
    turnstile: config.useLocalMocks
      ? new LocalTurnstileVerifier()
      : new CloudflareTurnstileVerifier(config.turnstileSecret),
    emailSender: config.useLocalMocks
      ? new LocalEmailSender()
      : new ResendEmailSender(config.resendApiKey),
    now: unixNow,
    uuid: () => crypto.randomUUID(),
  };
}

function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

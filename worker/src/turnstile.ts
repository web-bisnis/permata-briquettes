import type { TurnstileVerifier } from "./domain";

interface SiteverifyResponse {
  success?: boolean;
  hostname?: string;
  action?: string;
}

export class CloudflareTurnstileVerifier implements TurnstileVerifier {
  constructor(
    private readonly secret: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async verify(input: {
    token: string;
    ip: string;
    expectedHostname: string;
    idempotencyKey: string;
  }): Promise<boolean> {
    const body = new URLSearchParams({
      secret: this.secret,
      response: input.token,
      remoteip: input.ip,
      idempotency_key: input.idempotencyKey,
    });
    try {
      const response = await this.fetcher(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body,
        },
      );
      if (!response.ok) return false;
      const result = (await response.json()) as SiteverifyResponse;
      return (
        result.success === true &&
        result.action === "inquiry" &&
        result.hostname === input.expectedHostname
      );
    } catch {
      return false;
    }
  }
}

export class LocalTurnstileVerifier implements TurnstileVerifier {
  async verify(input: { token: string }): Promise<boolean> {
    return input.token === "local-turnstile-pass";
  }
}

import type { EmailMessage, EmailSender, EmailSendResult } from "./domain";

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async send(message: EmailMessage, idempotencyKey: string): Promise<EmailSendResult> {
    try {
      const response = await this.fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          reply_to: message.replyTo,
          subject: message.subject,
          text: message.text,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as { id?: string };
        return data.id
          ? { ok: true, providerId: data.id }
          : { ok: false, retryable: false, code: "invalid_provider_response" };
      }
      return {
        ok: false,
        retryable: response.status >= 500,
        code: `resend_http_${response.status}`,
      };
    } catch {
      return { ok: false, retryable: true, code: "resend_network_error" };
    }
  }
}

export class LocalEmailSender implements EmailSender {
  async send(_message: EmailMessage, idempotencyKey: string): Promise<EmailSendResult> {
    return { ok: true, providerId: `mock-${idempotencyKey}` };
  }
}

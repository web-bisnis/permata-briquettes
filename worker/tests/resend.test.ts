import { describe, expect, it, vi } from "vitest";
import { ResendEmailSender } from "../src/resend";

const message = {
  from: "Permata Briquettes <routing@example.invalid>",
  to: "recipient@example.invalid",
  replyTo: "routing@example.invalid",
  subject: "Subject",
  text: "Body",
};

describe("Resend failure classification", () => {
  it("retries network and 5xx failures only", async () => {
    const network = new ResendEmailSender("test", vi.fn(async () => {
      throw new Error("network");
    }) as typeof fetch);
    expect(await network.send(message, "key")).toMatchObject({ ok: false, retryable: true });

    const server = new ResendEmailSender(
      "test",
      vi.fn(async () => new Response("", { status: 503 })) as typeof fetch,
    );
    expect(await server.send(message, "key")).toMatchObject({ ok: false, retryable: true });

    const client = new ResendEmailSender(
      "test",
      vi.fn(async () => new Response("", { status: 400 })) as typeof fetch,
    );
    expect(await client.send(message, "key")).toMatchObject({ ok: false, retryable: false });
  });

  it("uses a stable provider idempotency header", async () => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ id: "provider-id" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }));
    const sender = new ResendEmailSender("test", fetcher);
    expect(await sender.send(message, "stable-key")).toEqual({ ok: true, providerId: "provider-id" });
    const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers);
    expect(headers.get("idempotency-key")).toBe("stable-key");
  });
});

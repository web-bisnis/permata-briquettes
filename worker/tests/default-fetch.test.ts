import { afterEach, describe, expect, it, vi } from "vitest";
import { ResendEmailSender } from "../src/resend";
import { CloudflareTurnstileVerifier } from "../src/turnstile";

// Workers throw "Illegal invocation" when the global fetch is called as a method
// of another object. The adapters swallow errors, so the failure looked like a
// rejected token or a network error. The stub reproduces that rule.
function stubStrictGlobalFetch(response: Response) {
  const stub = vi.fn(function (this: unknown) {
    if (this !== undefined && this !== globalThis) {
      throw new TypeError("Illegal invocation");
    }
    return Promise.resolve(response);
  });
  vi.stubGlobal("fetch", stub);
  return stub;
}

afterEach(() => vi.unstubAllGlobals());

describe("default fetch binding", () => {
  it("Turnstile verifier reaches siteverify through the global fetch", async () => {
    const stub = stubStrictGlobalFetch(
      Response.json({ success: true, action: "inquiry", hostname: "staging.example.invalid" }),
    );
    const verifier = new CloudflareTurnstileVerifier("secret");
    await expect(
      verifier.verify({
        token: "t",
        ip: "203.0.113.1",
        expectedHostname: "staging.example.invalid",
        idempotencyKey: "k",
      }),
    ).resolves.toBe(true);
    expect(stub).toHaveBeenCalledOnce();
  });

  it("Resend sender reaches the API through the global fetch", async () => {
    const stub = stubStrictGlobalFetch(Response.json({ id: "email_1" }));
    const sender = new ResendEmailSender("key");
    await expect(
      sender.send(
        {
          from: "a@example.invalid",
          to: "b@example.invalid",
          replyTo: "a@example.invalid",
          subject: "s",
          text: "t",
        },
        "idem",
      ),
    ).resolves.toEqual({ ok: true, providerId: "email_1" });
    expect(stub).toHaveBeenCalledOnce();
  });
});

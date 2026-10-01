const forms = document.querySelectorAll<HTMLFormElement>("[data-inquiry-form]");

function normalizedValue(control: HTMLInputElement | HTMLTextAreaElement): string {
  return control.value.replace(/\r\n?/gu, "\n").normalize("NFC").trim();
}

function applyValidationMessage(control: HTMLInputElement | HTMLTextAreaElement): void {
  control.setCustomValidity("");
  const value = normalizedValue(control);
  const length = Array.from(value).length;

  if (control.required && !value) {
    control.setCustomValidity(control.dataset.requiredMessage ?? "");
    return;
  }

  if (
    control.name === "email" &&
    value &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value) || length > control.maxLength)
  ) {
    control.setCustomValidity(control.dataset.typeMessage ?? "");
    return;
  }

  if (control.maxLength > -1 && length > control.maxLength) {
    control.setCustomValidity(control.dataset.tooLongMessage ?? "");
  }
}

for (const form of forms) {
  let idempotencyKey = crypto.randomUUID();
  const status = form.querySelector<HTMLElement>("[data-inquiry-status]");
  const submit = form.querySelector<HTMLButtonElement>("button[type='submit']");

  for (const control of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "input, textarea",
  )) {
    control.addEventListener("input", () => applyValidationMessage(control));
    control.addEventListener("invalid", () => applyValidationMessage(control));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    for (const control of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input, textarea",
    )) applyValidationMessage(control);
    if (!form.reportValidity() || !submit || !status) return;

    const turnstileToken = form.querySelector<HTMLInputElement>(
      "input[name='cf-turnstile-response']",
    )?.value;
    if (!turnstileToken) {
      status.textContent = form.querySelector<HTMLElement>(".cf-turnstile")?.dataset
        .turnstileMessage ?? "";
      return;
    }

    if (form.dataset.localMock === "true") {
      const localHostname = window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      status.textContent = localHostname
        ? form.dataset.successMessage ?? ""
        : form.dataset.errorMessage ?? "";
      if (localHostname) form.reset();
      return;
    }

    const field = <T extends HTMLInputElement | HTMLTextAreaElement>(name: string) =>
      form.elements.namedItem(name) as T;
    const payload = {
      name: field<HTMLInputElement>("name").value,
      email: field<HTMLInputElement>("email").value,
      company: field<HTMLInputElement>("company").value,
      phone: field<HTMLInputElement>("phone").value || null,
      message: field<HTMLTextAreaElement>("message").value || null,
      marketingConsent: field<HTMLInputElement>("marketingConsent").checked,
      locale: form.dataset.locale,
      consentTextVersion: form.dataset.consentVersion,
      privacyNoticeVersion: form.dataset.privacyVersion,
      turnstileToken,
    };

    submit.disabled = true;
    submit.textContent = form.dataset.submittingLabel ?? submit.textContent;
    status.textContent = "";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Inquiry rejected");
      status.textContent = form.dataset.successMessage ?? "";
      form.reset();
      idempotencyKey = crypto.randomUUID();
      window.turnstile?.reset();
    } catch {
      status.textContent = form.dataset.errorMessage ?? "";
      window.turnstile?.reset();
    } finally {
      submit.disabled = false;
      submit.textContent = submit.dataset.submitLabel ?? submit.textContent;
    }
  });
}

declare global {
  interface Window {
    turnstile?: { reset(): void };
  }
}

export {};

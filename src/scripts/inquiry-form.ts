const forms = document.querySelectorAll<HTMLFormElement>("[data-inquiry-form]");

type Control = HTMLInputElement | HTMLTextAreaElement;

const REFERENCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const TEXT_CONTROLS = "input:not([type='hidden']):not([type='checkbox']), textarea";

function normalizedValue(control: Control): string {
  return control.value.replace(/\r\n?/gu, "\n").normalize("NFC").trim();
}

function applyValidationMessage(control: Control): void {
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

function renderFieldError(control: Control): void {
  const error = control
    .closest(".inquiry__field")
    ?.querySelector<HTMLElement>("[data-field-error]");
  if (!error) return;
  const message = control.validationMessage;
  error.textContent = message;
  error.hidden = !message;
  if (message) {
    if (!error.id) error.id = `${control.name}-error`;
    control.setAttribute("aria-invalid", "true");
    control.setAttribute("aria-describedby", error.id);
  } else {
    control.removeAttribute("aria-invalid");
    control.removeAttribute("aria-describedby");
  }
}

function setStatus(status: HTMLElement, state: "error" | "", message: string): void {
  status.textContent = message;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

for (const form of forms) {
  let idempotencyKey = crypto.randomUUID();
  const status = form.querySelector<HTMLElement>("[data-inquiry-status]");
  const submit = form.querySelector<HTMLButtonElement>("button[type='submit']");

  for (const control of form.querySelectorAll<Control>(TEXT_CONTROLS)) {
    control.addEventListener("input", () => {
      applyValidationMessage(control);
      renderFieldError(control);
    });
    // Tabbing past an untouched field is not an error; only a filled one is checked on blur.
    control.addEventListener("blur", () => {
      if (!control.value.trim()) return;
      applyValidationMessage(control);
      renderFieldError(control);
    });
    // The messages are shown inline, so the browser's own bubble is suppressed.
    control.addEventListener("invalid", (event) => {
      event.preventDefault();
      applyValidationMessage(control);
      renderFieldError(control);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!submit || !status) return;

    const controls = [...form.querySelectorAll<Control>(TEXT_CONTROLS)];
    for (const control of controls) applyValidationMessage(control);
    if (!form.checkValidity()) {
      for (const control of controls) renderFieldError(control);
      controls.find((control) => !control.validity.valid)?.focus();
      setStatus(status, "", "");
      return;
    }

    const turnstileToken = form.querySelector<HTMLInputElement>(
      "input[name='cf-turnstile-response']",
    )?.value;
    if (!turnstileToken) {
      setStatus(
        status,
        "error",
        form.querySelector<HTMLElement>(".cf-turnstile")?.dataset.turnstileMessage ?? "",
      );
      return;
    }

    if (form.dataset.localMock === "true") {
      const localHostname = window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (localHostname && form.dataset.successHref) {
        window.location.assign(form.dataset.successHref);
        return;
      }
      setStatus(status, "error", form.dataset.errorMessage ?? "");
      return;
    }

    const field = <T extends Control>(name: string) =>
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
    submit.setAttribute("aria-busy", "true");
    submit.textContent = form.dataset.submittingLabel ?? submit.textContent;
    setStatus(status, "", "");
    let redirecting = false;
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
      const result = (await response.json().catch(() => null)) as
        | { referenceId?: unknown }
        | null;
      const reference =
        typeof result?.referenceId === "string" && REFERENCE_PATTERN.test(result.referenceId)
          ? result.referenceId
          : null;
      const successHref = form.dataset.successHref;
      if (successHref) {
        redirecting = true;
        window.location.assign(reference ? `${successHref}?ref=${reference}` : successHref);
        return;
      }
      setStatus(status, "", form.dataset.successMessage ?? "");
      form.reset();
      idempotencyKey = crypto.randomUUID();
      window.turnstile?.reset();
    } catch {
      setStatus(status, "error", form.dataset.errorMessage ?? "");
      window.turnstile?.reset();
    } finally {
      // The button stays locked while the browser navigates to the confirmation page.
      if (!redirecting) {
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        submit.textContent = submit.dataset.submitLabel ?? submit.textContent;
      }
    }
  });
}

declare global {
  interface Window {
    turnstile?: { reset(): void };
  }
}

export {};

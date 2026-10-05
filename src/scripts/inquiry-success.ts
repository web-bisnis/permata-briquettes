// The reference arrives as ?ref=<inquiry id>. Only a well-formed id is shown, and only as text.
const REFERENCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

const reference = new URLSearchParams(window.location.search).get("ref");
const box = document.querySelector<HTMLElement>("[data-inquiry-reference]");
const value = document.querySelector<HTMLElement>("[data-inquiry-reference-value]");

if (reference && REFERENCE_PATTERN.test(reference) && box && value) {
  value.textContent = reference;
  box.hidden = false;
}

// Land on the confirmation for screen readers.
document.getElementById("inquiry-success-heading")?.focus({ preventScroll: true });

export {};

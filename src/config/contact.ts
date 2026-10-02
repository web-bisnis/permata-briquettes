import type { MediaLocale } from "./media-slots";

/** Official direct-contact channels; the same values appear on the contact page. */
export const CONTACT = {
  email: "marketing@permatabriquettes.com",
  whatsappNumber: "6281130887797",
} as const;

export interface ContactAction {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

const LABELS: Record<MediaLocale, { email: string; whatsapp: string }> = {
  id: { email: "Kirim email", whatsapp: "Chat WhatsApp" },
  en: { email: "Send an email", whatsapp: "Chat on WhatsApp" },
};

/** Email first, then WhatsApp, as decided for the contact stage. */
export function contactActions(lang: MediaLocale): ContactAction[] {
  return [
    { label: LABELS[lang].email, href: `mailto:${CONTACT.email}`, variant: "primary" },
    { label: LABELS[lang].whatsapp, href: `https://wa.me/${CONTACT.whatsappNumber}`, variant: "secondary" },
  ];
}

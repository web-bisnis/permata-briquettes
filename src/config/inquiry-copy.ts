export const INQUIRY_LIMITS = {
  name: 100,
  email: 254,
  company: 150,
  phone: 30,
  message: 2_000,
} as const;

export const PRIVACY_CONTACT_EMAIL = "office@permatabriquettes.com";

export const MARKETING_CONSENT_TEXT = {
  id: "Saya setuju menerima komunikasi pemasaran melalui email dari PT Permata Bara Globalindo. Saya dapat menarik persetujuan kapan saja dengan menghubungi office@permatabriquettes.com.",
  en: "I agree to receive marketing communications by email from PT Permata Bara Globalindo. I may withdraw my consent at any time by contacting office@permatabriquettes.com.",
} as const;

export const BUYER_CONFIRMATION = {
  id: {
    subject: "Inquiry Anda telah diterima | Permata Briquettes",
    text: "Terima kasih. Inquiry Anda telah kami terima. Tim kami akan meninjaunya dan berupaya merespons dalam satu hari kerja. Untuk pertanyaan terkait data pribadi, hubungi office@permatabriquettes.com.",
  },
  en: {
    subject: "Your inquiry has been received | Permata Briquettes",
    text: "Thank you. We have received your inquiry. Our team will review it and aims to respond within one business day. For questions about personal data, please contact office@permatabriquettes.com.",
  },
} as const;

export const INQUIRY_COPY = {
  id: {
    heading: "Inquiry",
    nameLabel: "Nama",
    emailLabel: "Email",
    companyLabel: "Perusahaan",
    phoneLabel: "Telepon",
    messageLabel: "Pesan",
    optionalLabel: "opsional",
    marketingConsentLabel: MARKETING_CONSENT_TEXT.id,
    privacyLinkLabel: "Pemberitahuan Privasi",
    warning: "Mohon jangan mengirimkan data sensitif, data keuangan, dokumen identitas, atau informasi rahasia melalui form inquiry.",
    submitLabel: "Kirim inquiry",
    submittingLabel: "Mengirim…",
    successMessage: "Terima kasih. Inquiry Anda telah kami terima.",
    errorMessage: "Inquiry tidak dapat dikirim. Silakan coba lagi.",
    validation: {
      name: "Masukkan nama Anda, maksimum 100 karakter.",
      emailRequired: "Masukkan alamat email Anda.",
      emailInvalid: "Masukkan alamat email yang valid.",
      company: "Masukkan nama perusahaan, maksimum 150 karakter.",
      phone: "Nomor telepon tidak boleh lebih dari 30 karakter.",
      message: "Pesan tidak boleh lebih dari 2.000 karakter.",
      turnstile: "Selesaikan pemeriksaan keamanan sebelum mengirim inquiry.",
    },
  },
  en: {
    heading: "Inquiry",
    nameLabel: "Name",
    emailLabel: "Email",
    companyLabel: "Company",
    phoneLabel: "Telephone",
    messageLabel: "Message",
    optionalLabel: "optional",
    marketingConsentLabel: MARKETING_CONSENT_TEXT.en,
    privacyLinkLabel: "Privacy Notice",
    warning: "Please do not submit sensitive data, financial data, identity documents, or confidential information through the inquiry form.",
    submitLabel: "Send inquiry",
    submittingLabel: "Sending…",
    successMessage: "Thank you. We have received your inquiry.",
    errorMessage: "The inquiry could not be sent. Please try again.",
    validation: {
      name: "Enter your name, up to 100 characters.",
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter a valid email address.",
      company: "Enter your company name, up to 150 characters.",
      phone: "Telephone number must not exceed 30 characters.",
      message: "Message must not exceed 2,000 characters.",
      turnstile: "Complete the security check before sending the inquiry.",
    },
  },
} as const;

export type InquiryLocale = keyof typeof INQUIRY_COPY;
export type InquiryFormCopy = (typeof INQUIRY_COPY)[InquiryLocale];

export interface NavigationItem {
  label: string;
  href: `/${string}` | "/";
}

export const navigationItems = {
  en: [
    { label: "Products", href: "/en/products/" },
    { label: "Packaging", href: "/en/packaging/" },
    { label: "Quality & Documents", href: "/en/quality-documents/" },
    { label: "Ordering & Shipping", href: "/en/ordering-shipping/" },
    { label: "About", href: "/en/about/" },
  ],
  id: [
    { label: "Produk", href: "/id/produk/" },
    { label: "Kemasan", href: "/id/kemasan/" },
    { label: "Kualitas & Dokumen", href: "/id/kualitas-dokumen/" },
    { label: "Pemesanan & Pengiriman", href: "/id/pemesanan-pengiriman/" },
    { label: "Tentang Kami", href: "/id/tentang-kami/" },
  ],
} as const satisfies Record<"en" | "id", readonly NavigationItem[]>;

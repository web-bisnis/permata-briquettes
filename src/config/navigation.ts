export interface NavigationItem {
  label: string;
  href: `/${string}` | "/";
  /** Also current on every page below `href`, such as the articles under /en/blog/. */
  section?: boolean;
}

export const navigationItems = {
  en: [
    { label: "Products", href: "/en/products/" },
    { label: "Packaging", href: "/en/packaging/" },
    { label: "Quality & Documents", href: "/en/quality-documents/" },
    { label: "Ordering & Shipping", href: "/en/ordering-shipping/" },
    { label: "About", href: "/en/about/" },
    { label: "Contact", href: "/en/contact/" },
  ],
  id: [
    { label: "Produk", href: "/id/produk/" },
    { label: "Kemasan", href: "/id/kemasan/" },
    { label: "Kualitas & Dokumen", href: "/id/kualitas-dokumen/" },
    { label: "Pemesanan & Pengiriman", href: "/id/pemesanan-pengiriman/" },
    { label: "Tentang Kami", href: "/id/tentang-kami/" },
    { label: "Kontak", href: "/id/kontak/" },
  ],
} as const satisfies Record<"en" | "id", readonly NavigationItem[]>;

const blogNavigationItem = {
  en: { label: "Blog", href: "/en/blog/", section: true },
  id: { label: "Blog", href: "/id/blog/", section: true },
} as const satisfies Record<"en" | "id", NavigationItem>;

/** Blog sits before Contact, so Contact stays the last link; shown only when `showBlog`. */
export function getNavigationItems(lang: "en" | "id", showBlog: boolean): readonly NavigationItem[] {
  const items = navigationItems[lang];
  if (!showBlog) return items;
  return [...items.slice(0, -1), blogNavigationItem[lang], items[items.length - 1]];
}

export function isCurrentNavigationItem(item: NavigationItem, currentPath: string): boolean {
  return currentPath === item.href || (item.section === true && currentPath.startsWith(item.href));
}

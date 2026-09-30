export interface NavigationItem {
  label: string;
  href: `/${string}` | "/";
}

// Keep this list limited to routes that exist in the current static build.
export const navigationItems = [
  { label: "Beranda", href: "/" },
] as const satisfies readonly NavigationItem[];

import { describe, expect, it } from "vitest";
import {
  createLocalizedSeo,
  createRootSeo,
  resolveCloudflareAnalytics,
  resolveSiteEnvironment,
  SITE_ORIGIN,
} from "../src/config/seo";

describe("central SEO configuration", () => {
  it("fails closed outside an explicit production build", () => {
    expect(resolveSiteEnvironment(undefined)).toBe("local");
    expect(resolveSiteEnvironment("unexpected")).toBe("local");
    expect(createRootSeo("local").robots).toBe("noindex, nofollow");
    expect(createRootSeo("staging").robots).toBe("noindex, nofollow");
    expect(createRootSeo("production").robots).toBe("index, follow");
  });

  it("generates canonical and reciprocal locale alternates on the approved origin", () => {
    const seo = createLocalizedSeo({
      title: "Title",
      description: "Description",
      locale: "en",
      route: "/en/about/",
      alternateRoute: "/id/tentang-kami/",
      indexable: true,
      environment: "production",
    });

    expect(seo.canonical).toBe(`${SITE_ORIGIN}/en/about/`);
    expect(seo.alternates).toEqual({
      en: `${SITE_ORIGIN}/en/about/`,
      id: `${SITE_ORIGIN}/id/tentang-kami/`,
      xDefault: `${SITE_ORIGIN}/`,
    });
    expect(seo.robots).toBe("index, follow");
  });

  it("renders analytics only with production, an explicit flag, and a token", () => {
    const token = "test-token-not-a-production-secret";
    expect(resolveCloudflareAnalytics({})).toEqual({ enabled: false, token: undefined });
    expect(resolveCloudflareAnalytics({
      SITE_ENV: "production",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "false",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN: token,
    })).toEqual({ enabled: false, token: undefined });
    expect(resolveCloudflareAnalytics({
      SITE_ENV: "staging",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "true",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN: token,
    })).toEqual({ enabled: false, token: undefined });
    expect(resolveCloudflareAnalytics({
      SITE_ENV: "production",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "true",
    })).toEqual({ enabled: false, token: undefined });
    expect(resolveCloudflareAnalytics({
      SITE_ENV: "production",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_ENABLED: "true",
      PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN: token,
    })).toEqual({ enabled: true, token });
  });
});

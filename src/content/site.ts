import { ROUTES } from "@/lib/routes";

/**
 * Fixed top-level navigation shown in the header and footer. Hrefs are kept
 * trailing-slash-less to satisfy `typedRoutes: true`; `next.config.ts`
 * (`trailingSlash: true`) rewrites them to the trailing-slash form in the
 * static export.
 */
export const SITE_NAVIGATION = [
  { href: ROUTES.timeline, label: "時間軸" },
  { href: ROUTES.preface, label: "前言" },
  { href: ROUTES.afterword, label: "後記" },
  { href: ROUTES.about, label: "關於" },
] as const;

export const FEATURED_STORY_ID = "94-07-daxueshan-orientation";
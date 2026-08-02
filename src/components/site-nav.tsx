"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_NAVIGATION } from "@/content/site";

/**
 * Normalizes a pathname for exact-match comparison. App Router keeps the
 * trailing slash from `next.config.ts` (`/timeline/`), but the typed route
 * source hrefs are slash-less (`/timeline`); compare on the slash-less form
 * so both renderings match the same item. The root path is preserved.
 */
function normalizePathname(pathname: string | null): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

/**
 * Client navigation list with a visible active state. `usePathname()` is the
 * only client-only API here, kept in this small component so the rest of the
 * header stays a Server Component and hydration scope stays narrow.
 *
 * A story page (`/story/{id}`) does NOT match the timeline item: the active
 * state is an exact match against the fixed nav hrefs only.
 */
export function SiteNav() {
  const pathname = usePathname();
  const current = normalizePathname(pathname);

  return (
    <nav aria-label="主要導覽">
      <ul className="site-nav">
        {SITE_NAVIGATION.map((item) => {
          const isActive = current === item.href;
          return (
            <li key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? "site-nav__link is-active" : "site-nav__link"}
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
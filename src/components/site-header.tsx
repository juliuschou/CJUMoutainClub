import Link from "next/link";
import { SITE_NAVIGATION } from "@/content/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="長榮登山社校友會遊記網站首頁">
          <span className="site-brand__mark" aria-hidden="true">▲</span>
          <span>
            <strong>長榮登山社校友會</strong>
            <small>10 週年遊記典藏</small>
          </span>
        </Link>
        <nav aria-label="主要導覽">
          <ul className="site-nav">
            {SITE_NAVIGATION.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

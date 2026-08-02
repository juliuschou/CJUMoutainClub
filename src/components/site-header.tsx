import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

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
        <SiteNav />
      </div>
    </header>
  );
}
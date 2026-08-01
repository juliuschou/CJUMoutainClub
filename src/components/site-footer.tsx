import Link from "next/link";
import { SITE_NAVIGATION } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>沿著時間，走進每一段山行故事。</p>
        <nav aria-label="頁尾導覽">
          {SITE_NAVIGATION.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <small>資料來源：長榮登山社校友會 10 週年紀念遊記總集</small>
      </div>
    </footer>
  );
}

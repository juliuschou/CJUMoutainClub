import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function NotFound() {
  return (
    <section className="content-shell empty-state">
      <p className="eyebrow">404</p>
      <h1>找不到這段山行故事</h1>
      <p>這個網址可能已失效，或原始典藏中沒有對應內容。</p>
      <Link className="button button--primary" href={ROUTES.timeline}>返回時間軸</Link>
    </section>
  );
}
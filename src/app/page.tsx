import Image from "next/image";
import Link from "next/link";
import { ArchiveStats } from "@/components/archive-stats";
import { FEATURED_STORY_ID } from "@/content/site";
import { manifest } from "@/lib/manifest";
import { getStory } from "@/lib/stories";

const featureLinks = [
  { href: "/preface", title: "前言與活動年表", description: "從指導老師的話與原始年表，理解這份典藏如何開始。" },
  { href: "/afterword", title: "後記與出版資訊", description: "重讀共同打造記憶寶庫鑰匙的初衷，以及參與出版的夥伴。" },
  { href: "/about", title: "關於時間證據卡", description: "了解網站如何以時間、故事與照片三層結構整理山行記憶。" },
] as const;

export default function HomePage() {
  const heroStory = getStory(FEATURED_STORY_ID);
  const heroImage = heroStory?.evidence.find((item) => !item.decorative) ?? null;
  const counts = manifest.sourceCounts;

  return (
    <>
      <section className="landing-hero">
        {heroImage ? (
          <Image
            alt={heroImage.altText}
            className="landing-hero__image"
            fill
            preload
            sizes="100vw"
            src={heroImage.imageUrl}
          />
        ) : null}
        <div className="landing-hero__veil" />
        <div className="landing-hero__content">
          <p className="eyebrow">長榮登山社校友會 · 十週年紀念</p>
          <h1>長榮登山社校友會<br />10 週年遊記</h1>
          <p>沿著時間，走進每一段山行故事。</p>
          <div className="landing-hero__actions">
            <Link className="button button--primary" href="/timeline">進入時間軸 →</Link>
            <Link className="button landing-hero__secondary" href="/preface">閱讀前言</Link>
          </div>
        </div>
      </section>

      <section className="content-shell archive-intro" aria-labelledby="archive-title">
        <div>
          <p className="eyebrow">Timeline Evidence Cards</p>
          <h2 id="archive-title">時間是骨架，故事是路徑，照片是證據</h2>
          <p>這裡不是一張活動清單，而是一段從民國 86 年走到 95 年的共同記憶。每個節點都保留當時留下的日期、文字與影像，也如實呈現取消活動與史料缺口。</p>
        </div>
        <ArchiveStats items={[
          { value: counts.timelineNodes, label: "活動節點" },
          { value: counts.storyFiles, label: "篇完整遊記" },
          { value: counts.mediaFiles, label: "個媒體檔" },
        ]} />
      </section>

      <section className="content-shell landing-links" aria-label="延伸閱讀">
        {featureLinks.map((item) => (
          <Link className="card landing-link" href={item.href} key={item.href}>
            <span aria-hidden="true">↗</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </Link>
        ))}
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { afterword } from "@/lib/afterword";

export const metadata: Metadata = {
  title: "後記與出版資訊",
};

export default function AfterwordPage() {
  return (
    <section className="content-shell afterword-page">
      <PageHeader eyebrow="後記" title={afterword.subtitle} description={afterword.author ? `作者：${afterword.author}` : undefined} />
      <article className="afterword-prose">
        {afterword.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </article>

      <section className="publication-section" aria-labelledby="publication-title">
        <p className="eyebrow">Publication</p>
        <h2 id="publication-title">出版資訊</h2>
        <dl className="publication-grid card">
          {afterword.publication.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="credits-grid">
        {[
          { id: "writers", title: "撰文", names: afterword.writers },
          { id: "photographers", title: "攝影", names: afterword.photographers },
        ].map((credit) => (
          <section className="card" aria-labelledby={`${credit.id}-title`} key={credit.id}>
            <h2 id={`${credit.id}-title`}>{credit.title}</h2>
            <ul className="name-cloud">{credit.names.map((name) => <li key={name}>{name}</li>)}</ul>
          </section>
        ))}
      </div>
    </section>
  );
}

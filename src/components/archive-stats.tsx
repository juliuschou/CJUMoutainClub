type ArchiveStat = {
  value: number;
  label: string;
};

type ArchiveStatsProps = {
  items: ArchiveStat[];
  vertical?: boolean;
};

export function ArchiveStats({ items, vertical = false }: ArchiveStatsProps) {
  return (
    <dl className={`archive-stats${vertical ? " archive-stats--vertical" : ""}`} aria-label="典藏資料統計">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.value}</dt>
          <dd>{item.label}</dd>
        </div>
      ))}
    </dl>
  );
}

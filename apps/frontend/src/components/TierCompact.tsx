import type { PolicyUpdate } from "../types";
import { formatDate } from "../utils";

interface TierCompactProps {
  items: PolicyUpdate[];
}

export const TierCompact: React.FC<TierCompactProps> = (props) => {
  const { items } = props;

  return (
    <section className="tier tier--compact" aria-label="周辺">
      <h2 className="tier__heading">
        <span className="tier__badge tier__badge--compact">Tier 3</span>
        周辺情報
      </h2>
      <ul className="compact-list">
        {items.map((item) => (
          <li key={item.id} className="compact-list__item">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="compact-list__title"
            >
              {item.title}
            </a>
            <span className="compact-list__source">{item.source}</span>
            <time dateTime={item.publishedAt} className="compact-list__date">
              {formatDate(item.publishedAt)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
};

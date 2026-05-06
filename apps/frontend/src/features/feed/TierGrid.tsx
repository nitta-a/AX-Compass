import { formatDate } from "../../lib/utils";
import type { PolicyUpdate } from "../../types";

interface TierGridProps {
  items: PolicyUpdate[];
}

export const TierGrid: React.FC<TierGridProps> = (props) => {
  const { items } = props;

  return (
    <section className="tier tier--grid" aria-label="標準">
      <h2 className="tier__heading">
        <span className="tier__badge tier__badge--grid">Tier 2</span>
        標準
      </h2>

      <ul className="card-grid">
        {items.map((item) => (
          <li key={item.id} className="card">
            <div className="card__tags">
              {item.tags.map((tag) => (
                <span key={tag} className={`tag tag--${tag}`}>
                  {tag}
                </span>
              ))}
            </div>

            <h3 className="card__title">
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </h3>

            <div className="card__meta">
              <span className="card__source">{item.source}</span>
              <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
            </div>
            <div className="card__footer">
              <span className="card__score">スコア {item.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

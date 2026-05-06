import type { PolicyUpdate } from "../types";
import { formatDate } from "../utils";

interface TierHeroProps {
  items: PolicyUpdate[];
}

export const TierHero = ({ items }: TierHeroProps): JSX.Element => {
  return (
    <section className="tier tier--hero" aria-label="重要">
      <h2 className="tier__heading">
        <span className="tier__badge tier__badge--hero">Tier 1</span>
        重要
      </h2>
      <ul className="hero-list">
        {items.map((item) => (
          <li key={item.id} className="hero-card">
            <div className="hero-card__tags">
              {item.tags.map((tag) => (
                <span key={tag} className={`tag tag--${tag}`}>
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="hero-card__title">
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </h3>
            <div className="hero-card__meta">
              <span className="hero-card__source">{item.source}</span>
              <time dateTime={item.publishedAt}>
                {formatDate(item.publishedAt)}
              </time>
              <span className="hero-card__score">スコア {item.score}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

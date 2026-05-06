import { formatDate } from "../../lib/utils";
import type { PolicyUpdate } from "../../types";

interface FeedCardProps {
  item: PolicyUpdate;
}

export const FeedCard: React.FC<FeedCardProps> = (props) => {
  const { item } = props;

  return (
    <li className="feed-card">
      <div className="feed-card-header">
        <span className="feed-source">{item.source}</span>
      </div>
      <h2>{item.title}</h2>
      <div className="feed-card-footer">
        <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
        <a href={item.url} target="_blank" rel="noreferrer">
          参照元を見る
        </a>
      </div>
    </li>
  );
};

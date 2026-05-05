import { FeedCard } from "./components/FeedCard";
import { HeroPanel } from "./components/HeroPanel";
import { usePolicyDataset } from "./hooks/usePolicyDataset";

export const App = (): JSX.Element => {
  const { dataset, isLoading, errorMessage } = usePolicyDataset();

  return (
    <main className="page-shell">
      <HeroPanel dataset={dataset} />

      <section className="content-panel">
        {isLoading ? <p className="status-message">データを読み込んでいます。</p> : null}
        {!isLoading && errorMessage !== null ? <p className="status-message status-error">{errorMessage}</p> : null}
        {!isLoading && errorMessage === null && dataset !== null ? (
          <ul className="feed-list">
            {dataset.items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
};

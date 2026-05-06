import { TabBar } from "./components/TabBar";
import { TierCompact } from "./components/TierCompact";
import { TierGrid } from "./components/TierGrid";
import { TierHero } from "./components/TierHero";
import { usePolicyDataset } from "./hooks/usePolicyDataset";
import { useTieredFeed } from "./hooks/useTieredFeed";
import { formatDate } from "./utils";
import "./styles.css";

export const App = (): JSX.Element => {
  const { dataset, isLoading, errorMessage } = usePolicyDataset();
  const items = dataset?.items ?? [];
  const generatedAt = dataset?.generatedAt ?? null;

  const { tab, setTab, tiers, filteredCount } = useTieredFeed(items);
  const { tier1, tier2, tier3 } = tiers;

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__branding">
          <p className="dashboard__eyebrow">AX Compass</p>
          <h1 className="dashboard__title">AI・DX 政策の最新動向</h1>
          {items.length > 0 && (
            <dl className="dashboard__stats">
              {generatedAt !== null && (
                <div>
                  <dt>更新</dt>
                  <dd>{formatDate(generatedAt)}</dd>
                </div>
              )}
              <div>
                <dt>件数</dt>
                <dd>{items.length}</dd>
              </div>
            </dl>
          )}
        </div>
        <TabBar activeTab={tab} onTabChange={setTab} />
      </header>

      {isLoading && (
        <p className="dashboard__status">データを読み込んでいます。</p>
      )}

      {!isLoading && errorMessage !== null && (
        <p className="dashboard__status dashboard__status--error">
          {errorMessage}
        </p>
      )}

      {!isLoading && errorMessage === null && (
        <>
          {tier1.length > 0 && <TierHero items={tier1} />}
          {tier2.length > 0 && <TierGrid items={tier2} />}
          {tier3.length > 0 && <TierCompact items={tier3} />}
          {filteredCount === 0 && (
            <p className="dashboard__status">
              このカテゴリの情報はありません。
            </p>
          )}
        </>
      )}
    </div>
  );
};

import { memo } from "react";
import { TabBar } from "./TabBar";
import { TierCompact } from "./TierCompact";
import { TierGrid } from "./TierGrid";
import { TierHero } from "./TierHero";
import { useTieredFeed } from "../hooks/useTieredFeed";
import { formatDate } from "../utils";
import type { PolicyUpdate } from "../types";

interface DashboardProps {
  items: PolicyUpdate[];
  generatedAt: string;
}

const DashboardInner: React.FC<DashboardProps> = (props) => {
  const { items, generatedAt } = props;
  const { tab, setTab, tiers, filteredCount } = useTieredFeed(items);
  const { tier1, tier2, tier3 } = tiers;

  return (
    <>
      <header className="dashboard__header">
        <div className="dashboard__branding">
          <p className="dashboard__eyebrow">AX Compass</p>
          <h1 className="dashboard__title">AI・DX 政策の最新動向</h1>
          {items.length > 0 && (
            <dl className="dashboard__stats">
              {!generatedAt && (
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

      {tier1.length > 0 && <TierHero items={tier1} />}
      {tier2.length > 0 && <TierGrid items={tier2} />}
      {tier3.length > 0 && <TierCompact items={tier3} />}
      {filteredCount === 0 && (
        <p className="dashboard__status">このカテゴリの情報はありません。</p>
      )}
    </>
  );
};

export const Dashboard = memo(DashboardInner);

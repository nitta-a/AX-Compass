import type { Tab } from "../lib/policy";
import { TABS, TAB_LABELS } from "../lib/policy";

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const TabBar: React.FC<TabBarProps> = (props) => {
  const { activeTab, onTabChange } = props;

  return (
    <nav className="tab-bar" aria-label="カテゴリ絞り込み">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          className={`tab-bar__btn${activeTab === t ? " tab-bar__btn--active" : ""}`}
          onClick={() => onTabChange(t)}
          aria-pressed={activeTab === t}
        >
          {TAB_LABELS[t]}
        </button>
      ))}
    </nav>
  );
};

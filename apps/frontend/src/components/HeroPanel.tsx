import type { PolicyDataset } from "../types";
import { formatDate } from "../utils";

interface HeroPanelProps {
  dataset: PolicyDataset | null;
}

export const HeroPanel = ({ dataset }: HeroPanelProps): JSX.Element => {
  return (
    <section className="hero-panel">
      <p className="eyebrow">AX Compass</p>
      <h1>AI・DX 政策の最新動向をまとめてチェック</h1>
      <p className="hero-copy">
        デジタル庁・経済産業省・総務省・内閣府の公開情報から、AI ガバナンスや DX
        推進に関するニュースをスコアリングして厳選。重要度の高い情報を見逃しません。
      </p>
      {dataset !== null ? (
        <dl className="metrics-grid">
          <div>
            <dt>生成時刻</dt>
            <dd>{formatDate(dataset.generatedAt)}</dd>
          </div>
          <div>
            <dt>件数</dt>
            <dd>{dataset.itemCount}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
};

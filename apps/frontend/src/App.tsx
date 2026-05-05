import { useEffect, useState } from "react";

interface PolicyUpdate {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  score: number;
  tags: string[];
}

interface PolicyDataset {
  generatedAt: string;
  itemCount: number;
  items: PolicyUpdate[];
}

const isPolicyUpdate = (value: unknown): value is PolicyUpdate => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.url === "string" &&
    typeof candidate.publishedAt === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.score === "number" &&
    Array.isArray(candidate.tags)
  );
};

const isPolicyDataset = (value: unknown): value is PolicyDataset => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.generatedAt === "string" &&
    typeof candidate.itemCount === "number" &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isPolicyUpdate)
  );
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getLatestDatasetUrl = (): string => {
  return new URL("data/latest.json", document.baseURI).toString();
};

export const App = (): JSX.Element => {
  const [dataset, setDataset] = useState<PolicyDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDataset = async (): Promise<void> => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(getLatestDatasetUrl());

        if (!response.ok) {
          throw new Error(
            `latest.json request failed with status ${response.status}`,
          );
        }

        const payload = (await response.json()) as unknown;

        if (!isPolicyDataset(payload)) {
          throw new Error("latest.json has an unexpected schema.");
        }

        if (isActive) {
          setDataset(payload);
        }
      } catch (error) {
        if (isActive) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          setErrorMessage(message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadDataset();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="page-shell">
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

      <section className="content-panel">
        {isLoading ? (
          <p className="status-message">データを読み込んでいます。</p>
        ) : null}
        {!isLoading && errorMessage !== null ? (
          <p className="status-message status-error">{errorMessage}</p>
        ) : null}
        {!isLoading && errorMessage === null && dataset !== null ? (
          <ul className="feed-list">
            {dataset.items.map((item) => (
              <li className="feed-card" key={item.id}>
                <div className="feed-card-header">
                  <span className="feed-source">{item.source}</span>
                </div>
                <h2>{item.title}</h2>
                <div className="feed-card-footer">
                  <time dateTime={item.publishedAt}>
                    {formatDate(item.publishedAt)}
                  </time>
                  <a href={item.url} target="_blank" rel="noreferrer">
                    参照元を見る
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
};

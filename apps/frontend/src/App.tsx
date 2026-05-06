import { Dashboard } from "./components/Dashboard";
import { usePolicyDataset } from "./hooks/usePolicyDataset";

export const App: React.FC = () => {
  const { dataset, isLoading, errorMessage } = usePolicyDataset();

  const isError = !isLoading && errorMessage !== null;
  const hasData = !isLoading && !isError && dataset !== null;

  return (
    <div className="dashboard">
      {isLoading && (
        <p className="dashboard__status">データを読み込んでいます。</p>
      )}
      {isError && (
        <p className="dashboard__status dashboard__status--error">
          {errorMessage}
        </p>
      )}
      {hasData && (
        <Dashboard
          items={dataset?.items ?? []}
          generatedAt={dataset?.generatedAt ?? ""}
        />
      )}
    </div>
  );
};

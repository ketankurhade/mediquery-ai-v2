import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../components/ui";

export default function Trends() {
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAvailableTests();
  }, []);

  const loadAvailableTests = async () => {
    try {
      const response = await api.get("/reports/trends/available-tests/list");
      setAvailableTests(response.data);
      if (response.data.length > 0) {
        selectTest(response.data[0].test_name);
      }
    } catch (err) {
      setError("Failed to load available tests");
    } finally {
      setLoading(false);
    }
  };

  const selectTest = async (testName) => {
    setSelectedTest(testName);
    setChartLoading(true);
    try {
      const response = await api.get(`/reports/trends/${encodeURIComponent(testName)}`);
      const formatted = response.data.data_points.map((p) => ({
        ...p,
        dateLabel: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }));
      setTrendData({ ...response.data, data_points: formatted });
    } catch (err) {
      setTrendData(null);
    } finally {
      setChartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mq-canvas">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <LoadingState>Loading your available trends...</LoadingState>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-mq-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <PageHeader
          title="Health trends"
          description="Follow the same test across your reports and review how its recorded values change over time."
        />

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900" role="alert">
            {error}
          </div>
        )}

        {!error && availableTests.length === 0 && (
          <EmptyState
            title="Not enough matching reports yet"
            className="min-h-[17rem] px-6 py-10"
          >
            A test needs to appear in at least two reports before it can be tracked here. Upload another report containing the same test to see its history.
          </EmptyState>
        )}

        {availableTests.length > 0 && (
          <div className="space-y-5">
            <Card className="p-4 sm:p-5">
              <div className="mb-3">
                <h2 className="text-base font-bold text-mq-ink">Choose a test</h2>
                <p className="mt-1 text-sm text-mq-muted">
                  Select a test to view its values across your reports.
                </p>
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Available tests">
                {availableTests.map((t) => {
                  const isSelected = selectedTest === t.test_name;
                  return (
                    <button
                      key={t.test_name}
                      type="button"
                      onClick={() => selectTest(t.test_name)}
                      aria-pressed={isSelected}
                      className={`inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-offset-2 ${
                        isSelected
                          ? "border-mq-primary bg-mq-primary text-white shadow-sm"
                          : "border-mq-border bg-white text-mq-ink hover:border-mq-primary/40 hover:bg-mq-primary/5"
                      }`}
                    >
                      <span className="truncate">{t.test_name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                        isSelected ? "bg-white/15 text-white" : "bg-slate-100 text-mq-muted"
                      }`}>
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              {chartLoading && (
                <div className="p-4 sm:p-6">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold text-mq-ink">{selectedTest}</h2>
                    <p className="mt-1 text-sm text-mq-muted">Loading values from your reports...</p>
                  </div>
                  <LoadingState className="min-h-[18rem]">Preparing trend chart...</LoadingState>
                </div>
              )}

              {!chartLoading && trendData && (
                <>
                  <header className="flex flex-col gap-3 border-b border-mq-border p-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-primary">
                        Test history
                      </p>
                      <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-mq-ink">
                        {trendData.test_name}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-mq-muted">
                      <span className="rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-mq-ink">{trendData.data_points.length}</span>{" "}
                        {trendData.data_points.length === 1 ? "data point" : "data points"}
                      </span>
                      <span className="rounded-lg bg-slate-50 px-3 py-2">
                        Unit: <span className="font-semibold text-mq-ink">{trendData.data_points[0]?.unit || "Not specified"}</span>
                      </span>
                    </div>
                  </header>

                  <div className="min-w-0 px-2 py-5 sm:px-5 sm:py-6">
                    <div className="h-[18rem] min-w-0 w-full sm:h-[20rem]" aria-label={`${trendData.test_name} trend chart`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData.data_points} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e6edef" />
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 12, fill: "#526675" }}
                            tickLine={{ stroke: "#cbd8db" }}
                            axisLine={{ stroke: "#cbd8db" }}
                            minTickGap={12}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: "#526675" }}
                            tickLine={false}
                            axisLine={false}
                            width={48}
                          />
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${value} ${props.payload.unit}`,
                              props.payload.status,
                            ]}
                            contentStyle={{
                              borderRadius: "12px",
                              borderColor: "#dce7e8",
                              boxShadow: "0 8px 24px rgb(23 43 58 / 10%)",
                              fontSize: "13px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#087e83"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: "#087e83", stroke: "#ffffff", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "#06676c", stroke: "#ffffff", strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <section className="border-t border-mq-border px-4 py-4 sm:px-6" aria-labelledby="trend-points-heading">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <h3 id="trend-points-heading" className="text-sm font-bold text-mq-ink">
                        Recorded values
                      </h3>
                      <p className="text-xs text-mq-muted">Date, value, and reported status</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {trendData.data_points.map((p, i) => (
                        <div key={i} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-mq-border bg-white px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-mq-muted">{p.dateLabel}</p>
                            <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-mq-ink">
                              {p.value} <span className="font-medium text-mq-muted">{p.unit}</span>
                            </p>
                          </div>
                          <StatusBadge
                            status={p.status === "NORMAL" ? "success" : p.status === "unknown" ? "neutral" : "warning"}
                            className="shrink-0"
                          >
                            {p.status}
                          </StatusBadge>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {!chartLoading && !trendData && selectedTest && (
                <div className="p-4 sm:p-6">
                  <EmptyState
                    title="Trend data unavailable"
                    className="min-h-[18rem]"
                  >
                    Values for {selectedTest} could not be displayed.
                  </EmptyState>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

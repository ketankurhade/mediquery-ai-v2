import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import {
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../components/ui";

function formatDisplayedNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 8,
    useGrouping: false,
  }).format(value);
}

function getChangeTone(beforeStatus, afterStatus) {
  const before = String(beforeStatus || "").toUpperCase();
  const after = String(afterStatus || "").toUpperCase();

  if ((before === "HIGH" || before === "LOW") && after === "NORMAL") {
    return "text-emerald-700";
  }
  if (before === "NORMAL" && (after === "HIGH" || after === "LOW")) {
    return "text-red-700";
  }
  return "text-mq-muted";
}

function directionIcon(direction) {
  if (direction === "same") return "→";
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "—";
}

function ChangeValue({ result }) {
  if (result.change === null) {
    return <span className="text-sm font-medium text-mq-muted">N/A</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${getChangeTone(result.old_status, result.new_status)}`}>
      <span aria-hidden="true">{directionIcon(result.direction)}</span>
      <span className="sr-only">Direction: {result.direction}.</span>
      <span>
        {result.change > 0 ? "+" : ""}{formatDisplayedNumber(result.change)}
        <span className="ml-1 font-medium">
          ({result.change_pct > 0 ? "+" : ""}{formatDisplayedNumber(result.change_pct)}%)
        </span>
      </span>
    </span>
  );
}

function StatusValue({ value }) {
  return (
    <StatusBadge status={value || "unknown"}>
      {value || "unknown"}
    </StatusBadge>
  );
}

export default function Compare() {
  const { reportId1, reportId2 } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadComparison();
  }, [reportId1, reportId2]);

  const loadComparison = async () => {
    try {
      const response = await api.get(`/reports/compare/${reportId1}/${reportId2}`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load comparison");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mq-canvas">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <LoadingState>Loading report comparison...</LoadingState>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mq-canvas">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900" role="alert">
            {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-mq-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <PageHeader
          title="Compare reports"
          description="View test values from two reports side by side."
          actions={(
            <Link to="/dashboard" className="mq-button mq-button--secondary mq-button--md w-full sm:w-auto">
              Back to dashboard
            </Link>
          )}
        />

        <section
          className="mb-7 grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4"
          aria-label="Reports being compared"
        >
          <Card className="min-w-0 overflow-hidden border-l-4 border-l-mq-primary">
            <div className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-muted">Report 1</p>
              <p className="mt-1 text-sm font-bold text-mq-primary">Before</p>
              <p className="mt-2 text-lg font-bold tabular-nums text-mq-ink">
                {new Date(data.report_1.date).toLocaleDateString()}
              </p>
              <p className="mt-1 truncate text-sm text-mq-muted" title={data.report_1.filename}>
                {data.report_1.filename}
              </p>
            </div>
          </Card>

          <span className="justify-self-center text-lg font-semibold text-mq-muted" aria-label="Report 1 followed by Report 2">
            ↓
          </span>

          <Card className="min-w-0 overflow-hidden border-l-4 border-l-slate-300">
            <div className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-muted">Report 2</p>
              <p className="mt-1 text-sm font-bold text-mq-primary">After</p>
              <p className="mt-2 text-lg font-bold tabular-nums text-mq-ink">
                {new Date(data.report_2.date).toLocaleDateString()}
              </p>
              <p className="mt-1 truncate text-sm text-mq-muted" title={data.report_2.filename}>
                {data.report_2.filename}
              </p>
            </div>
          </Card>
        </section>

        <section aria-labelledby="comparison-results-heading">
          <div className="mb-4">
            <h2 id="comparison-results-heading" className="text-xl font-bold tracking-tight text-mq-ink sm:text-2xl">
              Matching test results
            </h2>
            <p className="mt-1 text-sm text-mq-muted">
              Values and reported statuses are shown for each report, alongside the recorded change.
            </p>
          </div>

          {data.comparison.length === 0 ? (
            <EmptyState
              title="No matching test names"
              className="min-h-[15rem] px-6 py-10"
            >
              These reports do not have any test names in common to display.
            </EmptyState>
          ) : (
            <>
              <Card className="hidden overflow-hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
                    <caption className="sr-only">Comparison of matching test results between Report 1 and Report 2</caption>
                    <colgroup>
                      <col className="w-[22%]" />
                      <col className="w-[27%]" />
                      <col className="w-[27%]" />
                      <col className="w-[24%]" />
                    </colgroup>
                    <thead className="bg-slate-50 text-mq-muted">
                      <tr>
                        <th scope="col" className="border-b border-mq-border px-5 py-4 text-left font-semibold">Test</th>
                        <th scope="col" className="border-b border-mq-border px-5 py-4 text-right font-semibold">
                          <span className="block text-mq-ink">Report 1</span>
                          <span className="text-xs font-medium">Before</span>
                        </th>
                        <th scope="col" className="border-b border-mq-border px-5 py-4 text-right font-semibold">
                          <span className="block text-mq-ink">Report 2</span>
                          <span className="text-xs font-medium">After</span>
                        </th>
                        <th scope="col" className="border-b border-mq-border px-5 py-4 text-right font-semibold">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mq-border">
                      {data.comparison.map((c, i) => (
                        <tr key={i} className="transition-colors hover:bg-mq-primary/5">
                          <th scope="row" className="break-words px-5 py-4 text-left align-top font-semibold text-mq-ink">
                            {c.test_name}
                          </th>
                          <td className="px-5 py-4 text-right align-top">
                            <p className="font-bold tabular-nums text-mq-ink">
                              {c.old_value}
                              {c.unit && <span className="ml-1.5 text-xs font-medium text-mq-muted">{c.unit}</span>}
                            </p>
                            <div className="mt-2 flex justify-end"><StatusValue value={c.old_status} /></div>
                          </td>
                          <td className="px-5 py-4 text-right align-top">
                            <p className="font-bold tabular-nums text-mq-ink">
                              {c.new_value}
                              {c.unit && <span className="ml-1.5 text-xs font-medium text-mq-muted">{c.unit}</span>}
                            </p>
                            <div className="mt-2 flex justify-end"><StatusValue value={c.new_status} /></div>
                          </td>
                          <td className="px-5 py-4 text-right align-top">
                            <ChangeValue result={c} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="space-y-3 lg:hidden">
                {data.comparison.map((c, i) => (
                  <Card as="article" key={i} className="min-w-0 overflow-hidden">
                    <header className="border-b border-mq-border bg-slate-50/70 px-4 py-3">
                      <h3 className="break-words font-bold text-mq-ink">{c.test_name}</h3>
                    </header>

                    <div className="divide-y divide-mq-border">
                      <section className="p-4" aria-label={`${c.test_name}, Report 1 before`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mq-muted">Report 1 · Before</p>
                        <p className="mt-1.5 text-lg font-bold tabular-nums text-mq-ink">
                          {c.old_value}
                          {c.unit && <span className="ml-1.5 text-sm font-medium text-mq-muted">{c.unit}</span>}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-mq-muted">Status</span>
                          <StatusValue value={c.old_status} />
                        </div>
                      </section>

                      <section className="p-4" aria-label={`${c.test_name}, Report 2 after`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mq-muted">Report 2 · After</p>
                        <p className="mt-1.5 text-lg font-bold tabular-nums text-mq-ink">
                          {c.new_value}
                          {c.unit && <span className="ml-1.5 text-sm font-medium text-mq-muted">{c.unit}</span>}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-medium text-mq-muted">Status</span>
                          <StatusValue value={c.new_status} />
                        </div>
                      </section>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t border-mq-border px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-mq-muted">Change</span>
                      <ChangeValue result={c} />
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

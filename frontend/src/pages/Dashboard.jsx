import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import {
  Button,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "../components/ui";

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get("/reports");
      setReports(response.data);
    } catch (err) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this report?")) return;

    try {
      await api.delete(`/reports/${reportId}`);
      setReports(reports.filter((r) => r.id !== reportId));
    } catch (err) {
      alert("Failed to delete report");
    }
  };

  const handleCardClick = (reportId) => {
    if (compareMode) {
      setSelectedForCompare((prev) => {
        if (prev.includes(reportId)) {
          return prev.filter((id) => id !== reportId);
        }
        if (prev.length >= 2) {
          return [prev[1], reportId];
        }
        return [...prev, reportId];
      });
    } else {
      navigate(`/chat/${reportId}`);
    }
  };

  const handleStartComparison = () => {
    if (selectedForCompare.length !== 2) return;
    navigate(`/compare/${selectedForCompare[0]}/${selectedForCompare[1]}`);
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedForCompare([]);
  };

  const totalAbnormal = reports.reduce((sum, r) => sum + r.abnormal_count, 0);
  const criticalReports = reports.filter((r) => r.worst_severity === "critical").length;

  const comparePrompt = selectedForCompare.length === 0
    ? "Choose two reports to compare."
    : selectedForCompare.length === 1
      ? "Choose one more report."
      : "Two reports selected and ready to compare.";

  return (
    <div className="min-h-screen bg-mq-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <PageHeader
          title="Welcome to your health overview"
          description="Review your uploaded reports, keep an eye on flagged values, and explore your results."
          actions={
            <Link to="/upload" className="mq-button mq-button--primary mq-button--md w-full sm:w-auto">
              <span aria-hidden="true">+</span>
              Upload report
            </Link>
          }
        />

        {!loading && reports.length > 0 && (
          <section className="mb-9" aria-label="Report overview">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="flex items-center gap-4 p-5 sm:p-6">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mq-primary/10 text-sm font-bold text-mq-primary" aria-hidden="true">
                  R
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-mq-ink">{reports.length}</p>
                  <p className="text-sm text-mq-muted">Reports analyzed</p>
                </div>
              </Card>

              <Card className="flex items-center gap-4 p-5 sm:p-6">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-sm font-bold text-amber-800" aria-hidden="true">
                  !
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-mq-ink">{totalAbnormal}</p>
                  <p className="text-sm text-mq-muted">Flagged values across reports</p>
                </div>
              </Card>

              {criticalReports > 0 && (
                <Card className="flex items-center gap-4 p-5 sm:p-6">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-sm font-bold text-red-800" aria-hidden="true">
                    !
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-tight text-mq-ink">{criticalReports}</p>
                    <p className="text-sm text-mq-muted">Reports with critical values</p>
                  </div>
                </Card>
              )}
            </div>
          </section>
        )}

        <section aria-labelledby="reports-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="reports-heading" className="text-xl font-bold tracking-tight text-mq-ink sm:text-2xl">
                Your reports
              </h2>
              <p className="mt-1 text-sm text-mq-muted">
                {reports.length > 0
                  ? `${reports.length} ${reports.length === 1 ? "report" : "reports"} in your library`
                  : "Your uploaded reports will appear here."}
              </p>
            </div>

            {reports.length >= 2 && (
              <Button
                variant={compareMode ? "primary" : "secondary"}
                onClick={toggleCompareMode}
                aria-pressed={compareMode}
                className="w-full sm:w-auto"
              >
                {compareMode ? "Cancel comparison" : "Compare reports"}
              </Button>
            )}
          </div>

          {compareMode && (
            <Card className="mb-5 flex flex-col gap-4 border-mq-primary/20 bg-mq-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="font-semibold text-mq-ink">Select reports to compare</p>
                <p className="mt-0.5 text-sm text-mq-muted" aria-live="polite">
                  {comparePrompt}
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                <span className="text-sm text-mq-muted" aria-label={`${selectedForCompare.length} of 2 reports selected`}>
                  {selectedForCompare.length} of 2 selected
                </span>
                <Button
                  onClick={handleStartComparison}
                  disabled={selectedForCompare.length !== 2}
                  className="w-full sm:w-auto"
                >
                  Compare selected
                </Button>
              </div>
            </Card>
          )}

          {loading && <LoadingState>Loading your reports...</LoadingState>}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="rounded-2xl border border-mq-border bg-white p-5 shadow-sm sm:p-8">
              <EmptyState
                title="Your report library is ready"
                className="min-h-[13rem] border-0 px-3 py-6 shadow-none"
              >
                Upload a medical report to see its results and start a conversation about it.
              </EmptyState>
              <div className="flex justify-center pb-2">
                <Link to="/upload" className="mq-button mq-button--primary mq-button--md w-full sm:w-auto">
                  Upload your first report
                </Link>
              </div>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => {
                const isSelected = selectedForCompare.includes(report.id);
                const severity = report.worst_severity || "normal";
                const severityLabel = severity === "critical"
                  ? "Critical values"
                  : severity === "mild"
                    ? "Flagged values"
                    : "No flagged values";

                return (
                  <Card
                    as="article"
                    key={report.id}
                    className={`flex min-w-0 flex-col overflow-hidden transition duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected ? "border-mq-primary ring-2 ring-mq-primary/20" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCardClick(report.id)}
                      aria-pressed={compareMode ? isSelected : undefined}
                      aria-label={compareMode
                        ? `${isSelected ? "Deselect" : "Select"} report for ${report.patient_name || "Unknown patient"}, ${report.filename}`
                        : `Open report for ${report.patient_name || "Unknown patient"}, ${report.filename}`}
                      className="flex flex-1 cursor-pointer flex-col text-left focus-visible:z-10 focus-visible:outline-offset-[-3px]"
                    >
                      <div className={`h-1.5 w-full ${severity === "critical" ? "bg-red-600" : severity === "mild" ? "bg-amber-500" : "bg-emerald-600"}`} />

                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-muted">
                              {compareMode ? `Report ${isSelected ? "selected" : "available"}` : "Medical report"}
                            </p>
                            <h3 className="mt-1 truncate text-lg font-bold tracking-tight text-mq-ink">
                              {report.patient_name || "Unknown patient"}
                            </h3>
                          </div>
                          {compareMode ? (
                            <span
                              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                                isSelected
                                  ? "border-mq-primary bg-mq-primary text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          ) : (
                            <span className="rounded-lg bg-mq-primary/10 px-2.5 py-1 text-xs font-semibold text-mq-primary">
                              Open report
                            </span>
                          )}
                        </div>

                        <p className="mt-3 truncate text-sm text-mq-muted" title={report.filename}>
                          {report.filename}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <StatusBadge status={severity}>
                            {severityLabel}
                          </StatusBadge>
                          <span className="text-sm text-mq-muted">
                            {report.abnormal_count} flagged {report.abnormal_count === 1 ? "value" : "values"}
                          </span>
                        </div>

                        {report.top_abnormal && (
                          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                              Top flagged result
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                              {report.top_abnormal.test_name}
                              <span className="ml-1.5 font-medium text-mq-muted">
                                ({report.top_abnormal.status})
                              </span>
                            </p>
                          </div>
                        )}

                        <div className="mt-auto pt-5 text-xs text-mq-muted">
                          Added {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </button>

                    {!compareMode && (
                      <div className="flex items-center justify-between gap-3 border-t border-mq-border bg-slate-50/70 px-5 py-3 sm:px-6">
                        <span className="text-xs font-medium text-mq-muted">Report details</span>
                        <Button
                          variant="danger"
                          size="sm"
                          aria-label={`Delete report ${report.filename}`}
                          onClick={(event) => handleDelete(report.id, event)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

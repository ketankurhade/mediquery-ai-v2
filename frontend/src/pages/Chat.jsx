import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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

function ReportSummary({ report, onReanalyze, onExportPdf, reanalyzing, headingId }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-mq-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-muted">
              Patient summary
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-mq-ink">
              {report.patient_info?.name || "Unknown patient"}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onReanalyze}
              disabled={reanalyzing}
              title="Re-run AI analysis on this report"
            >
              {reanalyzing ? "Re-analyzing..." : "Re-analyze"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportPdf}
              title="Download PDF summary"
            >
              Export PDF
            </Button>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-mq-muted">Age</dt>
            <dd className="mt-0.5 text-sm font-semibold text-mq-ink">
              {report.patient_info?.age || "Unknown"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-mq-muted">Gender</dt>
            <dd className="mt-0.5 text-sm font-semibold text-mq-ink">
              {report.patient_info?.gender || "Unknown"}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs font-medium text-mq-muted">Results</dt>
            <dd className="mt-0.5 text-sm font-semibold text-mq-ink">
              {report.all_results?.length || 0} tests
            </dd>
          </div>
        </dl>

        {report.summary && (
          <p className="mb-0 mt-4 text-sm leading-6 text-mq-muted">{report.summary}</p>
        )}
      </div>

      <section aria-labelledby={headingId}>
        <div className="flex items-center justify-between gap-3 border-b border-mq-border px-5 py-4 sm:px-6">
          <h3 id={headingId} className="font-bold text-mq-ink">
            Test results
          </h3>
          {report.abnormal_results?.length > 0 ? (
            <StatusBadge status="warning">
              {report.abnormal_results.length} flagged
            </StatusBadge>
          ) : (
            <StatusBadge status="success">No flagged results</StatusBadge>
          )}
        </div>

        {report.all_results?.length > 0 ? (
          <div className="max-h-[36vh] divide-y divide-mq-border overflow-y-auto lg:max-h-[calc(100vh-25rem)]">
            {report.all_results.map((test, index) => {
              const isFlagged = test.status === "HIGH" || test.status === "LOW";
              const badgeStatus = test.status === "NORMAL"
                ? "success"
                : isFlagged
                  ? "warning"
                  : "neutral";

              return (
                <div
                  key={`${test.test_name}-${index}`}
                  className={`px-5 py-3.5 sm:px-6 ${isFlagged ? "bg-amber-50/50" : "bg-white"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-mq-ink">
                        {test.test_name}
                      </p>
                      {test.normal_range && (
                        <p className="mt-1 text-xs text-mq-muted">
                          Reference range: {test.normal_range}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-mq-ink">
                        {test.value}
                        {test.unit && <span className="ml-1 font-medium text-mq-muted">{test.unit}</span>}
                      </p>
                      <StatusBadge status={badgeStatus} className="mt-1">
                        {test.status || "Unknown"}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState title="No test results available">
              This report does not contain any extracted test values.
            </EmptyState>
          </div>
        )}
      </section>
    </Card>
  );
}

export default function Chat() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("detailed");
  const [reanalyzing, setReanalyzing] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadReportAndHistory();
  }, [reportId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadReportAndHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const [reportRes, historyRes] = await Promise.all([
        api.get(`/reports/${reportId}`),
        api.get(`/chat/${reportId}`),
      ]);
      setReport(reportRes.data);
      setMessages(historyRes.data.messages || []);
    } catch (err) {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);

    try {
      const response = await api.post(`/chat/${reportId}`, {
        message: userMessage,
        mode: mode,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleReanalyze = async () => {
    if (!window.confirm("Re-run AI analysis on this report? This may take 10-20 seconds.")) return;

    setReanalyzing(true);
    try {
      const response = await api.post(`/reports/${reportId}/reanalyze`);
      setReport((prev) => ({
        ...prev,
        patient_info: response.data.patient_info,
        abnormal_results: response.data.abnormal_results,
        summary: response.data.summary,
      }));
      const reportRes = await api.get(`/reports/${reportId}`);
      setReport(reportRes.data);
    } catch (err) {
      alert("Re-analysis failed. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.get(`/reports/${reportId}/export-pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `MediQuery_Summary.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mq-canvas">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <LoadingState>Loading report and conversation...</LoadingState>
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

  const modes = [
    { key: "simple", label: "Simple" },
    { key: "detailed", label: "Detailed" },
    { key: "clinical", label: "Clinical" },
  ];

  return (
    <div className="min-h-screen bg-mq-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <PageHeader
          title="Report conversation"
          description="Review the results and ask questions about this report."
        />

        <div className="mb-4 lg:hidden">
          <details className="group overflow-hidden rounded-2xl border border-mq-border bg-white shadow-sm">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold text-mq-ink focus-visible:outline-offset-[-3px] [&::-webkit-details-marker]:hidden">
              <span>Report results and patient details</span>
              <span className="text-sm font-medium text-mq-primary group-open:hidden">Show</span>
              <span className="hidden text-sm font-medium text-mq-primary group-open:inline">Hide</span>
            </summary>
            <div className="border-t border-mq-border p-3 sm:p-4">
              <ReportSummary
                report={report}
                onReanalyze={handleReanalyze}
                onExportPdf={handleExportPdf}
                reanalyzing={reanalyzing}
                headingId="mobile-test-results-heading"
              />
            </div>
          </details>
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,1.6fr)] lg:items-start">
          <aside className="hidden min-w-0 lg:block" aria-label="Report results">
            <ReportSummary
              report={report}
              onReanalyze={handleReanalyze}
              onExportPdf={handleExportPdf}
              reanalyzing={reanalyzing}
              headingId="desktop-test-results-heading"
            />
          </aside>

          <section className="flex min-h-[70vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-mq-border bg-white shadow-sm lg:h-[calc(100vh-11rem)] lg:min-h-[36rem]">
            <header className="border-b border-mq-border px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-primary">
                    MediQuery assistant
                  </p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-mq-ink">
                    Chat about this report
                  </h2>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold text-mq-muted">Explanation style</p>
                  <div className="grid grid-cols-3 rounded-xl border border-mq-border bg-slate-50 p-1" role="group" aria-label="Explanation style">
                    {modes.map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMode(m.key)}
                        aria-pressed={mode === m.key}
                        className={`min-h-10 rounded-lg px-2.5 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
                          mode === m.key
                            ? "bg-white text-mq-primary shadow-sm ring-1 ring-mq-border"
                            : "text-mq-muted hover:text-mq-ink"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </header>

            <div
              className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
              aria-label="Conversation messages"
              aria-busy={sending}
            >
              {messages.length === 0 && (
                <div className="mx-auto mt-8 max-w-md">
                  <EmptyState title="Ask about your report">
                    For example: “Is my hemoglobin normal?”
                  </EmptyState>
                </div>
              )}

              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                const isErrorMessage = !isUser && msg.content === "Sorry, I encountered an error. Please try again.";

                return (
                  <div
                    key={i}
                    className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <span className="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-mq-primary/10 text-[0.65rem] font-extrabold text-mq-primary" aria-hidden="true">
                        MQ
                      </span>
                    )}
                    <div
                      className={`max-w-[min(88%,42rem)] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap sm:px-5 ${
                        isUser
                          ? "rounded-br-md bg-mq-primary text-white shadow-sm"
                          : isErrorMessage
                            ? "rounded-bl-md border border-red-200 bg-red-50 text-red-900"
                            : "rounded-bl-md border border-mq-border bg-slate-50 text-mq-ink"
                      }`}
                      role={isErrorMessage ? "alert" : undefined}
                    >
                      {isErrorMessage && (
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide">Response unavailable</p>
                      )}
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div className="flex items-end gap-2.5" role="status" aria-live="polite">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-mq-primary/10 text-[0.65rem] font-extrabold text-mq-primary" aria-hidden="true">
                    MQ
                  </span>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-mq-border bg-slate-50 px-4 py-3 text-sm text-mq-muted">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-mq-primary/25 border-t-mq-primary" aria-hidden="true" />
                    MediQuery is preparing a response...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-mq-border bg-white p-3 sm:p-4">
              <label htmlFor="chat-message" className="sr-only">Your message</label>
              <div className="flex items-end gap-2 rounded-2xl border border-mq-border bg-slate-50 p-1.5 focus-within:border-mq-primary/60 focus-within:ring-2 focus-within:ring-mq-primary/15 sm:gap-3 sm:p-2">
                <input
                  id="chat-message"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your report..."
                  disabled={sending}
                  className="min-h-11 min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-mq-ink outline-none placeholder:text-slate-500 focus:ring-0 disabled:opacity-60"
                />
                <Button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="shrink-0"
                >
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
              <p className="mb-0 mt-2 px-1 text-xs text-mq-muted">
                Ask about your report or related health questions.
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

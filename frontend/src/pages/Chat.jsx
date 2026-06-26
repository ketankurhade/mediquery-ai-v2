import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const modes = [
    { key: "simple", label: "Simple" },
    { key: "detailed", label: "Detailed" },
    { key: "clinical", label: "Clinical" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1 max-w-6xl mx-auto w-full px-4 py-6 gap-6">
        <div className="w-72 bg-white rounded-lg shadow p-5 h-fit">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">👤 Patient</h2>
            <div className="flex gap-2">
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                title="Re-run AI analysis on this report"
              >
                {reanalyzing ? "..." : "↻ Re-analyze"}
              </button>
              <button
                onClick={handleExportPdf}
                className="text-xs text-blue-600 hover:underline"
                title="Download PDF summary"
              >
                ⬇ PDF
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Name: {report.patient_info?.name || "Unknown"}
          </p>
          <p className="text-sm text-gray-600">
            Age: {report.patient_info?.age || "Unknown"}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Gender: {report.patient_info?.gender || "Unknown"}
          </p>

          <hr className="my-3" />

          <h2 className="font-semibold mb-3">📊 Test Results</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {report.all_results?.map((test, i) => {
              const icon =
                test.status === "HIGH" ? "🔴" :
                test.status === "LOW" ? "🟠" :
                test.status === "NORMAL" ? "🟢" : "⚪";
              return (
                <div key={i} className="text-sm border-b pb-2">
                  <p className="font-medium">{icon} {test.test_name}</p>
                  <p className="text-gray-500">
                    {test.value} {test.unit} — {test.status}
                  </p>
                </div>
              );
            })}
          </div>

          <hr className="my-3" />

          {report.abnormal_results?.length > 0 ? (
            <p className="text-sm bg-orange-50 text-orange-700 p-2 rounded">
              ⚠️ {report.abnormal_results.length} of {report.all_results.length} values need attention
            </p>
          ) : (
            <p className="text-sm bg-green-50 text-green-700 p-2 rounded">
              ✅ All values are normal
            </p>
          )}
        </div>

        <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h1 className="font-semibold">💬 Chat about this report</h1>

            <div className="flex bg-gray-100 rounded-md p-0.5">
              {modes.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                    mode === m.key
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm text-center mt-8">
                Ask me anything about this report — e.g. "Is my hemoglobin normal?"
              </p>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your report..."
              disabled={sending}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading comparison...</p>
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

  const directionIcon = (direction, oldStatus, newStatus) => {
    if (direction === "same") return "→";
    const improved =
      (newStatus === "NORMAL" && oldStatus !== "NORMAL") ||
      (oldStatus === "NORMAL" && newStatus === "NORMAL");
    if (direction === "up") return improved ? "↑" : "↑";
    if (direction === "down") return "↓";
    return "—";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mt-2 mb-1">Report Comparison</h1>
        <p className="text-sm text-gray-500 mb-6">
          {new Date(data.report_1.date).toLocaleDateString()} ({data.report_1.filename})
          {" "}vs{" "}
          {new Date(data.report_2.date).toLocaleDateString()} ({data.report_2.filename})
        </p>

        {data.comparison.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-gray-500">
              No matching test names found between these two reports.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="text-left p-3 font-medium">Test</th>
                  <th className="text-left p-3 font-medium">Before</th>
                  <th className="text-left p-3 font-medium">After</th>
                  <th className="text-left p-3 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.map((c, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-3 font-medium">{c.test_name}</td>
                    <td className="p-3 text-gray-600">
                      {c.old_value} {c.unit}
                      <span className="text-xs ml-1 text-gray-400">({c.old_status})</span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {c.new_value} {c.unit}
                      <span className="text-xs ml-1 text-gray-400">({c.new_status})</span>
                    </td>
                    <td className="p-3">
                      {c.change !== null ? (
                        <span
                          className={`font-medium ${
                            c.direction === "up"
                              ? "text-red-600"
                              : c.direction === "down"
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {directionIcon(c.direction)} {c.change > 0 ? "+" : ""}
                          {c.change} ({c.change_pct > 0 ? "+" : ""}{c.change_pct}%)
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
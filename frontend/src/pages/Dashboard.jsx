import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Navbar from "../components/Navbar";
import api from "../api/axios";

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

  const severityStyles = {
    critical: { strip: "bg-red-500", badge: "bg-red-100 text-red-700" },
    mild: { strip: "bg-orange-400", badge: "bg-orange-100 text-orange-700" },
    normal: { strip: "bg-green-400", badge: "bg-green-100 text-green-700" },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Reports</h1>
          <div className="flex gap-2">
            {reports.length >= 2 && (
              <button
                onClick={toggleCompareMode}
                className={`px-4 py-2 rounded-md font-medium border ${
                  compareMode
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
                }`}
              >
                {compareMode ? "Cancel Compare" : "⇄ Compare Reports"}
              </button>
            )}
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
            >
              + Upload New Report
            </Link>
          </div>
        </div>

        {compareMode && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 flex justify-between items-center">
            <p className="text-sm text-purple-800">
              {selectedForCompare.length === 0 && "Select 2 reports to compare"}
              {selectedForCompare.length === 1 && "Select 1 more report"}
              {selectedForCompare.length === 2 && "Ready to compare!"}
            </p>
            <button
              onClick={handleStartComparison}
              disabled={selectedForCompare.length !== 2}
              className="bg-purple-600 text-white px-4 py-1.5 rounded-md text-sm font-medium disabled:opacity-40"
            >
              Compare →
            </button>
          </div>
        )}

        {!loading && reports.length > 0 && !compareMode && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6 flex gap-8">
            <div>
              <p className="text-2xl font-bold">{reports.length}</p>
              <p className="text-xs text-gray-500">Reports Analyzed</p>
            </div>
            <div className="border-l border-gray-200 pl-8">
              <p className="text-2xl font-bold text-orange-600">{totalAbnormal}</p>
              <p className="text-xs text-gray-500">Total Flagged Values</p>
            </div>
            {criticalReports > 0 && (
              <div className="border-l border-gray-200 pl-8">
                <p className="text-2xl font-bold text-red-600">{criticalReports}</p>
                <p className="text-xs text-gray-500">Need Urgent Attention</p>
              </div>
            )}
          </div>
        )}

        {loading && <p className="text-gray-500">Loading reports...</p>}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="font-semibold text-lg mb-1">No reports yet</h2>
            <p className="text-gray-500 text-sm mb-6">
              Upload a lab report to get an instant AI breakdown of your results.
            </p>
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 font-medium inline-block"
            >
              Upload Your First Report
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => {
            const style = severityStyles[report.worst_severity] || severityStyles.normal;
            const isSelected = selectedForCompare.includes(report.id);
            return (
              <div
                key={report.id}
                onClick={() => handleCardClick(report.id)}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? "border-purple-500 ring-2 ring-purple-200"
                    : "border-gray-100 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div className={`h-1.5 ${style.strip}`} />

                <div className="p-5">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-lg">{report.patient_name}</h3>
                    {compareMode ? (
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                        isSelected ? "bg-purple-600 border-purple-600 text-white" : "border-gray-300"
                      }`}>
                        {isSelected && "✓"}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleDelete(report.id, e)}
                        className="text-gray-300 hover:text-red-500 text-sm leading-none"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-3 truncate">{report.filename}</p>

                  {report.abnormal_count > 0 ? (
                    <div className="mb-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${style.badge}`}>
                        {report.abnormal_count} flagged
                      </span>
                      {report.top_abnormal && (
                        <p className="text-xs text-gray-500 mt-2">
                          Top concern:{" "}
                          <span className="font-medium text-gray-700">
                            {report.top_abnormal.test_name}
                          </span>{" "}
                          ({report.top_abnormal.status})
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 mb-3 inline-block">
                      All values normal
                    </span>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>
                    {!compareMode && (
                      <span className="text-xs text-blue-600 font-medium">
                        Open Chat →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
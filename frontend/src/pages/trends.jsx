import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import Navbar from "../components/Navbar";
import api from "../api/axios";

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">📈 Health Trends</h1>
        <p className="text-gray-500 text-sm mb-6">
          Track how your test values change across multiple reports over time.
        </p>

        {availableTests.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="font-semibold mb-1">Not enough data yet</h2>
            <p className="text-gray-500 text-sm">
              Trends appear once the same test shows up in at least 2 of your reports.
              Upload another report to start tracking changes over time.
            </p>
          </div>
        )}

        {availableTests.length > 0 && (
          <>
            <div className="flex gap-2 mb-6 flex-wrap">
              {availableTests.map((t) => (
                <button
                  key={t.test_name}
                  onClick={() => selectTest(t.test_name)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    selectedTest === t.test_name
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {t.test_name} ({t.count})
                </button>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {chartLoading && <p className="text-gray-400 text-sm">Loading chart...</p>}

              {!chartLoading && trendData && (
                <>
                  <h2 className="font-semibold mb-1">{trendData.test_name}</h2>
                  <p className="text-xs text-gray-400 mb-4">
                    {trendData.data_points.length} data points · Unit: {trendData.data_points[0]?.unit}
                  </p>

                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData.data_points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} ${props.payload.unit}`,
                          props.payload.status,
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 5, fill: "#2563eb" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="flex gap-4 mt-4 text-xs text-gray-500">
                    {trendData.data_points.map((p, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.status === "NORMAL"
                              ? "bg-green-400"
                              : p.status === "unknown"
                              ? "bg-gray-300"
                              : "bg-orange-400"
                          }`}
                        />
                        {p.dateLabel}: {p.value} ({p.status})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
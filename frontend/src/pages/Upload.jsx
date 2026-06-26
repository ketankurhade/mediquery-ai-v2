import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/reports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/chat/${response.data.report_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-xl font-bold mb-2">Upload Medical Report</h1>
          <p className="text-gray-500 text-sm mb-6">
            Upload a PDF or image of your lab report
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleUpload}>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm text-gray-600">
                  {file ? file.name : "Click to select PDF or Image"}
                </p>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Processing report..." : "Upload & Analyze"}
            </button>
          </form>

          {uploading && (
            <p className="text-xs text-gray-400 text-center mt-3">
              This may take 10-20 seconds while our AI agents analyze your report
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
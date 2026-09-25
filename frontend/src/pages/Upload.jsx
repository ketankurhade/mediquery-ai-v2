import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { Button, Card, PageHeader } from "../components/ui";

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
    <div className="min-h-screen bg-mq-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
        <PageHeader
          title="Upload a medical report"
          description="Add a lab report to review its results and ask questions about it."
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)] lg:items-start">
          <Card className="p-5 sm:p-7 lg:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold text-mq-ink">Choose a report</p>
              <p className="mt-1 text-sm text-mq-muted">
                Select a file from your device to begin.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-100 font-bold" aria-hidden="true">
                  !
                </span>
                <p className="m-0 pt-0.5">{error}</p>
              </div>
            )}

            <form onSubmit={handleUpload}>
              <div className={`rounded-2xl border-2 border-dashed p-5 transition-colors sm:p-8 ${
                file ? "border-mq-primary/50 bg-mq-primary/5" : "border-slate-300 bg-slate-50/70 hover:border-mq-primary/50 hover:bg-mq-primary/5"
              }`}>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="peer sr-only"
                  id="file-input"
                  aria-describedby="file-types file-picker-help"
                />
                <label
                  htmlFor="file-input"
                  className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl px-3 py-5 text-center outline-none transition focus-visible:ring-4 focus-visible:ring-teal-200 peer-focus-visible:ring-4 peer-focus-visible:ring-teal-200 sm:min-h-60"
                >
                  <span className={`mb-4 grid h-16 w-16 place-items-center rounded-2xl text-2xl font-bold ${
                    file ? "bg-white text-mq-primary shadow-sm" : "bg-mq-primary/10 text-mq-primary"
                  }`} aria-hidden="true">
                    {file ? "✓" : "↑"}
                  </span>
                  <span className="text-base font-semibold text-mq-ink">
                    {file ? "Report selected" : "Choose a file to upload"}
                  </span>
                  <span id="file-picker-help" className="mt-1 text-sm text-mq-muted">
                    {file ? "Select another file" : "Browse files on your device"}
                  </span>
                  <span id="file-types" className="mt-4 rounded-full border border-mq-border bg-white px-3 py-1 text-xs font-medium text-mq-muted">
                    PDF · JPG · JPEG · PNG
                  </span>
                </label>
              </div>

              {file && (
                <div className="mt-4 flex min-w-0 items-center gap-3 rounded-xl border border-mq-border bg-white p-3 sm:p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-mq-primary/10 text-xs font-bold text-mq-primary" aria-hidden="true">
                    {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-mq-ink" title={file.name}>
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-mq-muted">{formatFileSize(file.size)}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-mq-primary">Selected</span>
                </div>
              )}

              <div className="mt-5">
                <Button
                  type="submit"
                  disabled={uploading || !file}
                  className="w-full"
                  aria-live="polite"
                >
                  {uploading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Processing report...
                    </>
                  ) : (
                    "Upload and analyze"
                  )}
                </Button>
              </div>
            </form>

            {uploading && (
              <div className="mt-4 rounded-xl bg-mq-primary/5 px-4 py-3 text-center" role="status" aria-live="polite">
                <p className="text-sm font-medium text-mq-ink">Your report is being processed</p>
                <p className="mt-1 text-xs text-mq-muted">
                  This may take 10–20 seconds while the report is analyzed.
                </p>
              </div>
            )}
          </Card>

          <aside className="space-y-4">
            <Card className="p-5 sm:p-6">
              <h2 className="text-sm font-bold text-mq-ink">Supported file types</h2>
              <p className="mt-2 text-sm leading-6 text-mq-muted">
                PDF, JPG, JPEG, and PNG files are accepted.
              </p>
              <p className="mt-3 border-t border-mq-border pt-3 text-xs leading-5 text-mq-muted">
                The current upload form does not specify a maximum file size.
              </p>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="text-sm font-bold text-mq-ink">After you upload</h2>
              <p className="mt-2 text-sm leading-6 text-mq-muted">
                MediQuery processes the report, then opens its results and chat view.
              </p>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

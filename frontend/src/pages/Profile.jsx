import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { Button, Card, PageHeader } from "../components/ui";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete all your reports and chat history. This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete("/auth/me");
      logout();
      navigate("/");
    } catch (err) {
      alert("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mq-canvas">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
        <PageHeader
          title="Profile"
          description="View your MediQuery account information and manage your account."
        />

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <header className="flex items-center gap-4 border-b border-mq-border bg-white p-5 sm:p-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mq-primary/10 text-xs font-extrabold tracking-wide text-mq-primary" aria-hidden="true">
                MQ
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-mq-primary">
                  Account information
                </p>
                <p className="mt-1 text-sm text-mq-muted">
                  Your profile details for this account.
                </p>
              </div>
            </header>

            <dl className="grid grid-cols-1 divide-y divide-mq-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="min-w-0 p-5 sm:p-6">
                <dt className="text-xs font-semibold uppercase tracking-wide text-mq-muted">
                  Name
                </dt>
                <dd className="mt-2 break-words text-lg font-semibold text-mq-ink">
                  {user?.name || "Not available"}
                </dd>
              </div>
              <div className="min-w-0 p-5 sm:p-6">
                <dt className="text-xs font-semibold uppercase tracking-wide text-mq-muted">
                  Email
                </dt>
                <dd className="mt-2 break-all text-base font-semibold text-mq-ink">
                  {user?.email || "Not available"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="overflow-hidden border-red-200">
            <div className="border-b border-red-100 bg-red-50/70 px-5 py-4 sm:px-6">
              <h2 className="text-base font-bold text-red-900">Delete account</h2>
              <p className="mt-1 text-sm leading-6 text-red-900/80">
                Deleting your account will permanently remove all your reports and chat history. This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="mb-0 text-sm text-mq-muted">
                This action requires confirmation and cannot be reversed.
              </p>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full sm:w-auto"
              >
                {deleting ? "Deleting..." : "Delete account"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

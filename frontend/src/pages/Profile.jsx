import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-xl font-bold mb-6">Profile</h1>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-xs text-gray-400 uppercase">Name</label>
              <p className="text-gray-800">{user?.name}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase">Email</label>
              <p className="text-gray-800">{user?.email}</p>
            </div>
          </div>

          <hr className="my-6" />

          <div>
            <h2 className="text-sm font-semibold text-red-600 mb-2">
              Danger Zone
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Deleting your account will permanently remove all your reports
              and chat history. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full bg-red-50 text-red-600 py-2 rounded-md hover:bg-red-100 disabled:opacity-50 text-sm"
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
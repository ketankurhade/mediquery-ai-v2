import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">🏥 MediQuery AI</h1>
        <p className="text-gray-600 text-lg mb-8">
          Upload your medical reports and get clear, simple explanations
          in your own language. Powered by multi-agent AI.
        </p>
        <div className="space-x-4">
          <Link
            to="/register"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="bg-white text-blue-600 px-6 py-3 rounded-md border border-blue-600 hover:bg-blue-50"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
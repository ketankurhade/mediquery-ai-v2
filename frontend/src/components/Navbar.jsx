import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <Link to="/dashboard" className="text-xl font-bold">
        🏥 MediQuery AI
      </Link>

      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">
          Dashboard
        </Link>
        <Link to="/upload" className="text-gray-600 hover:text-blue-600">
          Upload
        </Link>
        <Link to="/trends" className="text-gray-600 hover:text-blue-600">
          Trends
        </Link>
        <Link to="/profile" className="text-gray-600 hover:text-blue-600">
          Profile
        </Link>
        <span className="text-gray-400">|</span>
        <span className="text-gray-700">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 text-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
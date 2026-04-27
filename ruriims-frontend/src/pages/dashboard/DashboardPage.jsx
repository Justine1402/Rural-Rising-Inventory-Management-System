import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <h1 className="text-2xl font-bold text-green-700">Dashboard — coming soon</h1>
      <button
        onClick={handleLogout}
        className="border border-green-700 text-green-700 px-4 py-2 rounded hover:bg-green-50 text-sm"
      >
        Log out
      </button>
    </div>
  );
}

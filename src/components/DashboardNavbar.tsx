import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardNavbar = () => {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-12 border-b border-border px-4 flex items-center justify-between bg-background">
      <span className="font-bold text-foreground text-sm">Secure Quiz</span>
      <div className="flex items-center gap-3">
        {userData?.photo_url && (
          <img src={userData.photo_url} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
        )}
        <span className="text-xs text-muted-foreground hidden sm:inline">{userData?.name || userData?.email}</span>
        <button onClick={handleLogout} className="text-xs text-muted-foreground underline">
          Logout
        </button>
      </div>
    </header>
  );
};

export default DashboardNavbar;

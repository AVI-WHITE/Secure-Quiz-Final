import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { updateUserRole } from "@/services/userService";

const RoleSelection = () => {
  const { user, userData, setUserData } = useAuth();
  const navigate = useNavigate();

  const handleSelect = async (role: "admin" | "participant") => {
    if (!user) return;
    await updateUserRole(user.id, role);
    setUserData((prev) => (prev ? { ...prev, role } : prev));
    navigate(role === "admin" ? "/admin" : "/participant");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Choose Your Role</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, {userData?.name || "User"}! How will you use Secure Quiz?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleSelect("admin")}
            className="border border-border rounded p-6 text-left hover:border-primary transition-colors"
          >
            <h2 className="text-lg font-bold text-foreground">Admin</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Create quizzes, manage questions, and view results.
            </p>
          </button>

          <button
            onClick={() => handleSelect("participant")}
            className="border border-border rounded p-6 text-left hover:border-primary transition-colors"
          >
            <h2 className="text-lg font-bold text-foreground">Participant</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Join quizzes, answer questions, and track your performance.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;

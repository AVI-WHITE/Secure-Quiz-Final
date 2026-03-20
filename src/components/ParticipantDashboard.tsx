import { useState } from "react";
import DashboardNavbar from "./DashboardNavbar";
import { useAuth } from "@/context/AuthContext";
import { getExamByJoinCode, type Exam } from "@/services/examService";
import { hasStudentAttempted } from "@/services/resultService";
import QuizSession from "./participant/QuizSession";
import PastAttempts from "./participant/PastAttempts";
import { toast } from "sonner";

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [tab, setTab] = useState<"join" | "attempts">("join");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoinByCode = async () => {
    if (!user) return;
    const code = joinCode.trim();
    if (code.length < 4) { toast.error("Enter a valid join code"); return; }
    setJoining(true);
    const exam = await getExamByJoinCode(code);
    if (!exam) { toast.error("Invalid quiz code"); setJoining(false); return; }
    if (!exam.isActive) { toast.error("This quiz is no longer active"); setJoining(false); return; }
    const attempted = await hasStudentAttempted(user.id, exam.id!);
    if (attempted) { toast.error("You have already taken this quiz"); setJoining(false); return; }
    setJoining(false);
    setActiveExamId(exam.id!);
  };

  if (activeExamId) {
    return (
      <div className="flex flex-col min-h-screen">
        <DashboardNavbar />
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <QuizSession examId={activeExamId} onFinish={() => { setActiveExamId(null); }} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNavbar />
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-lg font-bold text-foreground">Participant Dashboard</h1>

          <div className="flex gap-2 border-b border-border pb-1">
            <button onClick={() => setTab("join")}
              className={`px-3 py-1.5 text-sm ${tab === "join" ? "border-b-2 border-primary text-foreground font-medium" : "text-muted-foreground"}`}>
              Join by Code
            </button>
            <button onClick={() => setTab("attempts")}
              className={`px-3 py-1.5 text-sm ${tab === "attempts" ? "border-b-2 border-primary text-foreground font-medium" : "text-muted-foreground"}`}>
              Past Attempts
            </button>
          </div>

          {tab === "join" && (
            <div className="border border-border rounded p-4 space-y-3">
              <h2 className="text-sm font-medium text-foreground">Join a Quiz</h2>
              <p className="text-xs text-muted-foreground">Enter the join code provided by your admin to start a quiz.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter join code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  maxLength={10}
                  className="flex-1 px-3 py-2 border border-border rounded text-sm bg-background text-foreground"
                />
                <button
                  onClick={handleJoinByCode}
                  disabled={joining || joinCode.trim().length < 4}
                  className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {joining ? "Joining..." : "Join"}
                </button>
              </div>
            </div>
          )}

          {tab === "attempts" && <PastAttempts />}
        </div>
      </main>
    </div>
  );
};

export default ParticipantDashboard;
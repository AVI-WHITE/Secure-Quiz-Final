import { useState, useEffect } from "react";
import DashboardNavbar from "./DashboardNavbar";
import { useAuth } from "@/context/AuthContext";
import { getExamsForStudent, getExamByJoinCode, type Exam } from "@/services/examService";
import { hasStudentAttempted } from "@/services/resultService";
import QuizSession from "./participant/QuizSession";
import PastAttempts from "./participant/PastAttempts";
import { toast } from "sonner";

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [tab, setTab] = useState<"join" | "available" | "attempts">("join");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const loadExams = async () => {
    if (!user) return;
    setLoading(true);
    const exams = await getExamsForStudent(user.id);
    const withStatus = await Promise.all(
      exams.map(async (e) => ({
        exam: e,
        attempted: await hasStudentAttempted(user.id, e.id!),
      }))
    );
    setAvailableExams(withStatus.filter((x) => !x.attempted).map((x) => x.exam));
    setLoading(false);
  };

  useEffect(() => { loadExams(); }, [user]);

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
            <QuizSession examId={activeExamId} onFinish={() => { setActiveExamId(null); loadExams(); }} />
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
            <button onClick={() => setTab("available")}
              className={`px-3 py-1.5 text-sm ${tab === "available" ? "border-b-2 border-primary text-foreground font-medium" : "text-muted-foreground"}`}>
              Available Exams
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

          {tab === "available" && (
            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
              ) : availableExams.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border border-border rounded p-6">
                  No exams available right now.
                </p>
              ) : (
                availableExams.map((exam) => (
                  <div key={exam.id} className="border border-border rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground text-sm">{exam.title}</h3>
                      {exam.description && <p className="text-xs text-muted-foreground mt-0.5">{exam.description}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{exam.questionIds.length} questions • {exam.duration} min</p>
                      {exam.joinCode && <p className="text-xs text-muted-foreground mt-0.5">Code: {exam.joinCode}</p>}
                    </div>
                    <button
                      onClick={() => setActiveExamId(exam.id!)}
                      className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm font-medium"
                    >
                      Start Exam
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "attempts" && <PastAttempts />}
        </div>
      </main>
    </div>
  );
};

export default ParticipantDashboard;

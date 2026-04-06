import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getExamById, type Exam } from "@/services/examService";
import { getQuestionsByIds, type Question } from "@/services/questionService";
import { submitResult, hasStudentAttempted } from "@/services/resultService";
import { toast } from "sonner";

interface QuizSessionProps {
  examId: string;
  onFinish: () => void;
}

const MAX_TAB_VIOLATIONS = 3;

const QuizSession = ({ examId, onFinish }: QuizSessionProps) => {
  const { user, userData } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabViolations, setTabViolations] = useState(0);
  const [rightClickAttempts, setRightClickAttempts] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const hasLoadedRef = useRef(false);
  const autoSubmitRef = useRef<() => void>();

  // Load quiz
  useEffect(() => {
    if (hasLoadedRef.current) return;
    const load = async () => {
      if (!user) return;
      hasLoadedRef.current = true;
      const e = await getExamById(examId);
      if (!e) { toast.error("Exam not found"); onFinish(); return; }
      const attempted = await hasStudentAttempted(user.id, examId);
      if (attempted) { toast.error("Already attempted"); onFinish(); return; }
      const qs = await getQuestionsByIds(e.questionIds);
      setExam(e);
      setQuestions(qs);
      setTimeLeft(e.duration * 60);
      const saved = localStorage.getItem(`quiz_answers_${examId}`);
      if (saved) setAnswers(JSON.parse(saved));
      setLoading(false);
    };
    load();
  }, [examId, user]);

  // Timer
  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(interval); autoSubmitRef.current?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitted]);

  // Save answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) localStorage.setItem(`quiz_answers_${examId}`, JSON.stringify(answers));
  }, [answers, examId]);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (submitting || submitted || !user || !userData || !exam) return;
    setSubmitting(true);
    let correct = 0;
    questions.forEach((q) => { if (answers[q.id!] === q.correctAnswer) correct++; });
    const total = questions.length;
    const pct = total > 0 ? (correct / total) * 100 : 0;
    await submitResult({
      studentId: user.id, studentName: userData.name, studentEmail: userData.email,
      examId, examTitle: exam.title, answers, score: correct, totalMarks: total,
      percentage: pct, tabViolations
    });
    localStorage.removeItem(`quiz_answers_${examId}`);
    setScore({ score: correct, total, percentage: pct });
    setSubmitted(true);
    setSubmitting(false);
    toast.success("Submitted!");
  }, [submitting, submitted, user, userData, exam, questions, answers, tabViolations, examId]);

  autoSubmitRef.current = handleSubmit;

  // SECURITY: Tab switch detection (Story 25 & 26)
  useEffect(() => {
    if (loading || submitted) return;
    const handler = () => {
      if (document.hidden) {
        setTabViolations((prev) => {
          const next = prev + 1;
          if (next >= MAX_TAB_VIOLATIONS) {
            toast.error(`Quiz auto-submitted! ${MAX_TAB_VIOLATIONS} tab switches detected.`);
            autoSubmitRef.current?.();
          } else {
            toast.warning(`Tab switch #${next}/${MAX_TAB_VIOLATIONS}. Quiz will auto-submit at ${MAX_TAB_VIOLATIONS}.`);
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [loading, submitted]);

  // SECURITY: Disable right-click (Story 27)
  useEffect(() => {
    if (loading || submitted) return;
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      setRightClickAttempts((p) => p + 1);
      toast.warning("Right-click is disabled during the quiz.");
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, [loading, submitted]);

  // SECURITY: Disable copy/select/keyboard shortcuts (Story 28)
  useEffect(() => {
    if (loading || submitted) return;
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyAttempts((p) => p + 1);
      toast.warning("Copying is disabled during the quiz.");
    };
    const handleSelect = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ["c", "a", "u", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        toast.warning("Keyboard shortcuts are disabled during the quiz.");
      }
    };
    document.addEventListener("copy", handleCopy);
    document.addEventListener("selectstart", handleSelect);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("selectstart", handleSelect);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, submitted]);

  const selectAnswer = (qId: string, idx: number) => setAnswers((prev) => ({ ...prev, [qId]: idx }));

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Loading quiz...</p>;

  if (submitted && score) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 border border-border rounded p-8">
        <h2 className="text-xl font-bold text-foreground">Quiz Complete!</h2>
        <div className="text-4xl font-bold text-foreground">{score.percentage.toFixed(0)}%</div>
        <p className="text-muted-foreground">{score.score} out of {score.total} correct</p>
        {tabViolations > 0 && <p className="text-sm text-red-600">{tabViolations} tab violation(s)</p>}
        {rightClickAttempts > 0 && <p className="text-sm text-red-600">{rightClickAttempts} right-click attempt(s)</p>}
        {copyAttempts > 0 && <p className="text-sm text-red-600">{copyAttempts} copy attempt(s)</p>}
        <button onClick={onFinish} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const totalSuspicious = tabViolations + rightClickAttempts + copyAttempts;

  return (
    <div className="space-y-4 select-none" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Header */}
      <div className="flex items-center justify-between border border-border rounded p-3">
        <h2 className="text-sm font-bold text-foreground">{exam?.title}</h2>
        <div className="flex items-center gap-3">
          {totalSuspicious > 0 && <span className="text-xs text-red-600 font-medium">⚠ {totalSuspicious}</span>}
          <span className={`text-sm font-mono font-medium ${timeLeft < 60 ? "text-red-600" : timeLeft < 300 ? "text-yellow-600" : "text-foreground"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Question nav */}
        <div className="border border-border rounded p-3 lg:w-44 shrink-0">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Questions ({Object.keys(answers).length}/{questions.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrentIdx(i)}
                className={`w-7 h-7 rounded text-xs font-medium ${
                  i === currentIdx ? "bg-primary text-primary-foreground"
                  : answers[q.id!] !== undefined ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
                }`}>{i + 1}</button>
            ))}
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 border border-border rounded p-5 space-y-4">
          <p className="text-xs text-muted-foreground">Question {currentIdx + 1} of {questions.length} • {currentQ?.difficulty}</p>
          <p className="text-foreground font-medium">{currentQ?.questionText}</p>
          <div className="space-y-2">
            {currentQ?.options.map((opt, i) => (
              <button key={i} onClick={() => currentQ.id && selectAnswer(currentQ.id, i)}
                className={`w-full text-left px-3 py-2.5 rounded border text-sm ${
                  answers[currentQ.id!] === i ? "border-primary bg-blue-50 text-foreground" : "border-border text-foreground"
                }`}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))} disabled={currentIdx === 0}
              className="text-sm text-muted-foreground disabled:opacity-30">← Previous</button>
            {currentIdx === questions.length - 1 ? (
              <button onClick={handleSubmit} disabled={submitting}
                className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            ) : (
              <button onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
                className="text-sm text-muted-foreground">Next →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSession;

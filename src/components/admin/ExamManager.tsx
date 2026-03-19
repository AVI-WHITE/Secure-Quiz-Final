import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createExam, updateExam, deleteExam, getExamsByAdmin, type Exam } from "@/services/examService";
import { getQuestionsByAdmin, type Question } from "@/services/questionService";
import { toast } from "sonner";

const ExamManager = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [assignInput, setAssignInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [e, q] = await Promise.all([getExamsByAdmin(user.id), getQuestionsByAdmin(user.id)]);
    setExams(e);
    setQuestions(q);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const toggleQuestion = (id: string) => {
    setSelectedQIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || selectedQIds.length === 0) {
      toast.error("Fill title and select at least one question");
      return;
    }
    setSaving(true);
    try {
      const assignedTo = assignInput.split(",").map((s) => s.trim()).filter(Boolean);
      await createExam({ title, description, questionIds: selectedQIds, duration, createdBy: user.id, assignedTo, isActive: true });
      toast.success("Exam created");
      setShowCreate(false);
      resetForm();
      load();
    } finally { setSaving(false); }
  };

  const resetForm = () => { setTitle(""); setDescription(""); setDuration(30); setSelectedQIds([]); setAssignInput(""); };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam?")) return;
    await deleteExam(id);
    toast.success("Exam deleted");
    load();
  };

  const handleToggleActive = async (exam: Exam) => {
    if (!exam.id) return;
    await updateExam(exam.id, { isActive: !exam.isActive });
    toast.success(exam.isActive ? "Deactivated" : "Activated");
    load();
  };

  if (showCreate) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Create Exam</h2>
          <button onClick={() => { setShowCreate(false); resetForm(); }} className="text-sm text-muted-foreground underline">Cancel</button>
        </div>
        <form onSubmit={handleCreate} className="border border-border rounded p-5 space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Duration (minutes)</label>
            <input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="mt-1 w-32 px-3 py-2 border border-input rounded text-sm bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Assign to Students (comma-separated UIDs)</label>
            <input value={assignInput} onChange={(e) => setAssignInput(e.target.value)} placeholder="Leave empty for all" className="mt-1 w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Select Questions ({selectedQIds.length} selected)</label>
            <div className="mt-1 max-h-48 overflow-y-auto border border-border rounded p-2 space-y-1">
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No questions. Add some first.</p>
              ) : (
                questions.map((q) => (
                  <label key={q.id} className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-muted/50 rounded text-sm">
                    <input type="checkbox" checked={selectedQIds.includes(q.id!)} onChange={() => toggleQuestion(q.id!)} className="mt-0.5" />
                    <div>
                      <p className="text-foreground">{q.questionText}</p>
                      <p className="text-xs text-muted-foreground">{q.subject} • {q.difficulty}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => { setShowCreate(false); resetForm(); }} className="px-4 py-2 text-sm text-muted-foreground">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? "Creating..." : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{exams.length} exam(s)</p>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          + Create Exam
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
      ) : exams.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 border border-border rounded p-6">No exams yet.</p>
      ) : (
        <div className="space-y-2">
          {exams.map((exam) => (
            <div key={exam.id} className="border border-border rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{exam.title}</h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${exam.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    {exam.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {exam.questionIds.length} questions • {exam.duration} min{exam.joinCode && ` • Code: ${exam.joinCode}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleToggleActive(exam)} className="text-xs text-primary underline">
                  {exam.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => exam.id && handleDelete(exam.id)} className="text-xs text-destructive underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamManager;

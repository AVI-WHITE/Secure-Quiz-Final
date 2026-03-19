import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  addQuestion, updateQuestion, deleteQuestion, getQuestionsByAdmin, type Question,
} from "@/services/questionService";
import QuestionForm from "./QuestionForm";
import { toast } from "sonner";

const QuestionBank = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getQuestionsByAdmin(user.id);
    setQuestions(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const subjects = useMemo(() => [...new Set(questions.map((q) => q.subject))], [questions]);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch = q.questionText.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase());
      const matchDiff = !filterDifficulty || q.difficulty === filterDifficulty;
      const matchSubject = !filterSubject || q.subject === filterSubject;
      return matchSearch && matchDiff && matchSubject;
    });
  }, [questions, search, filterDifficulty, filterSubject]);

  const handleAdd = async (data: Omit<Question, "id" | "createdBy">) => {
    if (!user) return;
    await addQuestion({ ...data, createdBy: user.id });
    toast.success("Question added");
    setShowForm(false);
    load();
  };

  const handleUpdate = async (data: Omit<Question, "id" | "createdBy">) => {
    if (!editing?.id) return;
    await updateQuestion(editing.id, data);
    toast.success("Question updated");
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await deleteQuestion(id);
    toast.success("Question deleted");
    load();
  };

  if (showForm || editing) {
    return (
      <QuestionForm
        initial={editing || undefined}
        onSubmit={editing ? handleUpdate : handleAdd}
        onCancel={() => { setShowForm(false); setEditing(null); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions..."
          className="flex-1 max-w-sm px-3 py-2 border border-input rounded text-sm bg-background text-foreground"
        />
        <div className="flex gap-2 flex-wrap">
          <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="px-3 py-2 border border-input rounded text-sm bg-background text-foreground">
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-3 py-2 border border-input rounded text-sm bg-background text-foreground">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            + Add Question
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 border border-border rounded p-6">
          {questions.length === 0 ? "No questions yet. Add your first question!" : "No questions match your filters."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <div key={q.id} className="border border-border rounded p-3 flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">{q.questionText}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded ${q.difficulty === "easy" ? "bg-green-100 text-green-700" : q.difficulty === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {q.difficulty}
                  </span>
                  <span className="text-muted-foreground">{q.subject} / {q.topic}</span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {q.options.map((opt, i) => (
                    <span key={i} className={i === q.correctAnswer ? "text-green-600 font-medium" : ""}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(q)} className="text-xs text-primary underline">Edit</button>
                <button onClick={() => q.id && handleDelete(q.id)} className="text-xs text-destructive underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionBank;

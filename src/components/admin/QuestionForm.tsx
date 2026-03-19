import { useState } from "react";
import type { Question } from "@/services/questionService";

interface QuestionFormProps {
  initial?: Question;
  onSubmit: (data: Omit<Question, "id" | "createdBy" | "createdAt" | "updatedAt">) => Promise<void>;
  onCancel: () => void;
}

const QuestionForm = ({ initial, onSubmit, onCancel }: QuestionFormProps) => {
  const [questionText, setQuestionText] = useState(initial?.questionText || "");
  const [options, setOptions] = useState<string[]>(initial?.options || ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer ?? 0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(initial?.difficulty || "medium");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [topic, setTopic] = useState(initial?.topic || "");
  const [saving, setSaving] = useState(false);

  const handleOption = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || options.some((o) => !o.trim()) || !subject.trim() || !topic.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ questionText, options, correctAnswer, difficulty, subject, topic });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          {initial ? "Edit Question" : "Add Question"}
        </h2>
        <button onClick={onCancel} className="text-sm text-muted-foreground underline">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground">Question Text</label>
          <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3}
            className="mt-1 w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground resize-none" required />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Options</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correctAnswer === i} onChange={() => setCorrectAnswer(i)} />
              <input value={opt} onChange={(e) => handleOption(i, e.target.value)} placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-2 border border-input rounded text-sm bg-background text-foreground" required />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Select the correct answer.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="mt-1 w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Topic</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-input rounded text-sm bg-background text-foreground" required />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving..." : initial ? "Update" : "Add Question"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;

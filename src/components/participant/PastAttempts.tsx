import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getResultsByStudent, type ExamResult } from "@/services/resultService";

const PastAttempts = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await getResultsByStudent(user.id);
      setResults(data);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>;
  if (results.length === 0) return <p className="text-sm text-muted-foreground italic">No attempts yet.</p>;

  return (
    <div className="space-y-2">
      {results.map((r) => (
        <div key={r.id} className="border border-border rounded p-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-foreground">{r.examTitle}</h3>
            <p className="text-xs text-muted-foreground">{r.score}/{r.totalMarks} correct</p>
          </div>
          <div className="flex items-center gap-3">
            {r.tabViolations > 0 && <span className="text-xs text-red-600">⚠ {r.tabViolations}</span>}
            <span className={`text-lg font-bold ${r.percentage >= 50 ? "text-green-600" : "text-red-600"}`}>
              {r.percentage.toFixed(0)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PastAttempts;

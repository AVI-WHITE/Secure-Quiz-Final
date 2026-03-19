import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getExamsByAdmin, type Exam } from "@/services/examService";
import { getResultsByExam, type ExamResult } from "@/services/resultService";

const getFlagLabel = (r: ExamResult) => {
  const total = (r.tabViolations || 0);
  if (total === 0) return { text: "Clean", color: "text-green-600" };
  if (total <= 2) return { text: "Minor", color: "text-yellow-600" };
  return { text: "Flagged", color: "text-red-600" };
};

const ResultsViewer = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [expandedExam, setExpandedExam] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ExamResult[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await getExamsByAdmin(user.id);
      setExams(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const toggleExam = async (examId: string) => {
    if (expandedExam === examId) { setExpandedExam(null); return; }
    setExpandedExam(examId);
    if (!results[examId]) {
      const r = await getResultsByExam(examId);
      setResults((prev) => ({ ...prev, [examId]: r }));
    }
  };

  const exportCSV = (examTitle: string, data: ExamResult[]) => {
    const headers = "Rank,Name,Email,Score,Total,Percentage,Tab Violations,Status\n";
    const sorted = [...data].sort((a, b) => b.percentage - a.percentage);
    const rows = sorted.map((r, i) =>
      `${i + 1},"${r.studentName}","${r.studentEmail}",${r.score},${r.totalMarks},${r.percentage.toFixed(1)}%,${r.tabViolations},"${getFlagLabel(r).text}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `results-${examTitle}.csv`;
    a.click();
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>;

  return (
    <div className="space-y-2">
      {exams.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8 border border-border rounded p-6">No exams yet.</p>
      ) : (
        exams.map((exam) => {
          const examResults = results[exam.id!] || [];
          const isExpanded = expandedExam === exam.id;
          return (
            <div key={exam.id} className="border border-border rounded overflow-hidden">
              <button onClick={() => exam.id && toggleExam(exam.id)} className="w-full p-3 flex items-center justify-between text-left">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{exam.title}</h3>
                  <p className="text-xs text-muted-foreground">{exam.questionIds.length} questions</p>
                </div>
                <span className="text-xs text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-3">
                  {!results[exam.id!] ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                  ) : examResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No submissions yet.</p>
                  ) : (
                    <>
                      {/* Summary */}
                      <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                        <span>Participants: {examResults.length}</span>
                        <span>Avg: {(examResults.reduce((a, b) => a + b.percentage, 0) / examResults.length).toFixed(0)}%</span>
                        <span>High: {Math.max(...examResults.map(r => r.percentage)).toFixed(0)}%</span>
                        <span>Low: {Math.min(...examResults.map(r => r.percentage)).toFixed(0)}%</span>
                      </div>

                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="py-1.5 px-2 font-medium text-muted-foreground">#</th>
                            <th className="py-1.5 px-2 font-medium text-muted-foreground">Student</th>
                            <th className="py-1.5 px-2 font-medium text-muted-foreground">Score</th>
                            <th className="py-1.5 px-2 font-medium text-muted-foreground">%</th>
                            <th className="py-1.5 px-2 font-medium text-muted-foreground">Violations</th>
                            <th className="py-1.5 px-2 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...examResults].sort((a, b) => b.percentage - a.percentage).map((r, i) => {
                            const flag = getFlagLabel(r);
                            return (
                              <tr key={r.id} className="border-b border-border/50">
                                <td className="py-1.5 px-2 text-muted-foreground">{i + 1}</td>
                                <td className="py-1.5 px-2">
                                  <p className="text-foreground">{r.studentName}</p>
                                  <p className="text-xs text-muted-foreground">{r.studentEmail}</p>
                                </td>
                                <td className="py-1.5 px-2 text-foreground">{r.score}/{r.totalMarks}</td>
                                <td className="py-1.5 px-2">
                                  <span className={r.percentage >= 50 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                    {r.percentage.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="py-1.5 px-2">
                                  {r.tabViolations > 0 ? (
                                    <span className="text-red-600 font-medium">{r.tabViolations}</span>
                                  ) : (
                                    <span className="text-muted-foreground">0</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-2">
                                  <span className={`text-xs font-medium ${flag.color}`}>{flag.text}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <button
                        onClick={() => exportCSV(exam.title, examResults)}
                        className="mt-3 text-xs text-primary underline"
                      >
                        Export CSV
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ResultsViewer;

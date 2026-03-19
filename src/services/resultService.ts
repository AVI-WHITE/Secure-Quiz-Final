import { supabase } from "@/integrations/supabase/client";

export interface ExamResult {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examTitle: string;
  answers: Record<string, number>;
  score: number;
  totalMarks: number;
  percentage: number;
  tabViolations: number;
  submittedAt?: string;
}

export const submitResult = async (result: Omit<ExamResult, "id">) => {
  const { data, error } = await supabase
    .from("results")
    .insert({
      user_id: result.studentId,
      quiz_id: result.examId,
      score: result.score,
      total_marks: result.totalMarks,
      answers: result.answers,
      tab_violations: result.tabViolations,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

export const getResultsByExam = async (examId: string): Promise<ExamResult[]> => {
  const { data, error } = await supabase
    .from("results")
    .select("*, profiles:user_id(name, email)")
    .eq("quiz_id", examId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    studentId: r.user_id,
    studentName: r.profiles?.name || "Unknown",
    studentEmail: r.profiles?.email || "",
    examId: r.quiz_id,
    examTitle: "",
    answers: r.answers || {},
    score: r.score,
    totalMarks: r.total_marks,
    percentage: r.total_marks > 0 ? (r.score / r.total_marks) * 100 : 0,
    tabViolations: r.tab_violations || 0,
    submittedAt: r.submitted_at,
  }));
};

export const getResultsByStudent = async (studentId: string): Promise<ExamResult[]> => {
  const { data, error } = await supabase
    .from("results")
    .select("*, quizzes:quiz_id(title)")
    .eq("user_id", studentId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    id: r.id,
    studentId: r.user_id,
    studentName: "",
    studentEmail: "",
    examId: r.quiz_id,
    examTitle: r.quizzes?.title || "Unknown Quiz",
    answers: r.answers || {},
    score: r.score,
    totalMarks: r.total_marks,
    percentage: r.total_marks > 0 ? (r.score / r.total_marks) * 100 : 0,
    tabViolations: r.tab_violations || 0,
    submittedAt: r.submitted_at,
  }));
};

export const hasStudentAttempted = async (studentId: string, examId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("results")
    .select("id")
    .eq("user_id", studentId)
    .eq("quiz_id", examId)
    .limit(1);
  if (error) throw error;
  return (data || []).length > 0;
};

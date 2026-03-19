import { supabase } from "@/integrations/supabase/client";

export interface Exam {
  id?: string;
  title: string;
  description: string;
  questionIds: string[];
  duration: number;
  createdBy: string;
  assignedTo: string[];
  isActive: boolean;
  joinCode?: string;
}

const fromDb = (row: any): Exam => ({
  id: row.id,
  title: row.title,
  description: row.description || "",
  questionIds: row.question_ids || [],
  duration: row.duration_minutes,
  createdBy: row.created_by,
  assignedTo: row.assigned_to || [],
  isActive: row.is_active,
  joinCode: row.join_code,
});

export const createExam = async (exam: Omit<Exam, "id" | "joinCode">) => {
  const { data, error } = await supabase
    .from("quizzes")
    .insert({
      title: exam.title,
      description: exam.description,
      question_ids: exam.questionIds,
      duration_minutes: exam.duration,
      created_by: exam.createdBy,
      assigned_to: exam.assignedTo,
      is_active: exam.isActive,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

export const updateExam = async (id: string, data: Partial<Exam>) => {
  const update: any = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.questionIds) update.question_ids = data.questionIds;
  if (data.duration !== undefined) update.duration_minutes = data.duration;
  if (data.assignedTo) update.assigned_to = data.assignedTo;
  if (data.isActive !== undefined) update.is_active = data.isActive;

  const { error } = await supabase.from("quizzes").update(update).eq("id", id);
  if (error) throw error;
};

export const deleteExam = async (id: string) => {
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) throw error;
};

export const getExamsByAdmin = async (adminUid: string): Promise<Exam[]> => {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("created_by", adminUid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
};

export const getExamById = async (id: string): Promise<Exam | null> => {
  const { data, error } = await supabase.from("quizzes").select("*").eq("id", id).single();
  if (error) return null;
  return fromDb(data);
};

export const getExamsForStudent = async (studentUid: string): Promise<Exam[]> => {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_active", true);
  if (error) throw error;
  // Filter client-side: assigned_to empty means all, otherwise must contain student
  return (data || [])
    .map(fromDb)
    .filter((e) => e.assignedTo.length === 0 || e.assignedTo.includes(studentUid));
};

export const getExamByJoinCode = async (code: string): Promise<Exam | null> => {
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("join_code", code.toLowerCase())
    .single();
  if (error) return null;
  return fromDb(data);
};

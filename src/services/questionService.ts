import { supabase } from "@/integrations/supabase/client";

export interface Question {
  id?: string;
  questionText: string;
  options: string[];
  correctAnswer: number; // index 0-3
  difficulty: "easy" | "medium" | "hard";
  subject: string;
  topic: string;
  createdBy: string;
}

const ANSWER_MAP = ["A", "B", "C", "D"] as const;
const ANSWER_REVERSE: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

const toDb = (q: Omit<Question, "id">) => ({
  created_by: q.createdBy,
  question_text: q.questionText,
  option_a: q.options[0],
  option_b: q.options[1],
  option_c: q.options[2],
  option_d: q.options[3],
  correct_answer: ANSWER_MAP[q.correctAnswer],
  difficulty: q.difficulty,
  subject: q.subject,
  topic: q.topic,
});

const fromDb = (row: any): Question => ({
  id: row.id,
  questionText: row.question_text,
  options: [row.option_a, row.option_b, row.option_c, row.option_d],
  correctAnswer: ANSWER_REVERSE[row.correct_answer] ?? 0,
  difficulty: row.difficulty,
  subject: row.subject,
  topic: row.topic,
  createdBy: row.created_by,
});

export const addQuestion = async (question: Omit<Question, "id">) => {
  const { data, error } = await supabase
    .from("questions")
    .insert(toDb(question))
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

export const updateQuestion = async (id: string, data: Partial<Question>) => {
  const update: any = {};
  if (data.questionText !== undefined) update.question_text = data.questionText;
  if (data.options) {
    update.option_a = data.options[0];
    update.option_b = data.options[1];
    update.option_c = data.options[2];
    update.option_d = data.options[3];
  }
  if (data.correctAnswer !== undefined) update.correct_answer = ANSWER_MAP[data.correctAnswer];
  if (data.difficulty) update.difficulty = data.difficulty;
  if (data.subject) update.subject = data.subject;
  if (data.topic) update.topic = data.topic;

  const { error } = await supabase.from("questions").update(update).eq("id", id);
  if (error) throw error;
};

export const deleteQuestion = async (id: string) => {
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw error;
};

export const getQuestionsByAdmin = async (adminUid: string): Promise<Question[]> => {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("created_by", adminUid)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(fromDb);
};

export const getQuestionById = async (id: string): Promise<Question | null> => {
  const { data, error } = await supabase.from("questions").select("*").eq("id", id).single();
  if (error) return null;
  return fromDb(data);
};

export const getQuestionsByIds = async (ids: string[]): Promise<Question[]> => {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("questions").select("*").in("id", ids);
  if (error) throw error;
  return (data || []).map(fromDb);
};

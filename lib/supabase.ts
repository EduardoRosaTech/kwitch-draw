import { createClient } from "@supabase/supabase-js";
import type { Gender } from "./addressing";
import type { Familiar } from "./familiar";
const vars = (import.meta as ImportMeta & { env: Record<string, string> }).env;
export const configured = Boolean(
  vars.VITE_SUPABASE_URL &&
  vars.VITE_SUPABASE_ANON_KEY &&
  !vars.VITE_SUPABASE_URL.includes("SEU-PROJETO"),
);
export const db = configured
  ? createClient(vars.VITE_SUPABASE_URL, vars.VITE_SUPABASE_ANON_KEY)
  : null;
export type Challenge = {
  channel: "standard" | "journey" | "academy";
  id: number;
  title: string;
  prompt: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  xp: number;
  grimoire_id: string | null;
  step: number | null;
};
export type Profile = Familiar & {
  id: string;
  display_name: string;
  gender: Gender;
  xp: number;
  level: number;
  streak: number;
  last_completed_on: string | null;
  created_at: string;
};
export type Run = {
  id: string;
  challenge_id: number;
  kind: string;
  started_at: string;
  active_since: string | null;
  accumulated_seconds: number;
  status: string;
};
export type Completion = {
  drawing_visibility: "private" | "public" | "removed";
  moderated: boolean;
  run_id: string;
  drawing_path: string | null;
  drawing_bonus: number;
  id: string;
  challenge_id: number;
  xp: number;
  seconds: number;
  completed_at: string;
  completed_on: string;
  kind: string;
};
export type Grimoire = {
  id: string;
  title: string;
  description: string;
  icon: string;
};
export type Spell = {
  required_practice_count: number | null;
  id: string;
  title: string;
  description: string;
  icon: string;
  required_count: number;
};
export type Lesson = {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  format: string;
  summary: string;
  min_level: number;
  reading_seconds: number;
  sort_order: number;
  practice_challenge_id: number;
};
export type LessonStep = {
  lesson_id: string;
  step: number;
  title: string;
  explanation: string;
  diagram_key: string;
};
export type LessonProgress = {
  lesson_id: string;
  read_at: string | null;
  practice_completed_at: string | null;
};
export type ChallengeLesson = {
  challenge_id: number;
  lesson_id: string;
  priority: number;
};

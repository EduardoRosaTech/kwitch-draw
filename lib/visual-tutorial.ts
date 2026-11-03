import { db } from "./supabase";
export type TutorialStep = {
  title: string;
  description: string;
  image: string;
  type:
    | "reference"
    | "construction"
    | "sketch"
    | "lineart"
    | "color"
    | "detail"
    | "final";
  tip: string;
};
export type TutorialPayload = {
  title: string;
  intro: string;
  palette: { hex: string; label: string }[];
  final_image: string | null;
  tips: string;
  steps: TutorialStep[];
};
export function localTutorialImage(path: string) {
  return /^\/tutorials\/[a-zA-Z0-9/_-]+\.(svg|png|webp)$/.test(path);
}
export async function resolveTutorialImage(path: string) {
  if (localTutorialImage(path)) return path;
  if (!/^storage:[0-9a-f-]{36}\/[0-9]{8}\/[0-9a-f-]{36}\.webp$/.test(path))
    return "";
  const r = await db!.storage
    .from("tutorial-assets")
    .createSignedUrl(path.slice(8), 300);
  if (r.error) return "";
  return r.data.signedUrl;
}
export async function resolveTutorial(
  p: TutorialPayload,
): Promise<TutorialPayload> {
  const steps = await Promise.all(
    p.steps.map(async (s) => ({
      ...s,
      image: await resolveTutorialImage(s.image),
    })),
  );
  return {
    ...p,
    steps,
    final_image: p.final_image
      ? await resolveTutorialImage(p.final_image)
      : null,
  };
}

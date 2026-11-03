import { sketchFile, type DrawingMode, type SketchStroke } from "./sketch";
export type DrawingDraft = {
  key: string;
  userId: string;
  runId: string;
  mode: DrawingMode;
  strokes: SketchStroke[];
  photo: Blob | null;
  updatedAt: number;
};
const database = "kwitch-drawing-drafts",
  store = "drafts";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(database, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(store, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(Error("Não consegui guardar o rascunho neste aparelho."));
  });
}
async function transact<T>(
  mode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = action(tx.objectStore(store));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () =>
        reject(Error("Não consegui guardar o rascunho neste aparelho."));
      tx.onabort = () =>
        reject(Error("O rascunho não foi salvo neste aparelho."));
    });
  } finally {
    db.close();
  }
}
export const draftKey = (userId: string, runId: string) => `${userId}:${runId}`;
export async function getDrawingDraft(userId: string, runId: string) {
  return (
    (await transact<DrawingDraft | undefined>("readonly", (s) =>
      s.get(draftKey(userId, runId)),
    )) ?? null
  );
}
export async function saveDrawingDraft(draft: DrawingDraft) {
  await transact("readwrite", (s) => s.put(draft));
}
export async function deleteDrawingDraft(userId: string, runId: string) {
  await transact("readwrite", (s) => s.delete(draftKey(userId, runId)));
}
export async function listDrawingDrafts(userId: string) {
  return (await transact<DrawingDraft[]>("readonly", (s) => s.getAll())).filter(
    (d) => d.userId === userId,
  );
}
export async function draftFile(draft: DrawingDraft) {
  return draft.mode === "digital"
    ? sketchFile(draft.strokes)
    : draft.photo
      ? new File([draft.photo], "meu-desenho.webp", { type: draft.photo.type })
      : null;
}

// Keep these thresholds aligned with public.level_from_xp (migration 004).
export function xpForLevel(level: number): number {
  const n = Math.max(0, Math.trunc(level) - 1);
  return (25 * n * (n + 11)) / 2;
}
export function levelFromXp(xp: number): number {
  const safe = Math.max(0, Math.trunc(xp));
  let level = Math.floor((Math.sqrt(121 + (8 * safe) / 25) - 11) / 2) + 1;
  // Integer thresholds avoid drift at exact boundaries.
  while (xpForLevel(level + 1) <= safe) level++;
  while (xpForLevel(level) > safe) level--;
  return level;
}
export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const start = xpForLevel(level),
    end = xpForLevel(level + 1);
  return {
    level,
    earned: xp - start,
    required: end - start,
    remaining: end - xp,
  };
}

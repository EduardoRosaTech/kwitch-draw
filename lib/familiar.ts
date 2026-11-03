export const familiarKinds = [
  "cat",
  "fox",
  "owl",
  "frog",
  "raven",
  "rabbit",
] as const;
export const familiarTones = ["plum", "rose", "coral", "sage"] as const;
export const familiarCharms = ["star", "moon", "leaf"] as const;
export type FamiliarKind = (typeof familiarKinds)[number];
export type FamiliarTone = (typeof familiarTones)[number];
export type FamiliarCharm = (typeof familiarCharms)[number];
export type Familiar = {
  familiar_kind: FamiliarKind;
  familiar_tone: FamiliarTone;
  familiar_charm: FamiliarCharm;
  familiar_name: string;
  familiar_description: string;
};
export const defaultFamiliar: Familiar = {
  familiar_kind: "cat",
  familiar_tone: "plum",
  familiar_charm: "star",
  familiar_name: "Nox",
  familiar_description: "",
};
export const kindLabels: Record<FamiliarKind, string> = {
  cat: "Gato",
  fox: "Raposa",
  owl: "Coruja",
  frog: "Sapo",
  raven: "Corvo",
  rabbit: "Coelho",
};
export const toneLabels: Record<FamiliarTone, string> = {
  plum: "Ameixa",
  rose: "Rosa",
  coral: "Coral",
  sage: "Sálvia",
};
export const charmLabels: Record<FamiliarCharm, string> = {
  star: "Estrela",
  moon: "Lua",
  leaf: "Folha",
};
export function randomFamiliar(current: Familiar): Familiar {
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(Math.random() * items.length)];
  return {
    ...current,
    familiar_kind: pick(familiarKinds),
    familiar_tone: pick(familiarTones),
    familiar_charm: pick(familiarCharms),
  };
}
export function familiarFromProfile(
  profile: Partial<Familiar> | null,
): Familiar {
  return {
    familiar_kind: familiarKinds.includes(
      profile?.familiar_kind as FamiliarKind,
    )
      ? profile!.familiar_kind!
      : defaultFamiliar.familiar_kind,
    familiar_tone: familiarTones.includes(
      profile?.familiar_tone as FamiliarTone,
    )
      ? profile!.familiar_tone!
      : defaultFamiliar.familiar_tone,
    familiar_charm: familiarCharms.includes(
      profile?.familiar_charm as FamiliarCharm,
    )
      ? profile!.familiar_charm!
      : defaultFamiliar.familiar_charm,
    familiar_name: profile?.familiar_name ?? defaultFamiliar.familiar_name,
    familiar_description: profile?.familiar_description ?? "",
  };
}

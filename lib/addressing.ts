export type Gender = "feminine" | "masculine" | "neutral";
export function address(gender: Gender = "neutral") {
  return gender === "feminine"
    ? {
        alias: "Bruxinha",
        welcome: "BEM-VINDA AO SEU ATELIÊ",
        artist: "Ilustradora de mundos",
        witch: "Bruxa do ateliê",
        master: "Grã-feiticeira",
      }
    : gender === "masculine"
      ? {
          alias: "Bruxinho",
          welcome: "BEM-VINDO AO SEU ATELIÊ",
          artist: "Ilustrador de mundos",
          witch: "Bruxo do ateliê",
          master: "Grão-feiticeiro",
        }
      : {
          alias: "Pessoa criativa",
          welcome: "SEU ATELIÊ ESTÁ DE PORTAS ABERTAS",
          artist: "Talento que cria mundos",
          witch: "Magia do ateliê",
          master: "Maestria dos feitiços",
        };
}

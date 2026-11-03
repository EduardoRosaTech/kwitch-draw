"use client";
import { useId } from "react";
import {
  type Familiar,
  familiarKinds,
  familiarTones,
  familiarCharms,
  kindLabels,
  toneLabels,
  charmLabels,
  randomFamiliar,
} from "../lib/familiar";

const palettes = {
  plum: { body: "#51405f", light: "#b8a0cd", shade: "#34263e" },
  rose: { body: "#d98dac", light: "#f4c8d9", shade: "#925475" },
  coral: { body: "#eaa080", light: "#ffe0b9", shade: "#a76159" },
  sage: { body: "#83aaa0", light: "#d4e8c9", shade: "#4a746b" },
};
export function FamiliarAvatar({
  familiar,
  className = "",
}: {
  familiar: Familiar;
  className?: string;
}) {
  const id = useId();
  const p = palettes[familiar.familiar_tone];
  const kind = familiar.familiar_kind;
  const wings = kind === "raven";
  return (
    <svg
      viewBox="0 0 160 160"
      className={`familiar-avatar ${className}`}
      role="img"
      aria-labelledby={id}
    >
      <title id={id}>
        {familiar.familiar_name}, seu familiar{" "}
        {kindLabels[kind].toLocaleLowerCase("pt-BR")}
      </title>
      <circle cx="80" cy="80" r="74" fill="#302238" />
      <circle
        cx="80"
        cy="80"
        r="68"
        fill="none"
        stroke={p.light}
        strokeOpacity=".2"
        strokeDasharray="2 8"
      />
      <path
        d="m26 40 3 7 7 3-7 3-3 7-3-7-7-3 7-3z M132 95l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
        fill="#f6d7a0"
      />
      <ellipse
        cx="80"
        cy="137"
        rx="43"
        ry="7"
        fill="#18131e"
        fillOpacity=".5"
      />
      {wings && (
        <>
          <path
            d="M51 87Q17 66 20 93q3 21 35 26 M109 87q34-21 31 6-3 21-35 26"
            fill={p.shade}
            stroke={p.light}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="m25 89 25 15m-22-3 23 11m84-23-25 15m22-3-23 11"
            stroke={p.light}
            strokeOpacity=".5"
          />
        </>
      )}
      {(kind === "cat" || kind === "fox") && (
        <path
          d="M105 128q40 9 29-26q-4-11-12-12"
          fill="none"
          stroke={p.body}
          strokeWidth={kind === "fox" ? 22 : 11}
          strokeLinecap="round"
        />
      )}
      {kind === "fox" && (
        <path
          d="M133 113q2-14-9-22"
          fill="none"
          stroke="#f5ebdf"
          strokeWidth="21"
          strokeLinecap="round"
        />
      )}
      <ellipse cx="80" cy="109" rx="33" ry="29" fill={p.body} />
      <ellipse cx="80" cy="116" rx="21" ry="18" fill={p.light} />
      <ellipse cx="57" cy="135" rx="13" ry="6" fill={p.shade} />
      <ellipse cx="103" cy="135" rx="13" ry="6" fill={p.shade} />
      {(kind === "cat" || kind === "fox") && (
        <>
          <path
            d="m47 66-3-38 29 24m14 0 29-24-3 38"
            fill={p.body}
            stroke={p.body}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="m50 54-1-17 16 14m30 0 16-14-1 17" fill={p.light} />
        </>
      )}
      {kind === "rabbit" && (
        <>
          <ellipse
            cx="60"
            cy="33"
            rx="12"
            ry="28"
            fill={p.body}
            transform="rotate(-12 60 33)"
          />
          <ellipse
            cx="100"
            cy="33"
            rx="12"
            ry="28"
            fill={p.body}
            transform="rotate(12 100 33)"
          />
          <ellipse
            cx="60"
            cy="31"
            rx="5"
            ry="19"
            fill={p.light}
            transform="rotate(-12 60 31)"
          />
          <ellipse
            cx="100"
            cy="31"
            rx="5"
            ry="19"
            fill={p.light}
            transform="rotate(12 100 31)"
          />
        </>
      )}
      {kind === "raven" && (
        <path d="m70 45 4-18 8 15 9-13 2 19" fill={p.body} />
      )}
      <ellipse
        cx="80"
        cy="73"
        rx={kind === "frog" ? 40 : 37}
        ry={kind === "fox" ? 29 : 34}
        fill={p.body}
      />
      {kind === "fox" && (
        <path
          d="M46 71q14 26 34 28 20-2 34-28L92 83 80 95 68 83z"
          fill="#f5ebdf"
        />
      )}
      {kind === "owl" && (
        <>
          <path d="m48 51-7-22 28 15m22 0 28-15-7 22" fill={p.body} />
          <ellipse cx="64" cy="72" rx="18" ry="23" fill={p.light} />
          <ellipse cx="96" cy="72" rx="18" ry="23" fill={p.light} />
          <path d="m75 85 10 0-5 10z" fill="#f6d7a0" />
          <path
            d="m69 116 5 5m7-8 5 5m7-2 5 5"
            stroke={p.shade}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === "frog" && (
        <>
          <circle cx="56" cy="53" r="17" fill={p.body} />
          <circle cx="104" cy="53" r="17" fill={p.body} />
          <circle cx="56" cy="54" r="11" fill={p.light} />
          <circle cx="104" cy="54" r="11" fill={p.light} />
        </>
      )}
      <g fill="#211827">
        <ellipse
          cx={kind === "frog" ? 56 : 65}
          cy={kind === "frog" ? 54 : 72}
          rx="4"
          ry="6"
        />
        <ellipse
          cx={kind === "frog" ? 104 : 95}
          cy={kind === "frog" ? 54 : 72}
          rx="4"
          ry="6"
        />
      </g>
      <g fill="#fff4e4">
        <circle
          cx={kind === "frog" ? 55 : 64}
          cy={kind === "frog" ? 52 : 70}
          r="1.5"
        />
        <circle
          cx={kind === "frog" ? 103 : 94}
          cy={kind === "frog" ? 52 : 70}
          r="1.5"
        />
      </g>
      {kind === "raven" && <path d="m73 82 14 0-7 15z" fill="#f6d7a0" />}
      {kind !== "owl" && kind !== "raven" && (
        <>
          <path
            d={kind === "frog" ? "M62 80q18 15 36 0" : "M73 86q7 8 14 0"}
            fill="none"
            stroke="#34263e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {kind !== "frog" && <path d="m76 81 8 0-4 5z" fill="#34263e" />}
        </>
      )}
      {kind === "rabbit" && <path d="M76 88h8v7h-8z" fill="#fff4e4" />}
      <ellipse cx="52" cy="83" rx="6" ry="3" fill="#edb2b1" fillOpacity=".7" />
      <ellipse cx="108" cy="83" rx="6" ry="3" fill="#edb2b1" fillOpacity=".7" />
      <path
        d="M53 103q27 12 54 0"
        fill="none"
        stroke="#f1c6d4"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {familiar.familiar_charm === "star" && (
        <path d="m80 107 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#f6d7a0" />
      )}
      {familiar.familiar_charm === "moon" && (
        <path d="M85 109a10 10 0 1 0 3 17 10 10 0 0 1-3-17" fill="#f6d7a0" />
      )}
      {familiar.familiar_charm === "leaf" && (
        <>
          <path d="M73 124q-5-15 16-14 1 20-16 14" fill="#d4e8c9" />
          <path d="m73 125 12-11" stroke="#4a746b" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

export function FamiliarEditor({
  value,
  onChange,
}: {
  value: Familiar;
  onChange: (value: Familiar) => void;
}) {
  return (
    <fieldset className="familiar-editor">
      <legend>Meu familiar mágico</legend>
      <p>
        Escolha quem vai acompanhar seus desenhos. Dê um nome e conte a história
        desse pequeno companheiro.
      </p>
      <button
        className="shuffle-familiar"
        type="button"
        onClick={() => onChange(randomFamiliar(value))}
      >
        ✧ Sortear familiar
      </button>
      <div
        className="familiar-options"
        role="group"
        aria-label="Espécie do familiar"
      >
        {familiarKinds.map((kind) => (
          <button
            type="button"
            key={kind}
            className={value.familiar_kind === kind ? "chosen" : ""}
            aria-pressed={value.familiar_kind === kind}
            onClick={() => onChange({ ...value, familiar_kind: kind })}
          >
            <FamiliarAvatar familiar={{ ...value, familiar_kind: kind }} />
            <span>{kindLabels[kind]}</span>
          </button>
        ))}
      </div>
      <div className="familiar-controls">
        <label>
          Cor do familiar
          <select
            value={value.familiar_tone}
            onChange={(e) =>
              onChange({
                ...value,
                familiar_tone: e.target.value as Familiar["familiar_tone"],
              })
            }
          >
            {familiarTones.map((tone) => (
              <option key={tone} value={tone}>
                {toneLabels[tone]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amuleto
          <select
            value={value.familiar_charm}
            onChange={(e) =>
              onChange({
                ...value,
                familiar_charm: e.target.value as Familiar["familiar_charm"],
              })
            }
          >
            {familiarCharms.map((charm) => (
              <option key={charm} value={charm}>
                {charmLabels[charm]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="familiar-preview">
        <FamiliarAvatar familiar={value} />
        <div>
          <strong>{value.familiar_name || "Meu familiar"}</strong>
          <p>
            {value.familiar_description || "Seu companheiro de cada traço."}
          </p>
        </div>
      </div>
      <label>
        Nome do familiar
        <input
          value={value.familiar_name}
          minLength={2}
          maxLength={30}
          required
          onChange={(e) =>
            onChange({ ...value, familiar_name: e.target.value })
          }
        />
      </label>
      <label>
        Personalidade e história
        <textarea
          rows={3}
          value={value.familiar_description}
          maxLength={240}
          placeholder="Ex.: uma coruja curiosa que coleciona lápis e adora desenhar à noite…"
          onChange={(e) =>
            onChange({ ...value, familiar_description: e.target.value })
          }
        />
        <small>{value.familiar_description.length}/240 caracteres</small>
      </label>
    </fieldset>
  );
}

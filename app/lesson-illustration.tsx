import { useId } from "react";
export function LessonIllustration({
  topic,
  step,
  label,
}: {
  topic: string;
  step: number;
  label: string;
}) {
  const id = useId();
  const detail = step >= 2;
  const finish = step >= 3;
  const guide = {
    stroke: "#ba8da9",
    strokeDasharray: "5 5",
    fill: "none",
    strokeWidth: 1.5,
  };
  const ink = {
    stroke: "#ffe5c6",
    strokeWidth: 3,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      className="lesson-illustration"
      viewBox="0 0 240 180"
      role="img"
      aria-labelledby={id}
    >
      <title id={id}>
        {label} — construção visual, etapa {step}
      </title>
      <defs>
        <clipPath id={`${id}-eye`}>
          <path d="M48 88q72-72 144 0q-72 64-144 0Z" />
        </clipPath>
      </defs>
      <rect width="240" height="180" rx="18" fill="#322339" />
      <g {...ink}>
        {topic === "fundamentos" && (
          <>
            <ellipse cx="116" cy="52" rx="49" ry="17" {...guide} />
            <path d="M67 52v72q49 36 98 0V52" {...(detail ? ink : guide)} />
            {detail && <ellipse cx="116" cy="52" rx="49" ry="17" />}
            {finish && (
              <>
                <path d="M165 72c53-9 54 50 0 48" />
                <path d="M78 69v51" stroke="#e9a7be" />
              </>
            )}
          </>
        )}
        {topic === "rostos" && (
          <>
            <ellipse cx="120" cy="78" rx="48" ry="57" {...guide} />
            <path d="M120 21v130M73 75h94" {...guide} />
            {detail && (
              <>
                <path d="M76 64q-6 56 44 84q50-28 44-84" />
                <path d="M87 79q11-10 21 0M132 79q11-10 21 0M119 85l-6 20h12" />
              </>
            )}
            {finish && (
              <>
                <path d="M105 120q15 8 30 0M76 54q44-40 88 0M93 145v17m54-17v17" />
                <circle cx="99" cy="80" r="3" fill="#e9a7be" />
                <circle cx="143" cy="80" r="3" fill="#e9a7be" />
              </>
            )}
          </>
        )}
        {topic === "olhos" && (
          <>
            <circle cx="120" cy="86" r="56" {...guide} />
            <path d="M60 86h120M120 25v122" {...guide} />
            {detail && (
              <>
                <path d="M48 88q72-72 144 0q-72 64-144 0Z" />
                <ellipse
                  cx="120"
                  cy="85"
                  rx="24"
                  ry="42"
                  clipPath={`url(#${id}-eye)`}
                />
              </>
            )}
            {finish && (
              <>
                <circle cx="120" cy="85" r="11" fill="#e9a7be" />
                <path d="M58 65l-12-13m32-2-8-15m95 28 13-15M63 112q58 40 114 0" />
                <circle cx="129" cy="74" r="5" fill="#fff4df" stroke="none" />
              </>
            )}
          </>
        )}
        {topic === "cabelos" && (
          <>
            <ellipse cx="121" cy="88" rx="41" ry="54" {...guide} />
            {detail && (
              <path d="M63 144Q44 35 116 22q85-7 63 128l-31-15q21-65-32-87q-27 27-25 97Z" />
            )}
            {finish && (
              <>
                <path
                  d="M108 34q-49 36-29 96M125 37q42 38 38 91M93 76q8-30 24-28"
                  stroke="#e9a7be"
                />
                <path d="M101 128q20 20 39-1" />
              </>
            )}
          </>
        )}
        {topic === "maos" && (
          <>
            <path d="M83 91l66-6 9 64-70 5Z" {...guide} />
            <path d="M83 91q27-20 64-6" {...guide} />
            {detail && (
              <>
                <path d="M88 145L73 93V58q9-13 15 0l5 26V34q10-15 17 0v47-58q11-12 17 0v59-46q11-11 16 2l4 67 16-25q13-9 17 4l-18 49-17 21" />
                <path d="M89 153v15m54-14v14" />
              </>
            )}
            {finish && (
              <path
                d="M84 65h5m8-13h9m12-12h9m8 14h10M97 111l35-3M102 136l29-3"
                stroke="#e9a7be"
              />
            )}
          </>
        )}
        {["anatomia", "poses"].includes(topic) && (
          <>
            <path d="M120 22q-38 54 6 127" {...guide} />
            <circle cx="119" cy="30" r="17" {...(detail ? ink : guide)} />
            <ellipse
              cx="112"
              cy="77"
              rx="29"
              ry="32"
              transform="rotate(-15 112 77)"
              {...(detail ? ink : guide)}
            />
            <path d="M100 106l41-6 3 25-35 9Z" {...(detail ? ink : guide)} />
            {detail && (
              <path
                d={
                  topic === "poses"
                    ? "M86 66L57 88 31 65M140 62l30-30 27 5M110 132l-25 19-32 2M137 127l28 9 7 29"
                    : "M86 66L70 104 76 139M140 62l19 43-8 36M110 132l-8 36M137 127l11 41"
                }
              />
            )}
            {finish && (
              <>
                <path d="M42 171h145" stroke="#e9a7be" />
                <circle cx="110" cy="128" r="5" fill="#e9a7be" />
              </>
            )}
          </>
        )}
        {topic === "perspectiva" && (
          <>
            <path
              d="M15 45h210M32 128L204 45M32 84L204 45M96 154L204 45M96 110L204 45"
              {...guide}
            />
            <circle cx="204" cy="45" r="4" fill="#e9a7be" />
            {detail && (
              <path d="M32 84h64v70H32Zm64 0 61-22v61l-61 31M32 84l77-30 48 8" />
            )}
            {finish && (
              <path d="M97 110l60-24v37l-60 31Z" fill="#80556f" stroke="none" />
            )}
          </>
        )}
        {topic === "luz" && (
          <>
            <circle cx="39" cy="31" r="10" fill="#ffe5c6" />
            <path d="M53 40l22 18M56 26l22 2M37 47v19" stroke="#e9a7be" />
            <circle cx="117" cy="91" r="48" {...(detail ? ink : guide)} />
            {detail && (
              <path
                d="M117 43q-16 62 33 82q37-24 10-66q-15-15-43-16Z"
                fill="#80556f"
                stroke="none"
              />
            )}
            {finish && (
              <>
                <ellipse
                  cx="144"
                  cy="144"
                  rx="61"
                  ry="12"
                  fill="#171421"
                  stroke="none"
                />
                <path d="M81 90q-3-24 19-32" />
              </>
            )}
          </>
        )}
        {topic === "cores" && (
          <>
            <rect
              x="28"
              y="39"
              width="110"
              height="105"
              rx="10"
              fill="#785184"
              stroke="none"
            />
            {detail && (
              <rect
                x="148"
                y="39"
                width="58"
                height="105"
                rx="10"
                fill="#e9a7be"
                stroke="none"
              />
            )}
            {finish && (
              <>
                <circle cx="123" cy="107" r="21" fill="#ffd59c" stroke="none" />
                <path d="M38 156h90m25 0h40" stroke="#e9a7be" />
              </>
            )}
          </>
        )}
        {topic === "roupas" && (
          <>
            <ellipse cx="120" cy="92" rx="36" ry="49" {...guide} />
            <path d="M80 53l40-14 40 14M95 43v102m50-102v102" {...guide} />
            {detail && (
              <path d="M101 39l-29 12-31 48 24 13 17-25-9 61h94l-10-61 18 25 24-13-31-48-29-12q-18 27-38 0Z" />
            )}
            {finish && (
              <path
                d="M83 72l20 19M158 72l-19 19M96 126l-9 16m55-16 12 17M107 54l6 23"
                stroke="#e9a7be"
              />
            )}
          </>
        )}
        {topic === "animais" && (
          <>
            <ellipse cx="132" cy="108" rx="55" ry="37" {...guide} />
            <circle cx="83" cy="64" r="30" {...guide} />
            {detail && (
              <>
                <path d="M58 45l-7-27 27 22M89 38l23-20-2 35M57 55q-18 45 25 40q-15 27-6 48h90q27-42-10-62M183 109q42 4 29-31" />
                <path d="M99 116v26m38-26v26" />
              </>
            )}
            {finish && (
              <>
                <path
                  d="M63 66l9-3m17 0 9 3M79 76l5 4 5-4M60 80l-17-3m52 3 17-3"
                  stroke="#e9a7be"
                />
              </>
            )}
          </>
        )}
        {topic === "cenarios" && (
          <>
            <path d="M20 54h200M20 101h200" {...guide} />
            <path
              d="M17 106l49-65 47 59 39-79 70 85"
              {...(detail ? ink : guide)}
            />
            {detail && <path d="M16 137q65-74 115-19q50-48 92 4" />}
            {finish && (
              <>
                <path d="M15 163q65-53 112-5l96-5" fill="#80556f" />
                <path
                  d="M45 154v-50m-17 33 17-33 18 33M190 151v-68m-24 45 24-45 24 45"
                  stroke="#e9a7be"
                />
              </>
            )}
          </>
        )}
        {topic === "digital" && (
          <>
            <path d="M120 110l77 30-77 30-77-30Z" {...guide} />
            {detail && <path d="M120 75l77 30-77 30-77-30Z" fill="#80556f" />}
            {finish && (
              <>
                <path d="M120 40l77 30-77 30-77-30Z" fill="#e9a7be" />
                <path d="M119 51l20 19-20 18-20-18Z" stroke="#322339" />
                <path d="M211 59v100m-6-7 6 7 6-7" />
              </>
            )}
          </>
        )}
      </g>
      {step === 4 && (
        <g>
          <circle cx="211" cy="23" r="10" fill="#ffe5c6" />
          <path
            d="M199 35l-23 26m28-22-11 32"
            stroke="#e9a7be"
            strokeDasharray="3 3"
          />
          <rect x="15" y="135" width="17" height="17" fill="#ffe5c6" />
          <rect x="35" y="135" width="17" height="17" fill="#80556f" />
          <rect x="55" y="135" width="17" height="17" fill="#24162c" />
        </g>
      )}
      {step === 5 && (
        <g>
          <circle cx="200" cy="22" r="8" fill="#e9a7be" />
          <circle cx="218" cy="22" r="8" fill="#eaa080" />
          <circle cx="182" cy="22" r="8" fill="#ffe5c6" />
          <path d="m25 17 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#eaa080" />
        </g>
      )}
      <text x="18" y="170" fill="#d8bfd3" fontSize="10">
        {step === 1
          ? "1 · Formas e eixos"
          : step === 2
            ? "2 · Volumes e contorno"
            : step === 4
              ? "4 · Luz e valores"
              : step === 5
                ? "5 · Paleta e interpretação"
                : "3 · Detalhes e conferência"}
      </text>
    </svg>
  );
}

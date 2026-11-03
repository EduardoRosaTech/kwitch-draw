import { writeFile } from "node:fs/promises";
import { extraSubjects } from "./content-subjects.mjs";

// 60 distinct subjects, each with a different exercise at three difficulty levels.
const themes = [
  [
    "Personagens",
    [
      [
        "Guardião do lápis",
        "uma pessoa guardiã que carrega um lápis maior que seu corpo",
        "o peso do lápis e o equilíbrio da pose",
      ],
      [
        "Aprendiz distraído",
        "uma pessoa aprendiz que perdeu seu feitiço dentro do bolso",
        "a expressão de surpresa e o gesto de procurar",
      ],
      [
        "Explorador das nuvens",
        "uma pessoa exploradora usando botas de nuvem",
        "roupas leves e uma postura curiosa",
      ],
      [
        "Chef de poções",
        "uma pessoa cozinheira que mistura ingredientes mágicos",
        "as mãos trabalhando e o avental manchado",
      ],
      [
        "Músico da floresta",
        "uma pessoa musicista tocando um instrumento de folhas",
        "o ritmo do corpo e a forma do instrumento",
      ],
      [
        "Bibliotecário lunar",
        "uma pessoa bibliotecária carregando livros flutuantes",
        "o olhar atento e a organização dos livros",
      ],
      [
        "Mensageiro dos sonhos",
        "uma pessoa mensageira com uma bolsa cheia de estrelas",
        "a pose de caminhada e a bolsa volumosa",
      ],
      [
        "Viajante do inverno",
        "uma pessoa viajante com um cachecol muito comprido",
        "as dobras do tecido e a sensação de frio",
      ],
      [
        "Inventor de asas",
        "uma pessoa inventora testando asas mecânicas",
        "as articulações das asas e uma expressão confiante",
      ],
      [
        "Retrato de coragem",
        "uma versão imaginária de você enfrentando um pequeno desafio",
        "uma expressão determinada e um acessório pessoal",
      ],
    ],
    [
      "Use círculos e retângulos para montar a figura. Faça uma pose frontal simples e escolha uma expressão. Priorize",
      "Faça três esboços de gesto e escolha uma pose em três quartos. Desenhe mãos simplificadas, roupas e duas expressões alternativas. Priorize",
      "Monte uma cena com a figura em movimento, um segundo elemento e uma fonte de luz. Trabalhe proporções, sobreposição e contraste de valores. Priorize",
    ],
  ],
  [
    "Animais",
    [
      [
        "Raposa do outono",
        "uma raposa enrolada numa cauda cheia de folhas",
        "a diferença entre o focinho fino e a cauda volumosa",
      ],
      [
        "Coruja carteiro",
        "uma coruja levando uma pequena carta",
        "a posição das asas e o bico segurando a carta",
      ],
      [
        "Coelho das estrelas",
        "um coelho com orelhas que lembram constelações",
        "o comprimento das orelhas e o corpo arredondado",
      ],
      [
        "Dragão de bolso",
        "um dragão pequeno descansando sobre uma mão",
        "a escala do animal em relação à mão",
      ],
      [
        "Sapo jardineiro",
        "um sapo cuidando de uma planta num vaso",
        "as patas e a expressão tranquila",
      ],
      [
        "Baleia das nuvens",
        "uma baleia que nada entre nuvens",
        "a curva do corpo e o movimento da cauda",
      ],
      [
        "Cavalo da névoa",
        "um cavalo com uma crina que se transforma em névoa",
        "as pernas e a direção da crina",
      ],
      [
        "Peixe lanterna",
        "um peixe cuja cauda ilumina a água",
        "a translucidez das barbatanas",
      ],
      [
        "Besouro joia",
        "um besouro com uma carapaça de pedra preciosa",
        "a simetria das patas e os planos da carapaça",
      ],
      [
        "Capivara do chá",
        "uma capivara descansando ao lado de uma chaleira",
        "o focinho largo e a postura relaxada",
      ],
    ],
    [
      "Observe uma referência real da espécie. Separe cabeça, corpo e patas em formas simples; desenhe uma silhueta legível. Observe",
      "Estude uma referência real e faça três poses. Escolha uma para desenhar volume e textura com traços direcionais. Observe",
      "Desenhe o animal em movimento num ambiente coerente. Use uma referência anatômica, perspectiva e iluminação para integrar a criatura à cena. Observe",
    ],
  ],
  [
    "Natureza",
    [
      [
        "Samambaia espiral",
        "uma samambaia cujas folhas formam espirais",
        "a repetição e a variação das folhas",
      ],
      [
        "Cacto observador",
        "um cacto com pequenas flores que parecem olhos",
        "o volume do caule e a distribuição dos espinhos",
      ],
      [
        "Girassol noturno",
        "um girassol que acompanha a lua",
        "o miolo e a direção das pétalas",
      ],
      [
        "Árvore do vento",
        "uma árvore inclinada por uma brisa constante",
        "o gesto do tronco e a massa da copa",
      ],
      [
        "Pedras do rio",
        "um grupo de pedras molhadas na margem de um rio",
        "as bordas arredondadas e as marcas da água",
      ],
      [
        "Conchas de memória",
        "três conchas com padrões diferentes",
        "as curvas, nervuras e aberturas",
      ],
      [
        "Cristais subterrâneos",
        "um conjunto de cristais crescendo numa rocha",
        "os planos e ângulos dos cristais",
      ],
      [
        "Folha depois da chuva",
        "uma folha com gotas de chuva",
        "as nervuras e a forma das gotas",
      ],
      [
        "Galho de primavera",
        "um galho com botões e flores abertas",
        "os estágios de crescimento das flores",
      ],
      [
        "Jardim de musgo",
        "um pequeno jardim de musgo em volta de uma pedra",
        "a diferença entre superfície lisa e textura macia",
      ],
    ],
    [
      "Faça um estudo de contorno com três formas grandes. Acrescente apenas os detalhes que ajudam a reconhecer o elemento. Observe",
      "Desenhe o elemento em dois ângulos e escolha um para estudar textura, luz e sombra. Use três valores de cinza. Observe",
      "Crie uma composição botânica ou geológica com primeiro plano e fundo. Varie escala, luz e densidade de detalhes para criar profundidade. Observe",
    ],
  ],
  [
    "Objetos",
    [
      [
        "Bule das manhãs",
        "um bule com uma tampa em forma de sol",
        "a conexão entre alça, corpo e bico",
      ],
      [
        "Lanterna dos vaga-lumes",
        "uma lanterna que abriga vaga-lumes",
        "o vidro, a armação e os pontos luminosos",
      ],
      [
        "Mochila aventureira",
        "uma mochila preparada para uma viagem mágica",
        "as costuras, os bolsos e o volume",
      ],
      [
        "Relógio de marés",
        "um relógio que marca as marés em vez das horas",
        "os ponteiros e os símbolos do mostrador",
      ],
      [
        "Pão de estrelas",
        "um pão doce trançado com confeitos de estrelas",
        "a trança da massa e a crosta",
      ],
      [
        "Tigela de frutas",
        "uma tigela com três frutas de formas distintas",
        "as diferenças de proporção e textura",
      ],
      [
        "Sorvete de aurora",
        "um sorvete cujas camadas lembram uma aurora",
        "a espiral das camadas e o cone",
      ],
      [
        "Botas de viagem",
        "um par de botas com sinais de uma longa viagem",
        "as dobras, os cadarços e o desgaste",
      ],
      [
        "Câmera de lembranças",
        "uma câmera antiga que registra sonhos",
        "a lente circular e o corpo em caixa",
      ],
      [
        "Tesoura de fitas",
        "uma tesoura acompanhada por fitas enroladas",
        "a articulação da tesoura e as curvas das fitas",
      ],
    ],
    [
      "Construa o objeto com caixas, cilindros e círculos. Faça um desenho de contorno e uma sombra simples. Observe",
      "Desenhe o objeto em três quartos. Construa a perspectiva e separe dois materiais com textura ou valores. Observe",
      "Monte uma natureza-morta com o objeto e dois acessórios. Trabalhe elipses, reflexos, sombras projetadas e uma composição equilibrada. Observe",
    ],
  ],
  [
    "Cenários",
    [
      [
        "Cabana da chuva",
        "uma cabana com varanda protegida da chuva",
        "o telhado e a relação entre porta e janelas",
      ],
      [
        "Rua das lanternas",
        "uma rua estreita iluminada por lanternas",
        "a repetição das fachadas e das luzes",
      ],
      [
        "Farol da maré",
        "um farol numa ilha rochosa",
        "a altura da torre e a linha do horizonte",
      ],
      [
        "Quarto do artista",
        "um quarto com uma mesa de desenho",
        "o espaço de trabalho e os objetos pessoais",
      ],
      [
        "Estufa escondida",
        "uma estufa cercada por plantas altas",
        "os painéis de vidro e as folhas sobrepostas",
      ],
      [
        "Praça do relógio",
        "uma praça com uma torre de relógio",
        "a escala dos prédios e o espaço vazio",
      ],
      [
        "Ponte dos viajantes",
        "uma ponte de madeira sobre um riacho",
        "a direção das tábuas e os apoios",
      ],
      [
        "Livraria de esquina",
        "uma livraria com uma vitrine acolhedora",
        "a vitrine e a relação com a calçada",
      ],
      [
        "Montanha azul",
        "uma montanha vista por trás de um lago",
        "a separação entre água, terreno e céu",
      ],
      [
        "Estação das flores",
        "uma estação de trem com canteiros floridos",
        "a plataforma e as linhas dos trilhos",
      ],
    ],
    [
      "Reduza a paisagem a três massas: primeiro plano, assunto e fundo. Desenhe sem detalhes pequenos. Observe",
      "Planeje o cenário com uma linha de horizonte e um ponto de fuga. Acrescente uma figura para indicar escala e três valores de luz. Observe",
      "Faça três miniaturas de composição antes da cena final. Use perspectiva, profundidade atmosférica e uma iluminação definida para conduzir o olhar. Observe",
    ],
  ],
  [
    "Narrativa",
    [
      [
        "O presente inesperado",
        "um presente misterioso deixado diante de uma porta",
        "o contraste entre a embalagem e o lugar",
      ],
      [
        "Pegadas no ateliê",
        "pegadas pequenas atravessando uma mesa de desenho",
        "a sequência das pegadas e o objeto deslocado",
      ],
      [
        "Encontro na chuva",
        "duas criaturas dividindo um guarda-chuva",
        "os gestos de acolhimento",
      ],
      [
        "A semente luminosa",
        "uma semente brilhando na palma de uma mão",
        "a escala da semente e a atenção do observador",
      ],
      [
        "O livro que voou",
        "um livro escapando de uma estante",
        "a direção do voo e as páginas abertas",
      ],
      [
        "O lanche desaparecido",
        "um prato vazio e pistas de quem comeu o lanche",
        "as migalhas e as pistas visuais",
      ],
      [
        "Resgate de uma estrela",
        "uma estrela presa num galho esperando ajuda",
        "a distância entre quem ajuda e a estrela",
      ],
      [
        "O portal da gaveta",
        "uma gaveta aberta revelando outro mundo",
        "a diferença entre o exterior comum e o interior mágico",
      ],
      [
        "A última folha",
        "uma criatura protegendo a última folha de uma árvore",
        "o gesto de proteção e a fragilidade da folha",
      ],
      [
        "A festa dos pequenos",
        "pequenas criaturas preparando uma festa",
        "as tarefas de cada criatura e o centro da celebração",
      ],
    ],
    [
      "Conte a ideia em uma imagem com apenas dois elementos principais. Use tamanho e posição para deixar a ação clara. Destaque",
      "Desenhe dois quadros: antes e depois da ação. Mantenha os personagens reconhecíveis e mostre a mudança por gestos e objetos. Destaque",
      "Crie uma sequência de três quadros com começo, mudança e consequência. Varie enquadramentos e iluminação sem perder a continuidade. Destaque",
    ],
  ],
];
themes.forEach((theme, i) => theme[1].push(...extraSubjects[i]));
const levels = [
  ["iniciante", 5, 25, "Primeiros traços"],
  ["intermediário", 10, 40, "Estudo guiado"],
  ["avançado", 15, 60, "Composição final"],
];
const journeys = [
  [
    "formas",
    "Da forma ao desenho",
    "Aprenda a construir objetos usando formas simples.",
    "◯",
    "Objetos",
    [
      [
        "Círculos com intenção",
        "Desenhe oito círculos sem régua. Transforme quatro em frutos, botões ou pequenas luas.",
        0,
      ],
      [
        "Caixas que viram objetos",
        "Desenhe três caixas de tamanhos diferentes e transforme cada uma num objeto do ateliê.",
        0,
      ],
      [
        "Cilindros e elipses",
        "Desenhe uma caneca, um vaso e um tubo de lápis. Alinhe as elipses e indique o eixo de cada objeto.",
        1,
      ],
      [
        "Três valores",
        "Ilumine uma esfera, uma caixa e um cilindro com a mesma luz. Separe área clara, meia-luz e sombra.",
        1,
      ],
      [
        "Minha primeira natureza-morta",
        "Combine três objetos dos estudos anteriores numa composição. Construa os volumes antes de acrescentar detalhes.",
        2,
      ],
    ],
  ],
  [
    "expressoes",
    "Rostos que contam histórias",
    "Construa expressões e uma personagem própria.",
    "☺",
    "Personagens",
    [
      [
        "Mapa do rosto",
        "Desenhe três cabeças com uma linha central e uma linha dos olhos. Varie formatos sem detalhar cabelo.",
        0,
      ],
      [
        "Sobrancelhas falantes",
        "Desenhe o mesmo rosto com alegria, dúvida, raiva e surpresa. Observe como sobrancelhas e boca mudam.",
        0,
      ],
      [
        "Virando a cabeça",
        "Desenhe uma cabeça de frente, em perfil e em três quartos. Mantenha os traços reconhecíveis.",
        1,
      ],
      [
        "Expressão e gesto",
        "Escolha uma emoção e desenhe mãos e postura que reforcem a expressão do rosto.",
        1,
      ],
      [
        "Retrato com personalidade",
        "Crie um retrato com uma emoção clara, um acessório e luz lateral. Use seus estudos de rosto e gesto.",
        2,
      ],
    ],
  ],
  [
    "movimento",
    "Gestos em movimento",
    "Passe da linha de ação a uma pose expressiva.",
    "➰",
    "Personagens",
    [
      [
        "Linhas de ação",
        "Faça seis linhas curvas que indiquem caminhar, correr, saltar, descansar, alcançar e girar.",
        0,
      ],
      [
        "Corpos simplificados",
        "Adicione cabeça, tórax e quadril a três linhas de ação. Use formas simples para braços e pernas.",
        0,
      ],
      [
        "Peso e equilíbrio",
        "Desenhe uma figura carregando uma caixa e outra apoiada numa parede. Marque onde o peso se concentra.",
        1,
      ],
      [
        "Antes do salto",
        "Desenhe três poses: preparar, saltar e aterrissar. Mantenha a proporção da figura nas três poses.",
        1,
      ],
      [
        "Cena em ação",
        "Ilustre uma figura saltando sobre uma poça. Use linha de ação, sobreposição e sombras para sustentar o movimento.",
        2,
      ],
    ],
  ],
  [
    "perspectiva",
    "Portas da perspectiva",
    "Construa profundidade com horizontes e pontos de fuga.",
    "▱",
    "Cenários",
    [
      [
        "Perto e longe",
        "Desenhe três árvores parecidas em tamanhos diferentes. Sobreponha duas para indicar profundidade.",
        0,
      ],
      [
        "Linha do horizonte",
        "Desenhe um caminho que fica estreito ao se aproximar do horizonte. Acrescente postes seguindo a mesma direção.",
        0,
      ],
      [
        "Caixas em um ponto",
        "Marque um ponto de fuga e construa três caixas. Confira se as linhas de profundidade convergem.",
        1,
      ],
      [
        "Esquina em dois pontos",
        "Desenhe uma casa vista pela esquina usando dois pontos de fuga. Acrescente uma porta e duas janelas.",
        1,
      ],
      [
        "Meu ateliê em profundidade",
        "Desenhe um cômodo com mesa, estante e cadeira. Use um horizonte comum e relações coerentes de escala.",
        2,
      ],
    ],
  ],
  [
    "luz",
    "O feitiço da luz",
    "Explore volumes, materiais e atmosferas com luz e sombra.",
    "☀",
    "Objetos",
    [
      [
        "Claro e escuro",
        "Desenhe três silhuetas de objetos em preto sobre branco. Escolha a que fica mais reconhecível.",
        0,
      ],
      [
        "Sombra de uma esfera",
        "Desenhe uma esfera com luz de um lado. Indique a sombra no chão e preserve uma pequena área clara.",
        0,
      ],
      [
        "Mesmo objeto, duas luzes",
        "Desenhe uma caneca iluminada de frente e de lado. Compare onde aparecem as sombras.",
        1,
      ],
      [
        "Vidro e tecido",
        "Desenhe um frasco sobre um tecido. Diferencie reflexos duros do vidro e transições suaves do tecido.",
        1,
      ],
      [
        "Uma vela no ateliê",
        "Ilustre uma mesa iluminada por uma vela. Planeje as áreas mais claras e deixe o fundo menos detalhado.",
        2,
      ],
    ],
  ],
  [
    "composicao",
    "Histórias bem compostas",
    "Aprenda a escolher o foco e organizar sua imagem.",
    "▣",
    "Narrativa",
    [
      [
        "Um foco claro",
        "Desenhe uma estrela grande entre cinco círculos pequenos. Teste três posições para a estrela.",
        0,
      ],
      [
        "Espaço para respirar",
        "Desenhe um objeto pequeno numa página. Compare uma versão central e outra com bastante espaço de um lado.",
        0,
      ],
      [
        "Três miniaturas",
        "Crie três esboços pequenos de uma criatura encontrando uma chave. Varie o enquadramento sem mudar a história.",
        1,
      ],
      [
        "Caminho do olhar",
        "Escolha uma miniatura e use curvas, contraste e sobreposições para conduzir o olhar até a chave.",
        1,
      ],
      [
        "A descoberta",
        "Finalize a cena da criatura e da chave. Combine foco, profundidade e iluminação; simplifique detalhes que distraem.",
        2,
      ],
    ],
  ],
];
const q = (s) => `'${s.replaceAll("'", "''")}'`;
const rows = [];
let id = 1000;
for (const [category, subjects, instructions] of themes) {
  for (const [title, subject, detail] of subjects) {
    levels.forEach(([difficulty, minutes, xp, label], level) =>
      rows.push(
        `(${id++},${q(`${title} · ${label}`)},${q(`Imagine ${subject}. ${instructions[level]} ${detail}. Você pode desenhar no papel ou no digital; o objetivo é praticar, não acertar de primeira.`)},${q(category)},${q(difficulty)},${minutes},${xp},null,null)`,
      ),
    );
  }
}
const grimoireRows = [];
id = 2000;
for (const [gid, title, description, icon, category, steps] of journeys) {
  grimoireRows.push(`(${q(gid)},${q(title)},${q(description)},${q(icon)})`);
  steps.forEach(([name, prompt, l], step) => {
    const [difficulty, minutes, xp] = levels[l];
    rows.push(
      `(${id++},${q(name)},${q(prompt + " Pode ser feito no papel ou no digital.")},${q(category)},${q(difficulty)},${minutes},${xp},${q(gid)},${step + 1})`,
    );
  });
}
const sql = `-- Content pack: 378 standalone challenges + 30 journey steps. Safe to reapply.\nbegin;\ninsert into public.grimoires(id,title,description,icon) values\n${grimoireRows.join(",\n")} on conflict do nothing;\ninsert into public.challenges(id,title,prompt,category,difficulty,duration_minutes,xp,grimoire_id,step) values\n${rows.join(",\n")} on conflict do nothing;\ncommit;\n`;
await writeFile(
  new URL("../supabase/content-pack-001.sql", import.meta.url),
  sql,
);
console.log(
  `Content pack ready: ${rows.length} challenges, ${grimoireRows.length} grimoires.`,
);

import { writeFile } from "node:fs/promises";
// Original teaching text. Three levels per topic; diagrams are owned SVG components.
const topics = [
  [
    "fundamentos",
    "Fundamentos",
    [
      [
        "Linhas e formas",
        "Use formas grandes antes de detalhes.",
        "Trace linhas pelo movimento do braço, sem apertar o lápis.",
        "Construa uma xícara com uma elipse e um cilindro.",
        "Compare altura e largura antes de reforçar o contorno.",
        "Desenhe cinco objetos usando círculos, caixas e cilindros.",
      ],
      [
        "Volumes que giram",
        "Entenda objetos como volumes no espaço.",
        "Marque o eixo de um cilindro inclinado.",
        "Envolva o volume com elipses seguindo esse eixo.",
        "Apague linhas escondidas e confira se as elipses combinam.",
        "Desenhe uma xícara em três inclinações diferentes.",
      ],
      [
        "Construção e desenho livre",
        "Combine observação e construção.",
        "Observe a silhueta de um objeto sem nomear suas partes.",
        "Reconstrua a silhueta com volumes e compare os espaços vazios.",
        "Escolha quais linhas de construção manter para expressar peso.",
        "Desenhe uma chaleira de observação e depois de memória.",
      ],
    ],
  ],
  [
    "rostos",
    "Rostos",
    [
      [
        "O mapa do rosto",
        "Eixos ajudam a posicionar as partes do rosto.",
        "Comece com uma esfera e acrescente a mandíbula.",
        "Marque o centro e a linha dos olhos; ajuste à pessoa observada.",
        "Distribua nariz e boca, comparando os espaços entre eles.",
        "Faça três rostos frontais com formatos diferentes.",
      ],
      [
        "Rosto de perfil",
        "Pense no crânio como volume, mesmo de lado.",
        "Marque uma esfera, a orelha e a inclinação da mandíbula.",
        "Projete testa, nariz, lábios e queixo em uma silhueta.",
        "Confira o encaixe do pescoço sem colá-lo ao queixo.",
        "Desenhe três perfis variando nariz e mandíbula.",
      ],
      [
        "Rostos em três quartos",
        "As proporções mudam quando a cabeça gira.",
        "Faça os eixos curvarem sobre a esfera do crânio.",
        "Comprima o lado distante e observe a sobreposição do nariz.",
        "Compare as larguras dos olhos e as curvas da mandíbula.",
        "Desenhe o mesmo rosto de frente, perfil e três quartos.",
      ],
    ],
  ],
  [
    "olhos",
    "Olhos",
    [
      [
        "Um olho é uma esfera",
        "Construa o olho antes dos cílios.",
        "Imagine uma esfera encaixada na cavidade do rosto.",
        "Envolva a esfera com as pálpebras; elas têm espessura.",
        "A íris fica parcialmente coberta: evite um círculo flutuante.",
        "Desenhe cinco olhos simples olhando em direções diferentes.",
      ],
      [
        "Olhos em ângulos",
        "A esfera continua existindo quando o olhar gira.",
        "Marque o eixo do olhar sobre a esfera.",
        "Transforme a íris em elipse ao afastá-la do centro.",
        "Ajuste a abertura das pálpebras e a sombra sob a superior.",
        "Faça cinco olhos vistos de cima, baixo e lado.",
      ],
      [
        "Expressão pelo olhar",
        "Sobrancelhas e pálpebras trabalham juntas.",
        "Mantenha o volume da esfera em três expressões.",
        "Varie a tensão das pálpebras e o arco das sobrancelhas.",
        "Use poucos detalhes para que a expressão continue legível.",
        "Crie alegria, desconfiança e cansaço no mesmo par de olhos.",
      ],
    ],
  ],
  [
    "cabelos",
    "Cabelos",
    [
      [
        "Cabelo em massas",
        "Desenhe grupos de cabelo antes de fios.",
        "Reserve um espaço entre crânio e silhueta do cabelo.",
        "Divida o cabelo em três grandes mechas com direção.",
        "Use poucas linhas internas acompanhando as mechas.",
        "Crie três penteados com apenas cinco grandes mechas cada.",
      ],
      [
        "Volume e brilho",
        "O brilho acompanha a curvatura da mecha.",
        "Escolha a origem das mechas e o sentido da queda.",
        "Separe planos claros e escuros em grupos grandes.",
        "Deixe o brilho atravessar algumas mechas sem contornar cada fio.",
        "Desenhe um cabelo ondulado usando três valores de cinza.",
      ],
      [
        "Cabelo em movimento",
        "Ritmo e gravidade organizam mechas complexas.",
        "Marque o movimento principal provocado pelo vento ou pela pose.",
        "Combine mechas grandes com pequenas sem repetir intervalos iguais.",
        "Interrompa algumas linhas e varie as bordas para sugerir textura.",
        "Desenhe um penteado cacheado parado e depois ao vento.",
      ],
    ],
  ],
  [
    "maos",
    "Mãos",
    [
      [
        "Palma e dedos simples",
        "Simplifique a palma como caixa e dedos como cilindros.",
        "Marque a caixa da palma com largura e inclinação.",
        "Distribua quatro dedos em arco e encaixe o polegar de lado.",
        "Divida os dedos em segmentos e observe suas diferenças.",
        "Desenhe cinco mãos abertas usando caixas e cilindros.",
      ],
      [
        "Mãos segurando objetos",
        "Comece pelo objeto e pelo gesto da palma.",
        "Desenhe o cilindro ou caixa que será segurado.",
        "Envolva o objeto com os dedos, marcando sobreposições.",
        "Confira o polegar em oposição e os pontos de contato.",
        "Desenhe uma mão segurando uma caneca, um lápis e uma esfera.",
      ],
      [
        "Mãos em escorço",
        "Sobreposições explicam dedos apontando para você.",
        "Oriente a caixa da palma em direção ao observador.",
        "Desenhe segmentos próximos maiores e esconda partes distantes.",
        "Observe espaços negativos entre dedos e evite comprimentos iguais.",
        "Desenhe três mãos em escorço usando sua mão como referência.",
      ],
    ],
  ],
  [
    "anatomia",
    "Anatomia",
    [
      [
        "Tronco como volumes",
        "Caixa torácica e pelve formam a base do corpo.",
        "Use um oval para a caixa torácica e uma caixa para a pelve.",
        "Ligue os volumes com uma coluna curva, sem detalhar músculos.",
        "Adicione membros como cilindros e confira as proporções.",
        "Faça cinco manequins simples em pé com corpos variados.",
      ],
      [
        "Torção do tronco",
        "Ombros e quadris podem apontar em direções diferentes.",
        "Marque os eixos da caixa torácica e da pelve.",
        "Ligue os volumes preservando espaço para o abdômen.",
        "Use sobreposições para mostrar qual lado está mais próximo.",
        "Desenhe três troncos com torções suaves a partir de referências.",
      ],
      [
        "Anatomia que serve ao gesto",
        "Escolha estruturas que tornam a ação clara.",
        "Identifique apoios ósseos como clavícula, cotovelo e joelho.",
        "Organize massas musculares sobre os volumes principais.",
        "Simplifique detalhes que competem com a silhueta e o movimento.",
        "Estude uma pose de referência com estrutura e massas principais.",
      ],
    ],
  ],
  [
    "poses",
    "Poses",
    [
      [
        "Linha de ação",
        "Um gesto claro começa com uma direção principal.",
        "Trace uma curva que reúna o movimento da cabeça ao apoio.",
        "Posicione tronco e pelve sobre a curva.",
        "Acrescente membros e veja se a silhueta comunica a ação.",
        "Faça seis gestos de 30 segundos com poses diferentes.",
      ],
      [
        "Equilíbrio e peso",
        "O corpo precisa de apoio para parecer estável.",
        "Marque os pontos de contato com o chão.",
        "Compare a posição do tronco com a área entre os apoios.",
        "Incline ombros e quadris para mostrar onde o peso se concentra.",
        "Desenhe uma pessoa apoiada em duas pernas e depois em uma.",
      ],
      [
        "Ação com profundidade",
        "Gesto e perspectiva podem trabalhar juntos.",
        "Escolha uma linha de ação que avance ou recue no espaço.",
        "Sobreponha tronco, braços e pernas com volumes simples.",
        "Exagere o gesto com cuidado, mantendo apoios e articulações.",
        "Desenhe um personagem saltando em direção ao observador.",
      ],
    ],
  ],
  [
    "perspectiva",
    "Perspectiva",
    [
      [
        "Caixas no espaço",
        "Linhas paralelas parecem convergir à distância.",
        "Marque a linha do horizonte e um ponto de fuga.",
        "Ligue os cantos da face frontal a esse ponto.",
        "Feche a caixa e diferencie as faces por valores.",
        "Desenhe cinco caixas usando um ponto de fuga.",
      ],
      [
        "Dois pontos de fuga",
        "Use duas direções para desenhar cantos de objetos.",
        "Marque dois pontos bem afastados no horizonte.",
        "Ligue a aresta vertical a ambos os pontos.",
        "Repita a lógica nos móveis de um pequeno ambiente.",
        "Desenhe uma mesa e duas caixas em perspectiva de dois pontos.",
      ],
      [
        "Perspectiva com observação",
        "A construção deve servir ao ambiente observado.",
        "Identifique altura do olhar e famílias de linhas paralelas.",
        "Compare a diminuição dos objetos e suas sobreposições.",
        "Ajuste pequenas irregularidades para evitar um cenário rígido.",
        "Desenhe um canto de quarto com móveis em orientações diferentes.",
      ],
    ],
  ],
  [
    "luz",
    "Luz e sombra",
    [
      [
        "Três valores bastam",
        "Separe luz, meio-tom e sombra.",
        "Escolha uma única direção para a luz.",
        "Agrupe a sombra do objeto sem desenhar detalhes nela.",
        "Acrescente a sombra projetada respeitando o chão.",
        "Desenhe esfera, cubo e cilindro com três valores de cinza.",
      ],
      [
        "Sombras que descrevem forma",
        "A passagem de luz ajuda a mostrar a curvatura.",
        "Marque a fronteira entre o lado iluminado e o escuro.",
        "Suavize a passagem em superfícies curvas e endureça em arestas.",
        "Mantenha luz refletida mais escura que a luz principal.",
        "Ilumine uma esfera e um cubo com a mesma fonte de luz.",
      ],
      [
        "Hierarquia da iluminação",
        "Contraste pode guiar o olhar pela cena.",
        "Escolha o foco e planeje grandes massas claras e escuras.",
        "Reserve o maior contraste para esse foco.",
        "Controle bordas e detalhes nas áreas secundárias.",
        "Faça duas miniaturas da mesma cena com focos de luz diferentes.",
      ],
    ],
  ],
  [
    "cores",
    "Cores",
    [
      [
        "Uma paleta de três cores",
        "Poucas cores facilitam decisões.",
        "Escolha uma cor dominante e uma de apoio.",
        "Use a terceira em pequenas áreas de destaque.",
        "Confira se as formas continuam legíveis em tons de cinza.",
        "Pinte um objeto com três cores e repita trocando a dominante.",
      ],
      [
        "Temperatura e ambiente",
        "Cores se influenciam quando ficam próximas.",
        "Escolha um ambiente predominantemente quente ou frio.",
        "Experimente uma cor de contraste perto do ponto focal.",
        "Compare a mesma cor em dois fundos antes de ajustá-la.",
        "Faça versões quente e fria de uma pequena paisagem.",
      ],
      [
        "Cor com intenção",
        "Saturação e valor também contam a história.",
        "Planeje a emoção da cena antes de escolher a paleta.",
        "Concentre cores saturadas em áreas importantes.",
        "Ajuste os valores para que a composição funcione sem cor.",
        "Crie duas paletas para uma cena: acolhimento e mistério.",
      ],
    ],
  ],
  [
    "roupas",
    "Roupas",
    [
      [
        "Tecido sobre o corpo",
        "A roupa acompanha volumes e pontos de apoio.",
        "Construa o corpo simplificado antes da roupa.",
        "Marque onde o tecido prende ou encosta.",
        "Puxe algumas dobras desses pontos sem encher tudo de linhas.",
        "Desenhe uma camiseta sobre três troncos simples.",
      ],
      [
        "Dobras e tensão",
        "Direções de força organizam as dobras.",
        "Localize pontos de compressão e de estiramento.",
        "Faça dobras nascerem desses pontos com ritmos variados.",
        "Separe tecidos leves e pesados pela largura das curvas.",
        "Compare uma manga dobrada e uma manga esticada.",
      ],
      [
        "Materiais e silhueta",
        "Textura e corte mudam a leitura da roupa.",
        "Defina uma silhueta clara antes dos detalhes.",
        "Use bordas e sombras para sugerir tecido rígido ou macio.",
        "Reserve padrões e acessórios para áreas que ajudam o desenho.",
        "Crie a mesma capa em seda, lã e couro usando referência.",
      ],
    ],
  ],
  [
    "animais",
    "Animais",
    [
      [
        "Animais em formas simples",
        "Comece pelas massas grandes do animal.",
        "Use dois ovais para cabeça e corpo.",
        "Ligue as massas e posicione patas pelo gesto.",
        "Acrescente orelhas e cauda conferindo a silhueta.",
        "Desenhe gato, coelho e coruja com círculos e ovais.",
      ],
      [
        "Estrutura animal",
        "Observe articulações antes de desenhar o pelo.",
        "Marque caixa torácica, pelve e linha da coluna.",
        "Compare as dobras das patas com uma referência real.",
        "Ajuste o tamanho da cabeça e os espaços entre as patas.",
        "Desenhe um gato sentado e andando a partir de referências.",
      ],
      [
        "Criaturas convincentes",
        "Uma criatura fantástica precisa de lógica própria.",
        "Escolha dois animais reais e estude suas estruturas.",
        "Combine as partes mantendo encaixes e apoios coerentes.",
        "Defina textura e expressão depois de resolver a silhueta.",
        "Crie um familiar misturando coruja e raposa, em duas poses.",
      ],
    ],
  ],
  [
    "cenarios",
    "Cenários",
    [
      [
        "Planos de uma paisagem",
        "Sobreposição separa perto, meio e longe.",
        "Divida a imagem em primeiro plano, meio e fundo.",
        "Sobreponha formas para deixar clara a distância.",
        "Reduza detalhes no fundo e destaque uma área principal.",
        "Faça três paisagens pequenas usando apenas três planos.",
      ],
      [
        "Escala e profundidade",
        "Tamanho e contraste reforçam a distância.",
        "Escolha um elemento conhecido para indicar escala.",
        "Diminua elementos repetidos quando se afastam.",
        "Use menos contraste e detalhes nas áreas distantes.",
        "Desenhe um caminho entre árvores mostrando profundidade.",
      ],
      [
        "Cenário que conta história",
        "Organize sinais visuais em torno de uma ideia.",
        "Escolha o acontecimento que a cena precisa sugerir.",
        "Distribua objetos e caminhos para conduzir o olhar.",
        "Confira a leitura em miniatura e reduza detalhes concorrentes.",
        "Ilustre um ateliê abandonado com três pistas sobre seu dono.",
      ],
    ],
  ],
  [
    "digital",
    "Desenho digital",
    [
      [
        "Camadas com propósito",
        "Separe rascunho, desenho e cor.",
        "Crie uma camada para um rascunho leve.",
        "Faça o contorno em outra camada com opacidade independente.",
        "Ponha a cor abaixo e teste ocultar cada camada.",
        "Desenhe uma caneca em três camadas nomeadas.",
      ],
      [
        "Pincel e bordas",
        "Poucos pincéis bem usados são suficientes.",
        "Teste um pincel simples variando pressão e tamanho.",
        "Escolha bordas duras para foco e suaves para transições.",
        "Use máscaras quando disponíveis para experimentar sem apagar.",
        "Pinte uma esfera e uma caixa com um único pincel.",
      ],
      [
        "Fluxo de estudo digital",
        "Ferramentas ajudam quando as decisões estão claras.",
        "Planeje valores numa miniatura antes de ampliar.",
        "Separe ajustes de cor e mantenha uma versão anterior.",
        "Exporte uma cópia e confira a imagem em tamanho pequeno.",
        "Crie uma pequena cena passando por miniatura, valores e cor.",
      ],
    ],
  ],
];
const quick = [
  [
    "erros-olhos",
    "3 erros ao desenhar olhos",
    "olhos",
    "Evite íris flutuante, pálpebra sem espessura e cílios iguais.",
    [
      "Encaixe a íris",
      "Cubra parte da íris com a pálpebra superior.",
      "Dê espessura",
      "Mostre uma pequena borda na pálpebra inferior.",
      "Agrupe cílios",
      "Varie comprimento e direção, sem cercar o olho.",
    ],
    "Compare dois olhos: um plano e outro construído sobre uma esfera.",
  ],
  [
    "volume-cabelo",
    "Volume sem desenhar cada fio",
    "cabelos",
    "Organize o cabelo em massas e deixe espaço sobre o crânio.",
    [
      "Reserve espaço",
      "O cabelo tem volume além do contorno do crânio.",
      "Agrupe mechas",
      "Desenhe três grupos com direções diferentes.",
      "Economize fios",
      "Use só algumas linhas que acompanham as curvas.",
    ],
    "Desenhe um penteado usando três massas e seis linhas internas.",
  ],
  [
    "rosto-alinhado",
    "Como conferir um rosto torto",
    "rostos",
    "Compare os eixos antes de corrigir cada detalhe.",
    [
      "Marque o centro",
      "Trace um eixo que acompanhe a orientação da cabeça.",
      "Compare alturas",
      "Use uma linha dos olhos e compare os dois lados.",
      "Confira espaços",
      "Observe as distâncias do nariz, boca e mandíbula.",
    ],
    "Faça um rosto e confira suas proporções usando dois eixos.",
  ],
  [
    "maos-simples",
    "Mãos em caixas e cilindros",
    "maos",
    "Resolva o gesto da palma antes de desenhar unhas.",
    [
      "Caixa da palma",
      "Marque largura, altura e inclinação.",
      "Arco dos dedos",
      "Os dedos têm comprimentos diferentes e nascem em arco.",
      "Polegar de lado",
      "Encaixe o polegar pela lateral da palma.",
    ],
    "Desenhe três mãos abertas sem unhas nem detalhes de pele.",
  ],
  [
    "paleta-curta",
    "Escolha cores sem se perder",
    "cores",
    "Uma dominante, uma de apoio e uma de destaque bastam.",
    [
      "Escolha a dominante",
      "Cubra a maior área com uma cor principal.",
      "Apoie a composição",
      "Use uma segunda cor em áreas menores.",
      "Guarde o destaque",
      "Reserve a cor mais chamativa para o foco.",
    ],
    "Faça três miniaturas da mesma caneca mudando a cor dominante.",
  ],
];
const q = (v) => `'${String(v).replaceAll("'", "''")}'`;
const challengeRows = [],
  lessonRows = [],
  stepRows = [];
let index = 0;
function add(
  id,
  title,
  key,
  label,
  difficulty,
  format,
  summary,
  minLevel,
  seconds,
  steps,
  exercise,
  minutes,
  xp,
) {
  const challengeId = 3000 + index;
  challengeRows.push(
    `(${challengeId},${q("Prática: " + title)},${q(exercise)},${q(label)},${q(difficulty)},${minutes},${xp},'academy')`,
  );
  lessonRows.push(
    `(${q(id)},${q(title)},${q(label)},${q(difficulty)},${q(format)},${q(summary)},${minLevel},${seconds},${index},${challengeId})`,
  );
  steps.forEach((s, i) =>
    stepRows.push(`(${q(id)},${i + 1},${q(s[0])},${q(s[1])},${q(key)})`),
  );
  index++;
}
for (const [key, label, levels] of topics)
  levels.forEach((v, i) =>
    add(
      `${key}-${["iniciante", "intermediario", "avancado"][i]}`,
      v[0],
      key,
      label,
      ["iniciante", "intermediário", "avançado"][i],
      "lesson",
      v[1],
      [1, 3, 6][i],
      [90, 120, 150][i],
      v
        .slice(2, 5)
        .map((explanation, j) => [
          ["Construir", "Organizar", "Conferir"][j],
          explanation,
        ]),
      v[5],
      [5, 10, 15][i],
      [30, 45, 65][i],
    ),
  );
for (const [id, title, key, summary, steps, exercise] of quick)
  add(
    id,
    title,
    key,
    topics.find((t) => t[0] === key)[1],
    "iniciante",
    "quick_tip",
    summary,
    1,
    45,
    [
      [steps[0], steps[1]],
      [steps[2], steps[3]],
      [steps[4], steps[5]],
    ],
    exercise,
    3,
    15,
  );
const mappings = {
  Personagens: ["rostos", "poses"],
  Animais: ["animais", "fundamentos"],
  Natureza: ["fundamentos", "cores"],
  Objetos: ["fundamentos", "luz"],
  Cenários: ["perspectiva", "cenarios"],
  Narrativa: ["poses", "cores"],
};
let sql = `-- Original academy content: 42 lessons + 5 quick tips. Safe to reapply.\nbegin;\ninsert into public.challenges(id,title,prompt,category,difficulty,duration_minutes,xp,channel) values\n${challengeRows.join(",\n")} on conflict do nothing;\ninsert into public.lessons(id,title,category,difficulty,format,summary,min_level,reading_seconds,sort_order,practice_challenge_id) values\n${lessonRows.join(",\n")} on conflict do nothing;\ninsert into public.lesson_steps(lesson_id,step,title,explanation,diagram_key) values\n${stepRows.join(",\n")} on conflict do nothing;\n`;
for (const [category, keys] of Object.entries(mappings))
  keys.forEach(
    (key, i) =>
      (sql += `insert into public.challenge_lessons(challenge_id,lesson_id,priority) select id,${q(key + "-iniciante")},${i + 1} from public.challenges where channel in ('standard','journey') and category=${q(category)} on conflict do nothing;\n`),
  );
sql += `insert into public.achievements(id,title,description,icon,required_count,required_practice_count) values\n('academy-first','Primeiro estudo','Conclua a prática de uma dica.','✎',1,1),\n('academy-five','Caderno de estudos','Pratique cinco dicas diferentes.','▤',5,5),\n('academy-fourteen','Magia do aprendizado','Pratique quatorze dicas diferentes.','✦',14,14) on conflict do nothing;\nnotify pgrst,'reload schema';\ncommit;\n`;
await writeFile(
  new URL("../supabase/academy-content-001.sql", import.meta.url),
  sql,
);
console.log(
  `${index} lessons and practices, ${stepRows.length} illustrated steps generated.`,
);

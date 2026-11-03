# Kwitch Draw: jogo de aprendizado e prática artística

Proposta de evolução — 6 de outubro de 2026. As etapas futuras deste documento não estão implementadas apenas por constarem aqui.

## Direção

O ciclo principal será **Aprender → Praticar → Receber XP validado → Evoluir → Desbloquear cosméticos → Aprender novamente**. O avatar cria vínculo com o ateliê; a prática é a fonte de progresso. Ler uma dica, sortear um familiar ou trocar uma peça não concede XP.

A base atual já oferece autenticação individual, RLS, cronômetro, conclusão no backend, XP, nível, streak, grimórios, conquistas e desenhos privados. Ela continua sendo o núcleo: não devemos criar um segundo sistema de XP para a Academia.

## Etapas de entrega

| Funcionalidade | Agora / MVP | Próxima versão | Posterior |
| --- | --- | --- | --- |
| Níveis | Curva crescente, sem apagar XP; barra correta | Balancear usando uso real | Temporadas opcionais, sem apagar histórico |
| Familiar | Gato, sapo, coruja, raposa, corvo e coelho; nome, história, cor, amuleto, sorteio e prévia | Chapéus/olhos/pelos por camadas e primeiros desbloqueios | Mini-dragão, planta, fantasma, fogo e criatura lunar |
| Personagem humano | Definir formato dos componentes e composição | Criador simples de corpo, rosto, cabelo e roupa | Catálogo maior, poses e combinações especiais |
| Academia | Preparar modelo de conteúdo e ligação com desafios | Primeira coleção de aulas curtas ilustradas, filtros e prática | Trilhas completas e aprofundamento |
| Dica diária | Definir rotação a partir das aulas publicadas | Card na Home com abrir explicação e praticar | Preferências e recomendações pelo histórico |
| Truques rápidos | Mesmo formato de conteúdo, sem outro sistema | Coleção de 30–60 segundos | Exportação para vídeos, legendas e calendário social |
| Desbloqueios | Desenhar regras e autoridade do backend | Catálogo e RPC para equipar somente itens liberados | Coleções, novos requisitos e eventos |
| Reações | Preparar estados visuais | Alegria ao concluir, brilho ao subir, aviso de desbloqueio | Animações mais elaboradas respeitando movimento reduzido |

O familiar básico é uma personalização inicial, não o criador completo por camadas. Nesta primeira etapa todas as seis espécies iniciais e combinações básicas são livres. Criaturas especiais e cosméticos de progressão virão com validação de desbloqueio no backend.

## Estrutura preparada agora

1. `profiles` recebe o familiar básico e mantém RLS. A migration 004 altera a progressão e adiciona espécie, cor, amuleto, nome e descrição. Ela não cria tabelas vazias de aulas ou desbloqueios que a interface ainda não usa.
2. `lib/familiar.ts` centraliza escolhas e valores padrão; `app/familiar.tsx` desenha os SVGs próprios e a prévia. Futuras peças devem virar componentes, com a mesma caixa `viewBox` e pontos de encaixe padronizados.
3. `lib/progression.ts` acompanha a função de nível no PostgreSQL; testes verificam todos os limites. XP só pode ser creditado pelas funções autorizadas.
4. A modelagem abaixo é a especificação para a próxima migration. Publicar conteúdo didático e uma interface utilizável deve acompanhar essa migration; não basta criar tabelas para dizer que a Academia existe.

## Modelagem para Academia

| Estrutura | Campos principais | Função |
| --- | --- | --- |
| `lessons` | `id`, `slug` único, `title`, `category`, `difficulty`, `format` (`lesson`/`quick_tip`), `summary`, `reading_seconds`, `content_version`, `status`, `sort_order` | Catálogo didático; somente publicados aparecem aos participantes |
| `lesson_steps` | `lesson_id`, `step_number`, `heading`, `explanation`, `illustration_key`, `alt_text` | Etapas curtas e ilustrações próprias; par aula/etapa único |
| `lesson_exercises` | `lesson_id`, `challenge_id` único | Liga a aula a um exercício do mesmo catálogo que já valida tempo e recompensa |
| `user_lesson_progress` | `user_id`, `lesson_id`, `read_at`, `practice_completed_at` | Histórico pessoal; leitura é marcação sem XP, prática só é concluída pelo backend |
| `challenge_lessons` | `challenge_id`, `lesson_id`, `priority` | Recomenda uma ou mais aulas antes do desafio, sem obrigar leitura |

Categorias iniciais: fundamentos, rostos, olhos, cabelos, mãos, anatomia, poses, perspectiva, luz e sombra, cores, roupas, animais, cenários e desenho digital. Dificuldade do conteúdo (iniciante/intermediário/avançado) é distinta do nível acumulado da pessoa. Um usuário novo pode experimentar um desafio avançado.

Não salve texto arbitrário com HTML executável ou SVG fornecido por usuários. Use conteúdo editorial estruturado e `illustration_key` apontando para assets versionados no projeto. A descrição do familiar é texto e não vira código SVG. Desenhos enviados continuam no bucket privado.

### Exercícios com XP

Na próxima migration, adicione a origem `practice` aos rituais/conclusões e um campo de canal no catálogo (`standard`, `academy`, `journey`, `avatar`). Atualize **junto** os checks de tabelas, `start_challenge`, `control_run`, o sorteio, o diário e a interface. O diário/gerador normal seleciona apenas `standard`; não deve começar a mostrar exercícios de aula por acidente.

Ao clicar em Praticar esta dica, a interface solicita o `challenge_id` autorizado da aula. O backend valida a associação, inicia o cronômetro e concede o XP armazenado no banco após conclusão. Um exercício de 30 XP precisa existir com essa recompensa; não aceite `xp: 30` enviado pelo navegador.

Use `completions` como único registro da recompensa: nenhuma função paralela deve dar XP novamente porque a pessoa abriu a mesma prática pela aula, pelo gerador ou por uma jornada. Preserve o limite atual de cinco conclusões com XP por dia para todas as origens. Comece com uma prática recompensada por usuário/exercício/dia, deixando claro que repetir a leitura não recompensa. Se adotarmos recompensa só na primeira prática, a regra precisa existir no banco, não somente no botão.

`practice_completed_at` e marcos pedagógicos são atualizados após a conclusão no backend; o navegador só pode marcar leitura. Não transforme um simples checkbox em prova de habilidade ou crédito de XP.

### Dica do dia e truques

Para o MVP didático, escolha uma aula publicada por rotação determinística da data de São Paulo. Se o catálogo estiver vazio, esconda o card. A dica abre a própria aula e o mesmo botão de prática. Não há uma segunda cópia do conteúdo nem outra recompensa diária.

Truques rápidos usam `lessons.format='quick_tip'` e leitura prevista de 30–60 segundos. Comece com cinco: olhos, volume do cabelo, alinhamento do rosto, três valores de sombra e paleta de três cores. Reels/Shorts podem reutilizar esses textos e SVGs depois; publicação nas redes é outra etapa, sem automação de envio nesta implementação.

## Modelagem para avatar modular e desbloqueios

| Estrutura | Campos principais | Função |
| --- | --- | --- |
| `avatar_items` | `id`, `target` (`character`/`familiar`), `slot`, `species`, `asset_key`, `layer_order`, `color_channels`, `is_starter`, `status`, `version` | Peças versionadas; não uma imagem por combinação |
| `avatar_item_requirements` | `item_id`, `rule_group`, `rule_type`, `required_value`, `grimoire_id`, `achievement_id` | Regras explícitas: XP, nível, contagem, melhor streak, grimório ou conquista |
| `user_avatar_unlocks` | `user_id`, `item_id`, `unlocked_at`, `reason` | Desbloqueio permanente; par usuário/item único |
| `user_avatars` | `user_id`, `target`, `name`, `description`, `configuration_version`, `revision` | Identidade do personagem/familiar; um de cada por usuário |
| `user_avatar_equipment` | `user_id`, `target`, `slot`, `item_id`, `color_config` | Equipamento validado; uma peça por slot, cores permitidas e espécie compatível |

Slots iniciais: corpo, rosto, olhos, cabelo/pelo, roupa, chapéu, acessório e item mágico. Ordem de desenho: fundo/efeitos atrás → cauda/asas → corpo → roupa → rosto/olhos → cabelo/pelo → chapéu → acessório/item → efeitos à frente. Cabeça, mãos e pés precisam de âncoras de posição comuns. Uma mesma peça humana não deve ser aplicada automaticamente a todas as espécies de pet.

O catálogo deve especificar quais peças podem recolorir e quais combinações são compatíveis. Armazene IDs e cores permitidas, não SVG livre enviado pelo cliente. `configuration_version` permite migrar combinações antigas quando assets mudarem. Uma mudança de peça não precisa gerar PNG nem criar arquivo de Storage; SVG composto reduz consumo de armazenamento.

### Autoridade do backend

- Adicione `best_streak` no perfil antes de desbloqueios por sequência; inicialize com a melhor sequência de datas distintas do histórico de conclusões e atualize-o junto ao streak validado. Um item ganho por sete dias não some quando a sequência atual quebra.
- A conclusão chama uma única rotina idempotente de desbloqueio depois de atualizar XP, nível, streak, grimórios e conquistas. Insere apenas itens cujos requisitos foram satisfeitos.
- `equip_avatar` valida autenticação, catálogo publicado, requisito/item desbloqueado, espécie, slot, cor e revisão. Proíba escrita direta em equipamentos/desbloqueios. Esconder um item na interface não protege a API.
- Sorteio utiliza somente itens disponíveis para a pessoa e respeita compatibilidade. O mesmo backend valida ao salvar. O sorteio em si não dá XP.
- Atualize o estado da interface após confirmação do servidor: breve celebração de conclusão/nível/desbloqueio, com opção de movimento reduzido. Não calcule desbloqueio definitivo usando apenas o estado local.

Exemplos: acessório cósmico ao atingir `best_streak >= 7`; mini-dragão após concluir todas as etapas de um grimório específico de criaturas (esse grimório precisa ser cadastrado); chapéu de mestre por nível 20. Requisitos são exemplos a balancear, não itens já liberados no app.

### Combinação como desafio

Uma combinação sorteada pode gerar uma proposta como “Raposa coral + olhos curiosos + amuleto lunar — desenhe sua versão”. Para uma prática livre, não é necessário novo XP. Se a proposta conceder XP, o servidor cria uma instância de exercício com a configuração e o prompt congelados, recompensa/tempo fixos e limite diário, vinculada ao ritual e à conclusão. Nunca aceite prompts ou recompensas editáveis como prova de conclusão. O desenho enviado continua opcional com o bônus único atual.

## RLS e custos

Catálogos publicados: leitura por autenticados; publicação somente por administração. Progresso, avatares, equipamentos e desbloqueios: leitura só do dono. Leitura da aula pode ser marcada pelo dono; prática concluída, XP, equipamentos e desbloqueios são escritos somente pelas RPCs validadas. Nenhuma chave service role no frontend. A comunidade segue fora desta etapa.

Continue em Cloudflare Workers + Supabase. SVGs próprios, aulas estáticas e montagem de avatar não precisam de API de IA nem novos serviços pagos. Arquivos de desenhos e tráfego seguem sujeitos às franquias existentes. Não adicione chat, geração por IA, ranking público, editor de desenho ou monetização a este pacote.

## Critérios para a próxima entrega

1. Começar com 14 aulas curtas (uma por categoria), cinco truques e exercícios reais. Validar didática, legibilidade e ilustrações antes de ampliar volume.
2. Um fluxo completo: recomendação → aula → exercício cronometrado → XP único → desbloqueio → equipar familiar.
3. Testar duas contas, tentativa de equipar item bloqueado, requests repetidos, contagem/streak/nível exatos, prática acessada por caminhos diferentes e retomada após falha de rede.
4. Verificar telas móveis, navegação por teclado, textos alternativos, preview por camadas e movimento reduzido.
5. Adicionar o personagem humano depois desse ciclo funcionar bem. Mais opções cosméticas não substituem conteúdo didático claro.

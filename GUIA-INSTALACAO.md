# Kwitch Draw — MVP

Um ateliê de desenho com tema de bruxinha ilustradora, gato preto e lápis mágico. Interface em português, responsiva, com paleta ameixa escura, rosa, coral e creme. Ilustrações próprias em SVG, disponíveis no projeto e substituíveis.

## O que está pronto

- Cadastro individual, confirmação por e-mail, login com senha, sessão persistente e logout.
- Perfil com nome editável, UUID, e-mail, XP, nível, streak e histórico.
- Escolha de tratamento feminino (bruxinha), masculino (bruxinho) ou neutro no cadastro e no perfil, com títulos personalizados.
- Familiar individual ilustrado: seis espécies, quatro cores, três amuletos, nome e personalidade; no cadastro e no perfil.
- Níveis progressivos: 150 XP para chegar ao nível 2, custo de subida crescendo 25 XP por nível; nível 50 exige 36.750 XP acumulados.
- Desafio diário compartilhado por todos, sorteio por categoria e dificuldade e cronômetro com pausa/retomada.
- 482 atividades: 390 desafios avulsos, 45 capítulos de nove grimórios e 47 práticas da Academia.
- Imagem obrigatória para concluir novos rituais; XP, streak e progresso concedidos somente após envio validado no banco.
- Comunidade com publicação opcional, Meus desenhos, retirada de publicação e denúncias.
- Dúvidas e Sugestões com conversa privada e resposta administrativa.
- Painel administrativo protegido no banco: usuários, atividade, atendimentos e moderação.
- Sistema global de tutoriais visuais próprios por atividade, Modo Guiado/Livre e editor administrativo com rascunho, imagens, prévia e publicação. 529 guias para as 482 atividades e 47 aulas/dicas atuais, com 2.650 SVGs didáticos. Veja `TUTORIAIS-VISUAIS.md`.
- Escolha digital/papel antes de iniciar: quadro branco com pincel, cores, borracha e desfazer; seleção de foto pelo aparelho; rascunho local e envio ao concluir.
- Jornadas sequenciais, oito conquistas/feitiços automáticos e progresso persistido.
- Grimório de Dicas: 42 aulas com explicações práticas, cinco Truques Rápidos, dica diária, exercícios com XP, recomendações e desbloqueios nos níveis 3 e 6.
- PWA com ícones PNG, manifest, service worker e tela offline.
- RLS, permissões por coluna e funções PostgreSQL para validar recompensas.

IA e pagamento ficam fora desta versão. O usuário pode desenhar no quadro simples do app, no papel ou em outro aplicativo e enviar uma imagem do resultado. Veja `DESENHAR-NO-APP.md`.

## Stack e arquitetura

React + TypeScript, App Router compatível com Next.js, vinext 1.0.1, Vite 8 e Cloudflare Workers. Supabase fornece PostgreSQL e Auth. Node.js é usado no desenvolvimento e build; em produção, o código roda no runtime Workers.

```text
Navegador / PWA
  ├── Cloudflare Worker: página, assets e /api/health
  └── Supabase: Auth + consultas com JWT e RLS
                 └── RPC PostgreSQL: timer, conclusão, XP e conquistas
```

O backend de negócio está nas funções PostgreSQL do Supabase, chamadas com o JWT da pessoa autenticada. Não é necessário usar service_role, conectar diretamente ao PostgreSQL, contratar R2 ou configurar Hyperdrive. A autenticação acontece no cliente; dados pessoais não são renderizados no HTML do servidor nem compartilhados em cache.

A configuração ativa da Cloudflare é `cloudflare.config.ts`, gerada pelo inicializador oficial do vinext. O plugin Vite v2 utiliza a CLI `cf` e Build Output. `wrangler.reference.jsonc` documenta os parâmetros equivalentes para Wrangler; **não é um arquivo de deploy**. Use os scripts abaixo para que o vinext gere os entrypoints corretos.

## 1. Abrir no VS Code

1. Extraia o ZIP. Abra a pasta **kwitch-draw** no VS Code (Arquivo → Abrir Pasta).
2. Instale Node.js **24 LTS**, se necessário.
3. Abra Terminal → Novo Terminal nessa pasta.

```sh
npm ci
```

O lockfile está incluído. Não use `npm audit fix --force`: ele propõe versões antigas incompatíveis com esta configuração. Veja a nota de dependências no final.

## 2. Preparar o Supabase

1. Crie um projeto no [Supabase](https://supabase.com/dashboard). Este passo a passo assume um projeto novo.
2. Aguarde o banco ficar disponível. Em **SQL Editor**, abra uma consulta.
3. Cole todo o conteúdo de `supabase/migrations/001_kwitch.sql` e execute **uma vez**.
4. Execute `supabase/migrations/002_profile_gender.sql`, `supabase/migrations/003_drawings.sql`, `supabase/migrations/004_progression_familiar.sql`, `supabase/seed.sql` e `supabase/content-pack-001.sql`, `supabase/migrations/005_academy.sql`, `supabase/migrations/006_catalog_compatibility.sql` e `supabase/academy-content-001.sql`, depois `supabase/migrations/007_longer_challenges.sql` e `supabase/migrations/008_community_support.sql`, `supabase/migrations/009_visual_tutorials.sql` e `supabase/tutorial-content-001.sql` e `supabase/tutorial-content-002.sql`, nesta ordem. Seed e pacote podem ser repetidos: utilizam `ON CONFLICT DO NOTHING`. Para atualizar um site existente, execute somente as migrations ainda não aplicadas. Veja `CONTEUDO-E-DESENHOS.md`, `NIVEIS-E-FAMILIARES.md` e `ACADEMIA-MAGICA.md`.
5. Em Authentication → Providers/Sign In, deixe **Email** habilitado, com confirmação de e-mail. Configure tamanho mínimo da senha em pelo menos **8 caracteres**.
6. Em Authentication → URL Configuration, defina inicialmente **Site URL** como `http://localhost:3000` e adicione `http://localhost:3000` aos Redirect URLs. Para conferir o preview, adicione também `http://localhost:4173`.
7. Configure **SMTP próprio** para enviar confirmações aos membros. O serviço padrão do Supabase é destinado a testes e tem restrições. Confira [a documentação de e-mail](https://supabase.com/docs/guides/auth/auth-smtp).
8. Em Project Settings → API / API Keys, copie a URL do projeto e a chave **publishable** (`sb_publishable_...`) ou a chave legada **anon**. Nunca copie `service_role`, `sb_secret_...` ou a senha do banco para o frontend.

O trigger cria o perfil ao cadastrar o usuário. Se for usar um projeto que já possui contas, crie os perfis existentes antes de abrir o app, executando como administrador:

```sql
insert into public.profiles(id)
select id from auth.users
on conflict (id) do nothing;
```

Não desative RLS. Catálogos só são lidos por usuários autenticados; perfis, rituais, histórico e conquistas pertencem a cada UUID.

## 3. Configurar e desenvolver

No terminal PowerShell do VS Code:

```powershell
Copy-Item .env.example .env
```

No macOS/Linux:

```sh
cp .env.example .env
```

Edite `.env`:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

As duas variáveis são públicas e entram no build. Não há segredo de backend para colocar nesse arquivo. Reinicie o servidor quando mudar a configuração.

```sh
npm run dev
```

Abra [localhost:3000](http://localhost:3000). Crie sua conta, confirme o e-mail recebido e entre. Sem `.env`, o app mostra uma instrução de configuração e mantém as ilustrações visíveis.

## 4. Verificar antes de publicar

```sh
npm run typecheck
npm test
npm run build
npm run preview -- --port 4173
```

Abra [localhost:4173](http://localhost:4173). A rota [api/health](http://localhost:4173/api/health) deve devolver `{"app":"kwitch-draw","status":"ok"}`. Ela verifica o Worker; não verifica a conexão com seu Supabase.

Os testes executam a migration e o seed em PostgreSQL local via PGlite, com dois usuários e papéis `authenticated`/`anon`. Verificam isolamento, bloqueio de escrita direta de XP, validação do tempo, pausa/retomada, idempotência, sequência de jornada, desafio diário, limite de recompensas e streak. Não precisam de Docker nem modificam seu Supabase.

## 5. Fazer deploy no Cloudflare Workers

Não basta arrastar os arquivos do ZIP no painel: este projeto precisa de build e deploy do Worker.

1. Crie/acesse sua conta Cloudflare e habilite Workers.
2. No terminal da pasta do projeto, autentique:

```sh
npx cf auth login
```

3. Se possuir várias contas, defina `accountId` no topo de `defineConfig` em `cloudflare.config.ts` (fora de `worker`), ou a variável `CLOUDFLARE_ACCOUNT_ID`.
4. Com `.env` preenchido e as verificações aprovadas, publique:

```sh
npm run deploy
```

Esse script gera o build completo e publica o Worker **kwitch-draw**. A CLI informa a URL HTTPS. `.cloudflare/output/` é gerada automaticamente e não precisa ser versionada.

5. No Supabase, altere Site URL para a URL publicada e adicione essa URL exata aos Redirect URLs. Mantenha localhost apenas se continuar desenvolvendo. Ao adicionar domínio próprio no Cloudflare, adicione também o domínio ao Supabase.
6. Teste criação de conta, confirmação, login e logout no domínio publicado. A URL do projeto Supabase e a chave pública já estão embutidas no build; mudar `.env` exige novo deploy.

Para CI, use `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no armazenamento de segredos do provedor. As variáveis `VITE_SUPABASE_*` precisam estar disponíveis **durante o build**, não apenas no ambiente do Worker. Não inclua `.env` no repositório.

## 6. Teste funcional com duas contas

1. Crie a conta A. Confira nome, UUID e XP zero no perfil.
2. Inicie o desafio diário. Pause e recarregue: o ritual permanece pausado. Retome, aguarde o tempo completo e conclua.
3. Confira XP, nível, streak, histórico e primeiro feitiço. Repetir a conclusão não concede XP novamente.
4. Inicie o primeiro capítulo de um grimório, conclua e confira a liberação do segundo.
5. Teste os filtros do gerador. Desafios já recompensados naquele dia não entram no sorteio.
6. Saia. Crie/entre na conta B: ela deve ter UUID diferente, XP zero e nenhum histórico da conta A.
7. Entre novamente na conta A: o progresso deve continuar lá.
8. No celular ou navegador compatível, use **Instalar aplicativo / Adicionar à tela inicial**. HTTPS é necessário em produção.

## Regras do MVP

- O dia diário segue **America/Sao_Paulo**, tanto no banco quanto na interface. Não precisa de cron: o desafio é escolhido deterministicamente pela data entre os avulsos ordenados por ID. Alterar esse catálogo pode alterar a rotação.
- O nível é `1 + floor(XP / 100)` e não pode ser editado pelo cliente.
- Cada desafio concede XP **uma vez por pessoa por dia**. Há apenas uma recompensa diária e no máximo **cinco conclusões com XP por dia**. Essas regras são aplicadas no banco, não apenas no botão.
- Capítulos de grimórios são concluídos uma única vez e em sequência. Progresso é derivado do histórico; não pode ser enviado arbitrariamente pelo usuário.
- Cada pessoa tem no máximo um ritual ativo ou pausado. O tempo é calculado no servidor e persiste entre recarregamentos. Se sair sem pausar, o tempo continua; pausas só passam a valer quando o servidor recebe a ação.
- O XP vem do catálogo no banco. O cliente envia apenas ID do desafio/ritual e ação, nunca valores de XP, nível ou proprietário.
- Conclusão, XP, streak e conquistas acontecem na mesma transação, com bloqueio por usuário e índices de unicidade. Repetir uma conclusão já confirmada retorna o ritual sem conceder XP adicional.
- O ritual diário que atravessa a meia-noite expira: abandone-o e inicie o de hoje. O streak incrementa em dias consecutivos, permanece no mesmo dia e recomeça após uma lacuna. A interface exibe zero quando a sequência já expirou.
- Concluir é uma declaração do usuário de que desenhou. O MVP valida tempo e regras de recompensa; não reconhece nem fiscaliza um desenho real.
- PWA offline permite ver a tela de reconexão e assets públicos. Login, consultas e salvamento exigem internet. O service worker não armazena APIs, HTML autenticado nem dados pessoais.
- Não há painel administrativo neste escopo. Você pode consultar a lista de membros em Supabase Authentication → Users e as métricas nas tabelas, usando o painel administrativo da sua conta. As senhas não são guardadas em texto legível pelo aplicativo.

## Arquivos principais

```text
app/                       telas, estilos e rota de health
lib/supabase.ts            cliente Auth e tipos de dados
public/                    SVGs próprios, PWA e ícones PNG
supabase/migrations/       schema, RLS, grants, triggers e RPCs
supabase/seed.sql          catálogos e desafios
tests/database.test.mjs    testes reais de PostgreSQL local
scripts/icons.mjs          regeneração dos ícones com npm run icons
cloudflare.config.ts       configuração ativa do Worker
vite.config.ts             vinext e plugin Cloudflare
wrangler.reference.jsonc   equivalência de parâmetros, apenas referência
.env.example               variáveis públicas necessárias
package-lock.json          versões reproduzíveis
VERIFICACAO.md             resultados e limites dos testes da entrega
```

Para trocar as artes, substitua `public/atelier.svg` e `public/cat.svg`, preservando seus nomes ou alterando as referências na interface. Substitua `public/icon.svg` e rode `npm run icons` para gerar ícones PWA. O app não faz download de imagens externas nem depende das imagens da conversa anterior.

## Dependências e limites conhecidos

Configuração conferida em **6 de outubro de 2026**. O inicializador oficial utiliza vinext 1.0.1 e versões beta do plugin Cloudflare v2/CLI cf. O lockfile fixa as versões realmente verificadas. A dependência `workerd` está fixada em `1.20261001.1` para evitar runtimes divergentes; `fflate` tem override para uma versão corrigida.

`npm audit` ainda aponta **sete entradas high** na cadeia `vinext → vite-plugin-commonjs → vite-plugin-dynamic-import → fast-glob → micromatch → braces`, originadas no aviso [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). A versão publicada mais recente de braces consultada ainda era 3.0.3, incluída no aviso. Não há correção compatível disponível nessa árvore no momento da entrega. São ferramentas de transformação de código; o MVP não recebe padrões glob dos membros, mas isso não equivale a ausência de risco. Reavalie a árvore quando sair a correção oficial e refaça os testes antes de atualizá-la.

Build, TypeScript e regras PostgreSQL foram verificados localmente. Cadastro por e-mail/SMTP, login num Supabase remoto e deploy na sua conta Cloudflare dependem da configuração das suas contas e devem seguir o teste funcional acima. Para esta conta, a publicação é conferida em VERIFICACAO.md. Uma nova instalação requer configuração e publicação pelo seu responsável.

Se uma instalação recente de npm não executar os scripts binários necessários, rode `npm rebuild workerd esbuild` antes do build. Se o Windows bloquear um executável, não desative proteções: confira a versão oficial e as permissões do ambiente. Erros de e-mail normalmente se resolvem conferindo SMTP, Redirect URLs e confirmação em Auth.

## Documentação oficial consultada

- [Next.js/vinext em Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Deploy vinext no Cloudflare](https://vinext.dev/docs/deploying/cloudflare)
- [Supabase — Auth por senha](https://supabase.com/docs/guides/auth/passwords)
- [Supabase — Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)



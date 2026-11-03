# Grimório de Dicas — Academia Mágica

## O que esta versão acrescenta

42 aulas originais: 14 categorias × 3 dificuldades. Mais cinco Truques Rápidos de aproximadamente 45 segundos de leitura. Cada conteúdo tem três explicações práticas e um exercício. Desde a atualização TUTORIAIS-VISUAIS.md, os esquemas genéricos foram retirados: a aula/exercício usa um guia visual próprio quando cadastrado e informa sua ausência nos demais casos.

Categorias: fundamentos, rostos, olhos, cabelos, mãos, anatomia, poses, perspectiva, luz e sombra, cores, roupas, animais, cenários e desenho digital.

Na Home, a Dica Mágica do Dia muda conforme o dia de São Paulo e oferece um conteúdo disponível para o nível da pessoa. Os 435 desafios anteriores recebem recomendações de fundamentos relacionados. Os 47 exercícios da Academia ficam separados do gerador e da rotação diária: agora são 482 atividades no total, com os mesmos 390 desafios avulsos e nove jornadas.

## Progresso e recompensas

| Conteúdo      | Abre no nível           | Prática    | XP base |
| ------------- | ----------------------- | ---------- | ------- |
| Iniciante     | 1                       | 5 minutos  | 30      |
| Intermediário | 3 (325 XP acumulados)   | 10 minutos | 45      |
| Avançado      | 6 (1.000 XP acumulados) | 15 minutos | 65      |
| Truque Rápido | 1                       | 3 minutos  | 15      |

Marcar como lida registra leitura, sem conceder XP. A prática usa o cronômetro existente, pausa e retomada. O backend valida tempo, disponibilidade, nível, propriedade e limite diário antes de conceder XP. Leituras não contam no limite: práticas, desafios diários, sorteios e jornadas compartilham o limite de cinco conclusões com XP por dia. O mesmo exercício não recompensa duas vezes no mesmo dia. Repetições em dias diferentes são permitidas, mas conquistas da Academia contam **práticas diferentes**.

Três novos feitiços abrem após praticar uma, cinco e quatorze dicas diferentes. Novos conteúdos abrem ao subir de nível. O bônus existente de +15 XP por desenho enviado também vale para práticas, uma vez por conclusão. Não há avaliação automática da qualidade do desenho. Cosméticos e espécies de familiar desbloqueáveis ficam para outra versão.

## Atualizar o projeto existente

O projeto publicado nesta entrega já recebeu a atualização. Os passos abaixo servem para reinstalar em outro ambiente ou atualizar uma cópia anterior.

1. Faça uma cópia da pasta atual e preserve o seu `.env`.
2. Copie os arquivos deste ZIP sobre o projeto. Não recrie contas nem tabelas.
3. Se as migrations 001 a 004 já estão aplicadas, execute `supabase/migrations/005_academy.sql` e depois `supabase/migrations/006_catalog_compatibility.sql` no SQL Editor do Supabase, uma vez cada. A 006 mantém a compatibilidade com os catálogos anteriores.
4. Execute `supabase/academy-content-001.sql`. Este pacote pode ser reaplicado sem duplicar conteúdo. Não execute novamente as migrations 005 e 006.
5. No PowerShell da pasta do projeto:

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run deploy
```

6. Atualize o navegador com Ctrl + F5. Entre e abra **Grimório de Dicas**. Escolha uma aula, leia as três etapas e toque em **Começar exercício**. O exercício aparece no ateliê. Conclua quando o cronômetro terminar; confira XP, progresso e histórico.

## Estrutura para expandir

`lessons` guarda metadados, dificuldade, nível mínimo, status e o exercício relacionado. `lesson_steps` guarda as etapas e a chave da ilustração. `challenge_lessons` relaciona conteúdos aos desafios. `user_lesson_progress` guarda leitura e primeira prática por usuário, com RLS. Práticas não criam um segundo sistema de XP: usam `challenge_runs`, `completions`, `start_challenge` e `control_run`.

O navegador lê metadados publicados para mostrar prévias bloqueadas. As etapas e os exercícios bloqueados são protegidos por RLS; a RPC verifica novamente nível e publicação. Progresso só é escrito por funções autorizadas; não há permissão de edição direta. Conteúdo em `draft` não é publicado.

Para criar mais conteúdo, edite `scripts/academy-content.mjs`, use **novos IDs** e gere um próximo pacote SQL. O pacote atual usa `ON CONFLICT DO NOTHING`, portanto não altera textos já existentes. Para revisões, escreva uma migration explícita. Diagramas ficam em `app/lesson-illustration.tsx`; substitua ou acrescente esquemas conforme o conteúdo. Ao passar de mil registros em um catálogo, acrescente paginação às consultas correspondentes antes de publicar.

Nenhuma API de IA, serviço pago ou recurso adicional de Cloudflare foi adicionado. O uso continua dentro dos planos gratuitos configurados, sujeito aos limites desses planos.


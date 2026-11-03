# Conteúdo e desenhos enviados

## Atualizar um projeto existente

1. Faça backup do banco. Execute **uma vez** `supabase/migrations/003_drawings.sql` no SQL Editor do Supabase.
2. Execute `supabase/content-pack-001.sql`. Este arquivo pode ser repetido sem duplicar conteúdo.
3. Atualize o código, preservando seu `.env`, e publique com `npm.cmd run deploy`.

Projetos novos: execute as migrations 001, 002, 003, depois `seed.sql` e `content-pack-001.sql`.

O catálogo final tem **435 desafios**: 390 avulsos e 45 etapas em 9 grimórios. O desafio diário percorre os 390 avulsos, com virada à meia-noite de São Paulo. O pacote novo acrescenta 21 exercícios por combinação de seis temas e três níveis (378 avulsos), mais 30 etapas de jornadas. As variações de nível usam o mesmo assunto com exercícios diferentes; não são 390 assuntos distintos.

## Enviar um desenho

Conclua o cronômetro. O app abre Meu perfil, onde cada conclusão tem a opção **Enviar desenho · +15 XP**. Também é possível enviar para conclusões antigas.

- JPG, PNG e WebP, até 15 MB de entrada; o navegador reencoda para WebP, até 1600 pixels e 1 MB, sem os metadados originais da foto.
- O bucket `drawings` é privado. RLS permite envio apenas para uma conclusão própria, uma imagem por conclusão, sem sobrescrita. A visualização usa uma URL assinada de 5 minutos.
- `attach_drawing` verifica autenticação, conclusão, propriedade, caminho e metadados do arquivo existente. Concede exatamente 15 XP uma vez, com locks e retorno idempotente. Não avalia qualidade, autoria ou correspondência do desenho: o bônus incentiva a participação.
- O XP base e o streak continuam seguindo a conclusão do cronômetro. O bônus soma ao XP do perfil e aparece separado no histórico. Sem service role no navegador.
- Se o upload funcionar e a conexão cair antes do bônus, reenvie pelo mesmo botão: o app encontra o arquivo e retoma o registro sem upload duplicado.

## Custo

Não há IA paga, R2 ou upgrades automáticos. O armazenamento usa a franquia do Supabase Free, atualmente 1 GB de arquivos, e está sujeito também às cotas de tráfego. A compressão economiza espaço, mas o plano gratuito não é ilimitado. Acompanhe Storage e Usage no painel. Não habilite um plano pago para continuar: ao atingir a cota, suspenda novos envios ou revise a retenção com os participantes.

Documentação: https://supabase.com/pricing e https://supabase.com/docs/guides/storage/security/access-control

## Criar próximos pacotes

Edite os assuntos em `scripts/content-pack.mjs` e `scripts/content-subjects.mjs` e gere o SQL com `node scripts/content-pack.mjs`. Os IDs do pacote 001 são fixos; depois de publicado, use outro arquivo/pacote e IDs novos para novos conteúdos. Não reordene os assuntos de um pacote já publicado.

Validação: `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`. Os testes verificam isolamento entre contas, impossibilidade de alterar XP diretamente, arquivos inválidos, repetição do bônus, distribuição do catálogo e reexecução segura do pacote.

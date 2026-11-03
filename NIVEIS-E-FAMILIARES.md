# Níveis e familiares

## Atualizar

Execute **uma vez** `supabase/migrations/004_progression_familiar.sql` no SQL Editor. Aplique somente após as migrations anteriores; publique o código atualizado. Novos projetos devem executar as migrations 001 a 004 em ordem, seguidas do seed e do pacote de conteúdo.

## Progressão

O XP acumulado, desenhos, histórico, streak e conquistas são preservados. O nível é recalculado pela nova curva: contas com níveis antigos altos podem mostrar um nível menor. Isso é um ajuste da progressão, sem apagar XP.

| Nível | XP total necessário |
| --- | ---: |
| 1 | 0 |
| 2 | 150 |
| 5 | 750 |
| 10 | 2.250 |
| 20 | 7.125 |
| 30 | 14.500 |
| 50 | 36.750 |

Cada passagem custa 150 + 25 × (nível atual − 1). Por exemplo: 1→2 custa 150, 2→3 custa 175, 49→50 custa 1.350. O limiar total de nível L é 25 × (L−1) × (L+10) ÷ 2. O backend calcula o nível em coluna gerada; clientes não podem editar nível ou XP. A barra mostra o progresso dentro do nível atual. As recompensas de desafios e bônus de imagem seguem iguais.

## Familiar individual

No cadastro e em Meu perfil, a pessoa escolhe gato, raposa, coruja, sapo, corvo ou coelho; uma de quatro cores; estrela, lua ou folha como amuleto. São 72 combinações ilustradas, com nome de 2 a 30 caracteres e história de até 240 caracteres. O botão Sortear familiar combina as opções iniciais mantendo nome e descrição. A descrição expressa a personalidade; a ilustração acompanha as opções de espécie, cor e amuleto. Não há geração de imagem por IA.

Ilustrações vetoriais próprias em `app/familiar.tsx`, sem imagens externas ou APIs pagas. O familiar aparece ao lado do nome e na barra lateral. Perfis existentes recebem Nox, o gato ameixa com estrela, e podem personalizá-lo. Campos ficam no perfil com RLS; somente o dono pode editar. O cadastro normaliza metadados inválidos para evitar falha na criação da conta.

## Verificar

`npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run build`.

Testes de limites exatos, consistência SQL/TypeScript, preservação de XP, valores de cadastro inválidos, isolamento entre contas e proteção de nível/XP. Não há cadastro remoto de teste nem envio de e-mails.

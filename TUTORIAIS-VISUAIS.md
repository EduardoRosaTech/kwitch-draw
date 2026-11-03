# Tutoriais visuais — atualização de 7 de outubro de 2026

O botão **Ver como desenhar** agora procura um tutorial específico daquela atividade. Cada etapa mostra a evolução do objeto pedido, com imagem grande e texto curto. Não existe substituição por diagramas genéricos quando falta um guia.

## Conteúdo desta entrega

O catálogo atual inteiro tem guia: **482 atividades + 47 aulas/dicas = 529 tutoriais**, com **2.650 imagens SVG**. Esta ampliação acrescenta 521 guias e 2.605 imagens. Os novos guias têm cinco etapas com ilustrações didáticas simples e estilizadas: observar, construir, definir contornos, pintar e finalizar. Cenas e objetos usam peças de desenho modulares, com composição associada ao enunciado. Não há chamada de IA nem geração externa durante o uso.

Os oito guias da entrega anterior foram preservados:

- Folhas da Lua: seis formas de folhas em contorno/cor, escolha de duas, planta em esboço, contornos, pintura, detalhes ampliados e resultado final; sete etapas.
- Cesta de piquenique: três guias separados para primeiros traços, estudo de volume/textura e composição com tecido/pote; seis etapas cada.
- Cinco olhos e cinco mãos: dois exercícios da Academia, cinco etapas cada.
- Olhos e mãos para iniciantes: duas aulas, cinco etapas cada, com exemplos próprios da aula.

A cobertura inclui os 390 desafios avulsos, 45 capítulos dos Grimórios, 47 exercícios e 47 conteúdos da Academia. Aulas e exercícios mantêm seus desbloqueios por nível. Guias retirados de publicação intencionalmente pelo administrador continuam ocultos. Atividades futuras ainda sem guia mostram o aviso de ausência, até o administrador cadastrar seu exemplo. Todos os guias podem ser refinados pelo painel.

## Usar no aplicativo

1. Abra uma atividade e toque em **Ver como desenhar**.
2. Escolha **Modo Guiado** para ver as imagens ou **Modo Livre** para seguir apenas o enunciado.
3. Toque no índice ou nos botões de etapa para navegar. No computador/tablet, as páginas aparecem em grade; no celular, em uma coluna.
4. Toque em **Começar desafio**; se o mesmo ritual já estiver iniciado, use **Continuar meu desenho**. **Voltar ao desafio** fecha o guia preservando o ritual.
5. O cronômetro continua durante a consulta. Pause no ritual se precisar de uma pausa. O modo escolhido não altera XP, streak nem progresso. Continua obrigatório enviar a imagem do desenho para concluir novos rituais.

O exemplo final está identificado como **Resultado final — uma inspiração**. O participante pode interpretar e mudar a referência.

## Cadastrar e editar como administrador

1. Entre na sua conta administrativa e abra **Administração**.
2. Na seção **Tutoriais visuais**, escolha Desafio/exercício/Grimório ou Academia/dica.
3. Busque e selecione a atividade. Um guia existente abre para edição; uma atividade sem guia inicia um rascunho.
4. Preencha título e introdução. Em cada etapa, informe título, descrição curta, tipo e envie uma imagem própria. Use as setas para reorganizar e **Adicionar etapa** para incluir mais.
5. Opcionalmente, acrescente paleta, imagem final, texturas, luz e dicas extras.
6. Use **Salvar rascunho** para guardar sem trocar o que os participantes estão vendo. Salve antes de sair do painel.
7. Clique em **Pré-visualizar**: o painel usa exatamente o mesmo componente do participante. Uma edição posterior exige conferir novamente a prévia.
8. Clique em **Publicar tutorial**. Cada etapa precisa de imagem válida; a publicação exige entre duas e 40 etapas.
9. **Retirar publicação** esconde o guia sem apagar seu rascunho. Alterações concorrentes são recusadas; reabra antes de salvar se outra pessoa editou.

São aceitos JPG, PNG e WebP, convertidos pelo navegador para WebP de até 1 MB e lado máximo de 1.600 pixels. A entrada pode ter até 15 MB. A paleta permite oito cores; o limite de envio é 50 imagens por administrador por dia UTC. Evite envios repetidos: remover uma etapa não apaga o arquivo enviado. Não há limpeza automática de arquivos sem referência nesta versão.

O editor cria tutoriais para as atividades do catálogo existente. O cadastro de novos desafios, quests e bosses não foi acrescentado nesta entrega; essas atividades futuras podem usar o mesmo sistema ao serem implementadas.

## Atualizar uma instalação anterior

No site do responsável, os dois pacotes de guias foram aplicados. Se já tem a versão anterior de tutoriais visuais, atualize os assets e execute **somente supabase/tutorial-content-002.sql**; não repita migrations. Para outra instalação que já possui migrations 001–008:

1. Faça uma cópia do código atual. Atualize os arquivos do projeto, preservando `.env`.
2. No SQL Editor do Supabase, execute apenas `supabase/migrations/009_visual_tutorials.sql`.
3. Execute `supabase/tutorial-content-001.sql` e depois `supabase/tutorial-content-002.sql`. Se já possui o primeiro pacote, execute apenas o segundo. Ambos preservam tutoriais existentes e edições administrativas.
4. Na pasta do projeto, execute um comando por vez:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run typecheck
npm.cmd run deploy
```

5. Atualize o site com Ctrl + F5. Não repita migrations antigas nem crie outro projeto Supabase.

## Estrutura e privacidade

`visual_tutorials` associa um guia a um desafio ou aula. `tutorial_steps` guarda ordem, título, descrição, imagem, tipo e dica. Paleta, imagem final e extras pertencem ao guia. O rascunho é separado da versão publicada e tem controle de revisão.

As tabelas não permitem leitura ou edição direta por participantes. As funções validam usuário, papel administrativo e acesso de nível às aulas/práticas. O participante recebe somente o guia publicado, sem rascunhos.

Os uploads ficam no bucket privado `tutorial-assets`. Rascunhos enviados são acessíveis apenas a administradores; imagens publicadas são disponibilizadas para participantes autorizados com links assinados de cinco minutos. As ilustrações SVG incluídas no projeto são arquivos educacionais públicos do site, sem informações dos usuários. Não envie dados privados dentro das imagens didáticas.

`VisualTutorial` e `TutorialPages` são usados por desafios diários, sorteios, Grimórios, aulas e exercícios. A prévia administrativa usa `TutorialPages`. Atividades futuras poderão reutilizá-los. Os arquivos JSON dos pacotes documentam os 529 guias; os SVGs ficam em `public/tutorials`.

Esta atualização não contrata serviço, não usa API de IA e não altera plano. Os uploads consomem o armazenamento e tráfego disponíveis no plano Supabase existente; gratuidade depende de permanecer nas cotas do provedor.


Se o editor SQL ficar lento com o arquivo completo, use os oito arquivos em supabase/tutorial-content-002-parts, em ordem de part-01.sql a part-08.sql. São a mesma atualização dividida; execute a opção completa ou os lotes. O pacote preserva qualquer tutorial já existente, inclusive rascunhos administrativos.


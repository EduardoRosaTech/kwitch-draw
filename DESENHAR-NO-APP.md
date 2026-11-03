# Desenhar no digital ou no papel

## Como usar

1. Escolha um desafio, capítulo de Grimório ou prática da Academia e toque em começar.
2. Escolha **Desenhar no digital** ou **Desenhar no papel**. O cronômetro começa depois da escolha.
3. No digital, use o quadro branco com mouse, toque ou caneta. Há pincel, cor, espessura, borracha, desfazer/refazer, limpeza recuperável e download. O quadro mantém proporção 4:3 e exporta 1.200 × 900 pixels.
4. No papel, desenhe fora do app e toque em **Escolher foto do aparelho**. **Tirar foto** pode abrir a câmera do celular; o comportamento depende do aparelho. São aceitos JPG, PNG ou WebP de até 15 MB.
5. Conclua quando o tempo terminar. O backend confirma o ritual e concede o XP base. Se houver desenho digital ou foto selecionada, o app envia a imagem ao histórico privado e solicita o bônus único de +15 XP.
6. Abra **Meu perfil → Histórico → Ver meu desenho** para consultar o resultado. Se terminar sem imagem, ainda poderá enviá-la pelo histórico.

Pode trocar entre digital e papel durante o ritual sem apagar o rascunho de cada modo. Só o resultado do modo selecionado é enviado ao concluir. O quadro pausa a edição quando o ritual está pausado; retome para continuar.

## Rascunhos e falhas de conexão

Traços e foto selecionada ficam no IndexedDB do navegador, separados por conta e ritual. Após atualizar a página ou voltar ao ateliê, o rascunho é recuperado no mesmo aparelho/navegador. A interface informa quando o salvamento local falha e permite baixar uma cópia. Rascunhos ainda não concluídos não sincronizam entre aparelhos; limpar os dados do navegador pode removê-los.

Ao salvar o resultado online, o rascunho local é removido. Se a conclusão for confirmada mas o envio da imagem falhar, o XP base continua salvo e o histórico oferece **Salvar desenho pendente**. Tentar novamente não duplica o XP nem o bônus. O arquivo também fica em memória enquanto a página permanece aberta, para permitir nova tentativa quando o armazenamento local estiver indisponível.

Limpar o quadro pede uma confirmação dentro do app e pode ser desfeito durante a sessão. Abandonar o ritual pede confirmação; use o download antes, caso queira guardar o desenho. Abandono não concede XP. Escolher uma foto sozinha também não concede XP: é necessária a conclusão validada pelo backend.

## Atualizar uma cópia existente

Esta alteração não precisa de migration SQL adicional. Se já usa a versão da Academia com migrations 001 a 006, preserve o `.env`, substitua os arquivos pelo ZIP novo e publique:

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run deploy
```

Atualize o navegador com Ctrl + F5. Para uma instalação nova, siga o README com a sequência completa do Supabase.

## Implementação

O editor é um canvas simples em React, usando Pointer Events para mouse/toque/caneta. Guarda traços locais; não usa IA nem biblioteca paga. A foto e o desenho são convertidos pela rotina existente para WebP de até 1 MB e 1.600 pixels de lado máximo, sem metadados originais. O arquivo digital de download é PNG com fundo branco.

O desenho final continua no bucket privado `drawings`. RLS e a função `attach_drawing` preservam propriedade, vínculo com a conclusão, metadados válidos e bônus único. Não há edição de arquivos já enviados, camadas, zoom, importação de desenho no canvas ou avaliação automática da qualidade nesta versão.

Não foi adicionado serviço pago. O armazenamento online utiliza a infraestrutura já configurada e seus limites; rascunhos usam espaço do aparelho.

# Comunidade, atendimento e conclusão com imagem

Novos rituais seguem: desenhar → concluir → prévia → confirmar envio → XP e progresso. A galeria/câmera abre imediatamente numa janela do ritual. No digital, a imagem do quadro aparece na prévia automaticamente. Não há opção de concluir sem imagem. Se a rede/upload ou validação falhar, o ritual continua aberto, sem novos pontos. O servidor preserva o cronômetro, limite diário, sequência dos Grimórios e desbloqueios. O bônus de imagem de 15 XP foi mantido e é concedido uma única vez junto à conclusão.

Publicar na Comunidade começa desmarcado. Quem optar por publicar compartilha imagem, apelido, familiar e desafio com outros participantes autenticados. E-mail, XP, histórico completo, personalidade do familiar e atendimentos não são públicos. Desenhos antigos permanecem privados. Em Meus desenhos é possível publicar, tornar privado ou excluir. A remoção é reversível no banco: esconde a imagem, preserva a conclusão/XP e mantém o arquivo para recuperação/auditoria. Não libera automaticamente espaço. URLs assinadas já emitidas podem funcionar por até cinco minutos após a retirada; não existe cache público no PWA.

Dúvidas e Sugestões guarda solicitações e conversas privadas. Tipos: Dúvida, Sugestão, Problema/Bug, Outro. O administrador responde; o participante lê e responde no próprio atendimento. Estados: Nova, Respondida, Resolvida. Limites: cinco solicitações por dia, vinte mensagens por atendimento/autor por hora e dez denúncias por dia. Não há mensagens automáticas por e-mail. A interface pagina os resultados; conversas exibem até 500 mensagens.

O Painel Administrativo mostra usuários (incluindo e-mail), atividade, publicações públicas, denúncias e atendimentos. A concessão de acesso não usa metadados do cadastro: a tabela app_admins é inacessível aos participantes. Todas as consultas/RPCs administrativas validam is_admin no banco. O administrador não pode publicar um desenho privado de outra pessoa. Remoção pela moderação impede republicação pelo proprietário. Edição de desafios/dicas pelo painel fica para uma próxima versão; o catálogo SQL e as aulas existentes permanecem a fonte dos conteúdos.

## Atualizar o projeto existente

1. Preserve seu .env e substitua os arquivos do projeto pelo novo ZIP.
2. Execute uma vez supabase/migrations/008_community_support.sql no SQL Editor do projeto correto. Para instalação nova siga a ordem completa no README (001 a 008 e pacotes intercalados).
3. Rode npm.cmd ci, npm.cmd run typecheck, npm.cmd test e npm.cmd run deploy, um por vez.
4. Atualize o site com Ctrl+F5. Confira um ritual, a janela de conclusão e Meus desenhos.
5. A conta administrativa deve ser confirmada pelo responsável antes de conceder acesso. Na console SQL confiável use um UUID verificado de auth.users: insert into public.app_admins(user_id) values ('UUID-VERIFICADO') on conflict do nothing. Nunca coloque chave service_role no site ou no ZIP.

## Guias e limites

O sistema de guias foi atualizado: “Ver como desenhar” procura o tutorial próprio daquela atividade, com imagens grandes e rascunho/publicação administrativa. Não há esquemas genéricos substitutos. O catálogo atual possui 529 guias; veja TUTORIAIS-VISUAIS.md. O tema do desafio permanece visível. Modo Livre e Guiado recebem o mesmo XP e não reiniciam o cronômetro. A Academia mantém suas aulas por nível; recomendações desbloqueadas continuam disponíveis.

Fotos são reprocessadas em WebP (até 1 MB, dimensão máxima 1600 px), retirando metadados. O banco valida arquivo vinculado ao ritual, proprietário, tamanho e MIME armazenados pelo Storage, antes de conceder XP. Isso confirma envio, não autoria, qualidade ou correspondência artística; não foi adicionada IA de avaliação.

Sem serviço pago novo, sem IA nem domínio comprado. Os limites gratuitos de Supabase/Cloudflare continuam aplicáveis: imagens e remoções reversíveis consomem armazenamento, e a comunidade aumenta tráfego. Cada participante pode enviar no máximo dez arquivos vinculados a rituais iniciados no dia UTC; o limite de cinco conclusões recompensadas por dia de São Paulo permanece. Administração e denúncias são manuais, sem serviço externo de moderação. Não é possível prometer operação ilimitada gratuita.

Conclusões anteriores foram preservadas, mesmo sem foto; esta regra é exigida nas novas conclusões. O antigo envio do histórico continua apenas para essas conclusões antigas. Não há alteração de senhas ou contas existentes.



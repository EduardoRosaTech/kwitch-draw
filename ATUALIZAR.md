# Ampliação atual: todo o catálogo com guias visuais

529 tutoriais, cobrindo 482 atividades e 47 aulas/dicas. Para atualizar a versão que já possuía tutoriais, publique os arquivos novos e execute somente supabase/tutorial-content-002.sql. Não há nova migration. Preserve .env e os tutoriais editados pelo painel. Consulte TUTORIAIS-VISUAIS.md.

# Versão atual: Tutoriais visuais próprios por atividade

Veja TUTORIAIS-VISUAIS.md. Para a versão anterior já configurada, aplique apenas a migration 009 e o pacote tutorial-content-001.sql, preservando .env. Os guias abaixo são históricos.

# Versão atual: Comunidade, atendimento e imagem obrigatória

Veja `COMUNIDADE-E-ATENDIMENTO.md`. Aplique somente a migration 008 se já possui as versões anteriores. Preserve o `.env`. O guia abaixo é histórico.

# Atualização: bruxinha, bruxinho e tratamento neutro

**Nova dinâmica digital/papel:** após a versão da Academia, siga `DESENHAR-NO-APP.md`. Esta atualização altera apenas o aplicativo; não execute novamente SQL já aplicado.

**Versão atual — Academia Mágica:** para atualizar a versão com familiares e níveis, siga `ACADEMIA-MAGICA.md`: migrations 005 e 006, pacote de aulas e publicação. O guia abaixo descreve a atualização anterior de tratamento; execute apenas migrations ainda não aplicadas ao seu projeto.

Esta atualização permite selecionar o tratamento no cadastro e em **Meu perfil**. Títulos e mensagens acompanham a preferência. Quem já tem conta começa com tratamento neutro e pode escolher outro; e-mail, senha, XP e histórico são preservados.

## Para o site que já está publicado

1. Faça uma cópia de segurança da sua pasta atual.
2. Extraia o novo ZIP em uma pasta separada. Copie o conteúdo da pasta `kwitch-draw` para a sua pasta de projeto atual, aceitando substituir os arquivos do projeto. **Preserve o seu `.env`**: o ZIP não contém esse arquivo e você não deve copiá-lo de `.env.example` novamente. Não é necessário recriar o projeto Supabase.
3. No Supabase, abra o projeto certo e vá em SQL Editor. Abra o arquivo `supabase/migrations/002_profile_gender.sql` do projeto no VS Code, copie seu conteúdo inteiro, cole no SQL Editor e clique em Run. **Execute somente a migration 002. Não execute a 001 novamente e não apague tabelas.**
4. Abra o terminal na pasta que contém `package.json` e seu `.env`. Execute um comando por vez:

```powershell
npm.cmd ci
```

```powershell
npm.cmd run typecheck
```

```powershell
npm.cmd run deploy
```

5. Aguarde `Deploy complete`, atualize o site com Ctrl + F5 e entre na sua conta. Abra Meu perfil, escolha Masculino — bruxinho, Feminino — bruxinha ou Neutro — pessoa criativa e clique em Salvar perfil. Saia e entre novamente para conferir a persistência. Novas contas escolhem a preferência já no cadastro.

Se o campo novo não salvar, confira se a migration 002 foi executada no mesmo projeto cujo endereço está no `.env`.

## Instalação nova

Siga a sequência completa do README, incluindo as migrations 001 a 006 e os três pacotes de conteúdo, antes de cadastrar contas.

## Geração de artes

Este ZIP não adiciona chamadas de IA nem cria cobranças. O gerador de desafios continua funcionando com o catálogo do Supabase. Gerar imagens com a API da OpenAI depende de uma integração adicional e tem cobrança de API; não é automaticamente coberto pela assinatura de ChatGPT. A chave dessa API deve ficar no servidor, nunca em variáveis `VITE_*` ou no navegador.



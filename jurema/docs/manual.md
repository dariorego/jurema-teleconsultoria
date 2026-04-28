---
title: "Manual da Plataforma JUREMA"
subtitle: "Teleconsultoria IMIP — Guia do Usuário"
author: "Equipe JUREMA"
date: "Abril de 2026"
lang: pt-BR
geometry: margin=2.5cm
fontsize: 11pt
mainfont: "Helvetica"
---

# 1. Introdução

A **JUREMA** é a plataforma de teleconsultoria do IMIP que conecta profissionais
da saúde a especialistas via WhatsApp. Pacientes ou colegas de outros hospitais
solicitam atendimento por mensagem; um especialista (médico, psicólogo,
nutricionista, assistente social ou outras categorias cadastradas) recebe a
solicitação na fila, puxa a conversa, responde, e finaliza com uma pesquisa
de satisfação.

Este manual descreve **como acessar, usar e administrar** a plataforma.

---

# 2. Acesso

**URL de produção:** https://inovacao.imip.org.br/jurema

## 2.1. Como obter acesso

Apenas um administrador pode criar usuários novos. Quando um administrador
cadastra um especialista:

1. O sistema envia um **convite por email** com link mágico de definição de senha.
2. O profissional clica no link e cria sua senha de acesso.
3. A partir daí, ele entra com email e senha em `/jurema/login`.

> **Importante:** o email do convite vem do Supabase Auth. Pode cair na pasta
> de **Spam/Lixo eletrônico** dependendo do servidor de email do hospital. Se
> não chegar em alguns minutos, o admin pode usar o botão **"Reenviar convite"**
> na lista de usuários para gerar um novo link.

## 2.2. Login

Na tela de login digite **email** e **senha** e clique em **Entrar**.

- Há um botão de **"olho"** ao lado da senha para mostrá-la.
- O **modo claro/escuro** pode ser alternado pelo botão no topo direito.

Após entrar, o usuário é levado para o **Dashboard**.

## 2.3. Esqueci minha senha

Caso esqueça a senha, peça ao administrador para reenviar o convite por email
ou entre em contato com a equipe de TI do IMIP.

## 2.4. Trocar minha senha

A qualquer momento, com você logado, é possível trocar a senha em
**Perfil → Trocar senha** (item no rodapé do menu lateral).

1. Abra o item **Perfil** no menu lateral.
2. Role até o card **"Trocar senha"**.
3. Digite a **nova senha** (mínimo 8 caracteres) e **confirme**.
4. Clique em **"Trocar senha"**. A sessão atual permanece ativa; só vai usar
   a senha nova no próximo login.

> **Atenção:** a tela de troca de senha **não pede a senha atual**. Mantenha
> sua estação de trabalho **bloqueada** quando se ausentar para evitar que
> outra pessoa altere sua senha enquanto você estiver longe.

## 2.5. Reaproveitamento de email

Se seu email já é usado em outras aplicações que compartilham o mesmo Supabase
(ex: outro sistema do IMIP), o admin pode te associar à JUREMA sem criar nova
senha — você usa a mesma que já tem na outra aplicação. O sistema avisa o admin
desse caso ao cadastrar.

---

# 3. Estrutura de papéis

A plataforma tem dois papéis (`role`):

| Papel | Quem é | O que pode fazer |
|---|---|---|
| **Especialista** | Profissional cadastrado em uma categoria | Ver e puxar conversas da sua categoria; responder; encerrar |
| **Admin** | Coordenador / gestor | Tudo que o especialista faz + gerenciar usuários e categorias + ver todas as filas independentemente da categoria |

O papel é definido pelo administrador no momento do cadastro do usuário e pode
ser alterado depois.

---

# 4. Dashboard

O Dashboard é a tela inicial após o login. Ele resume o atendimento e ajuda o
profissional a entender o que está aberto, quem está aguardando e como o dia
está fluindo.

## 4.1. Filtros globais

No topo, dois controles afetam todas as visualizações abaixo:

- **Período**: 7 dias (padrão), 30 dias ou 90 dias.
- **Categorias**: clique em uma ou mais pílulas para filtrar. Sem seleção,
  todas são exibidas. Clicar em "Todas" reseta.

## 4.2. Cartões de KPI

Quatro cartões mostram a saúde do atendimento:

| KPI | Significado | Boa direção |
|---|---|---|
| **Conversas abertas** | Total atualmente em fila + em atendimento | depende do volume |
| **Em fila** | Aguardando especialista puxar | quanto menor, melhor |
| **Em atendimento** | Sendo respondidas agora | depende do volume |
| **Tempo médio** | Tempo médio entre abertura e encerramento (últimos 7 dias) | quanto menor, melhor |

O cartão **"Conversas abertas"** mostra também:

- **Sparkline** com os últimos 11 dias.
- **Delta vs ontem** (ex: "+3 vs ontem"): se o número subiu ou caiu em relação
  ao dia anterior.

## 4.3. Solicitações por categoria

Gráfico de barras horizontais com as categorias mais demandadas no período.

- A **barra escura** representa as solicitações **em aberto** (ainda não
  concluídas).
- A **barra clara** sobreposta representa o **total** do período.
- O número à direita é o total da categoria.

## 4.4. Volume por hora

Gráfico de barras verticais mostrando, por hora do dia (08h–19h), as conversas
**criadas hoje**, segmentadas pelo status atual:

- **Laranja**: ainda em fila.
- **Verde**: em atendimento ou aguardando avaliação.
- **Cinza**: já encerrada.

A hora com mais conversas tem a barra destacada e aparece no subtítulo
("Hoje · pico às 14h").

## 4.5. Tabelas de conversas

Abaixo dos gráficos há **três tabelas empilhadas**:

1. **Em fila sem atendimento** — ordenada da mais antiga, com botão "Abrir"
   pra puxar a conversa.
2. **Em atendimento** — ordenada da mais antiga.
3. **Finalizados** — ordenada da mais antiga.

Colunas comuns: **Nome**, **Telefone**, **Categoria** e **tempo** (aberta há,
em atendimento há ou finalizada há).

Cada tabela tem **paginação independente** com seletor de itens por página
(15, 20, 50 ou 100).

## 4.6. Busca rápida

O campo **"Buscar conversas…"** no topo do Dashboard envia para a Caixa com
filtro por nome ou conteúdo de mensagem.

---

# 5. Caixa de atendimento

A **Caixa** mostra as conversas que estão sob responsabilidade do especialista
ou disponíveis para serem puxadas.

## 5.1. Layout

A página tem três seções:

1. **Faixa de KPIs** (versão compacta dos cartões do Dashboard).
2. **Filtros**: data, categoria (admin), busca por nome/mensagem.
3. **Lista de conversas**, dividida em:
   - **Fila** — aguardando alguém puxar.
   - **Minhas em atendimento** — já puxadas por você.
   - **Em atendimento com outros** — atribuídas a colegas (visível apenas
     quando há outras conversas ativas).

## 5.2. Filtros

| Filtro | Quem usa | Comportamento |
|---|---|---|
| **Buscar** | Todos | Pesquisa por nome do paciente OU conteúdo de qualquer mensagem da conversa (debounce de 350 ms) |
| **De / Até** | Todos | Recorta a janela de criação das conversas |
| **Categoria** | Apenas admin | Filtra por uma categoria específica |
| **Limpar** | Todos | Reseta todos os filtros aplicados |

Sem nenhum filtro, a Caixa mostra apenas conversas **ativas** (fila +
em atendimento). Com filtros, conversas **encerradas** também entram (busca
histórica).

## 5.3. Puxar uma conversa

Na lista de **Fila**, clique em **"Puxar"** na conversa desejada.

- Uma vez puxada, a conversa muda de status para **em atendimento** e é
  atribuída a você.
- A conversa só pode ser puxada por especialistas da **mesma categoria**.
  Admins ignoram esse filtro e podem puxar qualquer categoria.
- Outros especialistas perderão a conversa de sua fila assim que você puxar
  (atualização em tempo real).

Se a conversa já tiver sido puxada por outro colega, você verá um aviso:
**"Conversa indisponível: pode ter sido puxada por outro especialista, já não
estar em fila, ou não ser da sua categoria."**

## 5.4. Janela de 24 horas

O WhatsApp Business só permite que profissionais respondam **dentro de 24h
após a última mensagem do paciente**. A plataforma exibe esse tempo restante
no chat:

- **"Janela: 5h"** — em verde/cinza quando há tempo confortável.
- **"Janela: 1h"** — em amarelo quando faltam menos de 2h.
- Após expirar, a próxima mensagem do paciente reabre a janela; até lá, o
  profissional só pode enviar **templates aprovados**.

---

# 6. Atendendo o paciente (chat)

## 6.1. Mensagens de texto

Digite no campo inferior e pressione **Enter** ou clique em **"Enviar"**.

- A mensagem aparece instantaneamente como balão verde-claro do lado direito
  (em modo claro) ou verde-escuro (em modo escuro).
- O paciente recebe a mensagem no WhatsApp dele.
- Se houver erro de envio (ex: token expirado), a plataforma mostra erro
  inline com detalhe.

## 6.2. Enviar arquivo

Clique no ícone **clipe (📎)** ao lado do campo de texto.

- Selecione o arquivo: imagem, áudio, vídeo ou documento.
- Limite: **16 MB**.
- Se você digitar texto antes de selecionar o arquivo, o texto vira **legenda**
  da mídia.

A plataforma:

1. Faz upload do arquivo para o Supabase Storage (bucket privado).
2. Gera um **link assinado de 1 hora** que o WhatsApp/Turn.io baixa.
3. Envia a mídia ao paciente.

A mensagem aparece no chat com:

- **Imagem**: thumbnail clicável que abre em nova aba.
- **Outros tipos**: link "📎 nome do arquivo".

## 6.3. Encerrar conversa

Quando o atendimento estiver concluído, clique em **"Encerrar"** no topo
direito do chat.

Acontece o seguinte fluxo:

1. **Confirmação**: o sistema avisa que será enviada uma pesquisa de
   satisfação ao paciente.
2. **Lista interativa** é enviada ao WhatsApp do paciente:
   "Avalie de 1 a 5, sendo 1 muito ruim e 5 muito bom."
   - Opções: 1 — Muito ruim · 2 — Ruim · 3 — Regular · 4 — Bom · 5 — Muito bom
3. Status da conversa muda para **aguardando avaliação**.
4. Você é redirecionado para a Caixa.
5. Quando o paciente responder com 1–5 (toque na opção ou texto), a plataforma:
   - Salva a nota em `jurema_conversas.avaliacao`.
   - Marca o status como **encerrada** com timestamp `encerrada_at`.
6. Qualquer mensagem **não-numérica** posterior abre uma **nova teleconsultoria**
   automaticamente (paciente recadastrado se necessário).

> **Por quê?** A pesquisa pós-atendimento é mandatória para medirmos qualidade
> e dar feedback aos especialistas.

---

# 7. Perfil

O item **Perfil** no rodapé do menu lateral abre uma página com:

## 7.1. Informações da conta (read-only)

- **Nome** cadastrado pelo admin.
- **Email** de login.
- **Categoria** com rótulo amigável (ex: "Pediatria" em vez de `pediatria`).
- **Papel** (Especialista ou Admin).
- **Status** (Ativo / Inativo).

Para alterar nome, categoria ou papel, contate um administrador.

## 7.2. Trocar senha

Card abaixo das informações:

- Digite a nova senha (mínimo 8 caracteres).
- Confirme.
- Clique em **"Trocar senha"**.

A sessão atual continua ativa após a troca. A senha nova vale a partir do
próximo login.

---

# 8. Administração (apenas admins)

A área **Admin** está no menu lateral, visível apenas para usuários com
`role='admin'`. Tem duas abas:

## 8.1. Usuários

Listagem de todos os especialistas cadastrados, com **Nome**, **Categoria**,
**Role** e **Status** (Ativo/Inativo).

### Criar usuário

1. Clique em **"Novo usuário"**.
2. Preencha:
   - **Email** — receberá o convite com link de definição de senha.
   - **Nome** — exibido nos cartões e no chat.
   - **Categoria** — escolha entre as categorias ativas (pode deixar vazio
     se for admin sem categoria fixa).
   - **Role** — Especialista (padrão) ou Admin.
3. Clique em **Convidar**.

O sistema:

- Verifica se o email já existe em outra aplicação no mesmo Supabase. Se sim,
  reaproveita o usuário existente sem enviar novo convite e avisa o admin.
- Se não existe, cria o usuário em `auth.users` (Supabase) e dispara o
  email de convite.
- Insere o registro em `jurema_especialistas`.

### Reenviar convite

Cada linha tem um botão **"Reenviar convite"** que gera um novo magic link
de definição/redefinição de senha. Útil quando:

- O convite original não chegou (caixa de spam, SMTP intermitente).
- Usuário esqueceu a senha.
- Email foi reaproveitado de outra app e precisa definir senha.

Se o SMTP do Supabase estiver configurado, o usuário recebe o email
automaticamente. Caso contrário, o sistema **copia o link para a área de
transferência** e o admin pode enviá-lo manualmente pelo canal preferido.

### Editar usuário

Clique em **"Editar"** na linha do usuário. Pode alterar nome, categoria, role
e status.

> **Trava de segurança:** você **não pode rebaixar nem desativar a si mesmo**.
> Outro admin precisa fazer isso.

### Desativar / reativar

Clique em **"Desativar"** para tirar o usuário das filas (ele continua
existindo, só não aparece mais como destinatário de novas conversas). Para
voltar, clique em **"Reativar"**.

> **Não há exclusão definitiva**, somente desativação. Isso preserva o
> histórico de conversas atribuídas a esse profissional.

## 8.2. Categorias

Listagem de categorias dinâmicas (médico, psicólogo, nutricionista, etc.).

### Criar categoria

Preencha o formulário no topo da tabela:

- **Código** — apenas minúsculas, dígitos e underscore (ex: `pediatria`,
  `assistencia_social`). Não pode mudar depois.
- **Rótulo** — texto mostrado ao usuário (ex: "Pediatria").
- **Ordem** — número que controla a posição em listas (menor = aparece antes).

Clique em **"Adicionar"**. A categoria já está disponível no formulário de
criação de usuários.

### Editar / desativar categoria

- **Rótulo** e **Ordem** são editáveis inline (clique → digite → tab/click
  fora salva).
- **Desativar** uma categoria: ela some dos formulários de novo cadastro mas
  conversas/solicitações antigas que referenciam a categoria continuam
  funcionando (sem exclusão física).

> **Por quê soft-delete?** Conversas e solicitações têm chave estrangeira
> obrigatória apontando para `jurema_especialidades.codigo`. Apagar uma
> categoria com histórico geraria erro de integridade.

---

# 9. Notificações

- Som **"notify.mp3"** toca a cada nova mensagem inbound (paciente).
- O navegador precisa estar com a aba aberta. A plataforma **não** envia push
  externo (recomenda-se manter pelo menos uma janela aberta no horário de
  atendimento).

---

# 10. Modo claro / escuro

Disponível em qualquer tela pelo botão de tema:

- **Login**: pílula no canto superior direito.
- **Após login**: ao final do menu lateral, abaixo de "Perfil" e "Sair".

A escolha persiste no navegador (`localStorage`). O sistema também respeita
`prefers-reduced-motion` — animações são desativadas se o sistema operacional
estiver com essa preferência.

---

# 11. Menu lateral retrátil

O menu lateral pode ser **retraído** clicando no botão de seta na borda direita
do menu. No estado retraído:

- Apenas os ícones aparecem; os rótulos somem.
- Passe o mouse sobre um ícone para ver o nome (tooltip).
- O estado persiste no navegador — se você retrair e fechar a aba, ao voltar
  o menu continua retraído.

Em telas pequenas (mobile), o menu vira um **drawer** que abre pelo botão
hambúrguer no topo.

---

# 12. Boas práticas e regras de uso

## 12.1. Identificação do paciente

- Confirme nome e CPF no header do chat antes de discutir conduta clínica.
- Se houver dúvida sobre a identidade, peça confirmação via documento.

## 12.2. Privacidade (LGPD)

- A plataforma armazena dados pessoais sensíveis: nome, CPF, telefone,
  conversa clínica e mídia anexada.
- Não compartilhe screenshots em grupos pessoais.
- Não envie dados de outros pacientes em uma mesma conversa.
- Em caso de dúvida sobre LGPD, consulte o **DPO do IMIP**.

## 12.3. Janela de 24h

- Responda assim que possível para não perder a janela.
- Se a janela expirar antes da sua resposta, oriente o paciente a enviar
  uma nova mensagem para reabrir.

## 12.4. Encerramento

- Sempre encerre a conversa pelo botão **"Encerrar"** quando o atendimento
  terminar. Isso aciona a pesquisa de satisfação.
- Não use "encerrar" para sair temporariamente — use apenas quando o
  caso estiver concluído.

## 12.5. Anexos

- Não envie arquivos com tamanho próximo ao limite de 16 MB; comprima imagens
  antes (paciente também tem limite no WhatsApp).
- Imagens de exames devem ser nítidas e legíveis.

## 12.6. Tom de mensagens

- Seja **claro, objetivo e empático**. Evite jargão médico excessivo.
- Termine sempre indicando se haverá **retorno** ou se o caso está
  **encerrado**.

## 12.7. Casos de emergência

- A plataforma **não substitui o pronto atendimento**.
- Se identificar urgência, oriente o paciente a procurar serviço presencial
  (PA / 192 SAMU) imediatamente, e registre essa orientação no chat.

## 12.8. Segurança da conta

- Bloqueie sua estação de trabalho ao se ausentar (Cmd+Ctrl+Q no macOS,
  Win+L no Windows). A tela de troca de senha **não pede a senha atual**.
- Não compartilhe sua senha. Cada profissional deve ter sua própria conta.
- Se suspeitar que alguém usou sua conta, troque a senha imediatamente em
  **Perfil → Trocar senha**.

---

# 13. Resolução de problemas

| Sintoma | Causa provável | Como resolver |
|---|---|---|
| "Sessão expirada" ao tentar puxar | Cookie de auth expirou | Faça logout e entre de novo |
| "Conversa indisponível" | Já foi puxada por outro especialista ou não é da sua categoria | Refresque a Caixa; admin pode puxar de qualquer categoria |
| Anexo não envia | Arquivo > 16 MB ou tipo não aceito pelo WhatsApp | Comprima ou converta para PDF/JPG |
| Email de convite não chegou | Spam ou SMTP não configurado | Cheque caixa de spam; admin pode reenviar |
| Mensagem não chega ao paciente | Janela de 24h expirou | Aguardar paciente enviar nova mensagem |
| "Erro ao encerrar" | Status da conversa já mudou | Refresque a página |
| Som de notificação não toca | Aba inativa ou autoplay bloqueado | Clique uma vez na aba para autorizar áudio |
| Senha não atualiza | Sessão expirou | Faça logout, entre de novo, e tente trocar a senha |

Em qualquer outro caso, contate a equipe de TI do IMIP com:

- O **email** com que você está logado.
- A **URL** que estava acessando.
- A **mensagem de erro** exata (screenshot ajuda).
- O **horário** em que ocorreu.

---

# 14. Glossário

| Termo | Significado |
|---|---|
| **Categoria** | Área de atuação do profissional (médico, psicólogo, etc.). Antiga "especialidade" no banco de dados |
| **Especialista** | Usuário com `role='especialista'` |
| **Admin** | Usuário com `role='admin'` |
| **Caixa** | Tela com lista de conversas em fila e em atendimento |
| **Fila** | Conversas aguardando alguém puxar (`status='fila'`) |
| **Em atendimento** | Conversas atribuídas a algum especialista (`status='em_atendimento'`) |
| **Aguardando avaliação** | Conversa em pesquisa de satisfação pós-encerramento (`status='aguardando_avaliacao'`) |
| **Encerrada** | Conversa finalizada (`status='encerrada'`) |
| **Janela de 24h** | Período em que profissionais podem responder livremente após mensagem do paciente |
| **Convite** | Email com link mágico para o profissional criar a senha |
| **Soft-delete** | Marcar como inativo sem apagar do banco |
| **Sparkline** | Mini-gráfico que mostra tendência |
| **KPI** | Indicador-chave de desempenho |

---

*Manual referente à versão atual da plataforma JUREMA — IMIP.
Em caso de dúvida ou sugestão, contate a equipe responsável pela plataforma.*

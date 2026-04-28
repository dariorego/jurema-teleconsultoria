import Link from "next/link";

export function ManualAdmin() {
  return (
    <article className="manual">
      <h1>Manual do Admin</h1>
      <p className="text-whatsapp-muted">
        Funções exclusivas de quem tem o papel <code>admin</code> na JUREMA. Para tudo que é
        compartilhado com especialistas (login, dashboard, caixa, chat, encerramento, boas
        práticas), consulte o <Link href={"/ajuda" as never}>Manual do Especialista</Link>.
      </p>

      <h2>1. O papel admin</h2>
      <p>
        Admins coordenam a operação. Além de tudo que um especialista faz, têm acesso à área
        <strong> Admin</strong> no menu lateral, com gestão de usuários e categorias.
      </p>

      <h2>2. Permissões diferenciadas</h2>
      <ul>
        <li>
          <strong>Puxar qualquer conversa</strong>: o filtro de categoria é ignorado para admins.
          Útil para destravar uma fila quando o especialista de uma categoria está ausente.
        </li>
        <li>
          <strong>Encerrar qualquer conversa</strong>: mesmo que a conversa esteja atribuída a
          outro especialista. Use com cautela e sempre registre a justificativa no chat antes.
        </li>
        <li>
          <strong>Filtros adicionais na Caixa</strong>: além de data e busca, admins têm filtro
          adicional por categoria.
        </li>
        <li>
          <strong>Visão completa do dashboard</strong>: KPIs e tabelas mostram dados de todas as
          categorias por padrão.
        </li>
      </ul>

      <h2>3. Gerenciar usuários</h2>
      <p>
        Acesse <strong>Admin → Usuários</strong> no menu lateral. A tela lista todos os
        especialistas cadastrados com nome, categoria, role e status (Ativo / Inativo).
      </p>

      <h3>3.1. Criar usuário</h3>
      <ol>
        <li>Clique em <strong>"Novo usuário"</strong>.</li>
        <li>Preencha:
          <ul>
            <li><strong>Email</strong> — receberá o convite com link de definição de senha.</li>
            <li><strong>Nome</strong> — exibido nos cartões e no chat.</li>
            <li><strong>Categoria</strong> — escolha entre as ativas (pode deixar vazio se for admin sem categoria fixa).</li>
            <li><strong>Role</strong> — Especialista (padrão) ou Admin.</li>
          </ul>
        </li>
        <li>Clique em <strong>Convidar</strong>.</li>
      </ol>
      <p>O sistema:</p>
      <ul>
        <li>Cria o usuário em <code>auth.users</code> (Supabase).</li>
        <li>Insere o registro em <code>jurema_especialistas</code>.</li>
        <li>Dispara email de convite com link mágico para definir a senha.</li>
      </ul>
      <blockquote>
        O email depende de SMTP configurado no projeto Supabase. Se não chegar, oriente o usuário
        a verificar a pasta de Spam, ou reenvie pelo painel de admin.
      </blockquote>

      <h3>3.2. Editar usuário</h3>
      <p>
        Clique em <strong>"Editar"</strong> na linha do usuário. Pode alterar nome, categoria,
        role e status.
      </p>
      <blockquote>
        <strong>Trava de segurança:</strong> você não pode rebaixar nem desativar a si mesmo.
        Outro admin precisa fazer isso. Isso evita o cenário de ficar sem nenhum admin ativo.
      </blockquote>

      <h3>3.3. Desativar / reativar</h3>
      <ul>
        <li>Clique em <strong>"Desativar"</strong> para tirar o usuário das filas. Ele continua existindo, só não aparece mais como destinatário de novas conversas.</li>
        <li>Para voltar, clique em <strong>"Reativar"</strong>.</li>
      </ul>
      <blockquote>
        <strong>Não há exclusão definitiva</strong>, somente desativação. Isso preserva o histórico
        de conversas atribuídas a esse profissional.
      </blockquote>

      <h2>3.4. Caixa "Aguardando Link" (videoconferências)</h2>
      <p>
        Quando o paciente escolhe <strong>videochamada</strong> no fluxo do bot, a plataforma
        responde "uma atendente entrará em contato para confirmar o link, data e horário" e
        registra a solicitação como <em>pendente</em>. Essas solicitações ficam visíveis em
        <strong> Admin → Aguardando Link</strong>.
      </p>
      <p>
        A sidebar mostra um <strong>contador vermelho</strong> ao lado de "Admin" quando há
        videoconferências pendentes — assim você sabe quando tem trabalho a fazer sem precisar
        entrar na seção.
      </p>

      <h3>3.4.1. Como atender</h3>
      <ol>
        <li>Acesse <strong>Admin → Aguardando Link</strong>.</li>
        <li>Veja a lista (mais antiga primeiro) com nome, telefone, categoria, hospital e tempo de espera.</li>
        <li>
          Combine o link da videochamada por fora da plataforma (Meet, Zoom, etc.) e envie ao
          paciente pelo canal mais apropriado.
        </li>
        <li>
          Anote o link/data/horário no campo <em>Observações</em> da linha (clique pra editar; salva ao sair do campo).
        </li>
        <li>
          Clique em <strong>"Atendida"</strong>. A solicitação sai da fila <em>e</em> a plataforma
          <strong> cria automaticamente uma nova conversa em fila</strong> para o especialista da
          mesma categoria do solicitante. As observações que você anotou viram uma mensagem de
          sistema na conversa, então o especialista vê o link/data assim que puxar.
        </li>
      </ol>
      <blockquote>
        Exemplo: o paciente pediu videochamada com médico → cai em "Aguardando Link" →
        admin envia o link e clica "Atendida" → uma conversa entra na fila <em>Médico</em> →
        o médico puxa, vê a mensagem de sistema com o link, e faz o acompanhamento (texto e/ou
        vídeo).
      </blockquote>

      <h3>3.4.2. Cancelar</h3>
      <p>
        Use o botão <strong>"Cancelar"</strong> se a solicitação não puder ser atendida (paciente
        desistiu, contato inválido, duplicidade). Status vira <code>cancelado</code>; histórico
        permanece para auditoria.
      </p>

      <h2>4. Gerenciar categorias</h2>
      <p>
        Acesse <strong>Admin → Categorias</strong>. Categorias são as áreas de atuação dos
        profissionais (médico, psicólogo, etc.) e são <em>dinâmicas</em>: você pode criar novas
        sem precisar alterar código.
      </p>

      <h3>4.1. Criar categoria</h3>
      <p>Preencha o formulário no topo da tabela:</p>
      <ul>
        <li><strong>Código</strong> — apenas minúsculas, dígitos e underscore (ex: <code>pediatria</code>, <code>assistencia_social</code>). Não pode mudar depois.</li>
        <li><strong>Rótulo</strong> — texto mostrado ao usuário (ex: "Pediatria").</li>
        <li><strong>Ordem</strong> — número que controla a posição em listas (menor = aparece antes).</li>
      </ul>
      <p>Clique em <strong>"Adicionar"</strong>. A categoria já fica disponível no formulário de criação de usuários.</p>

      <h3>4.2. Editar / desativar</h3>
      <ul>
        <li><strong>Rótulo</strong> e <strong>Ordem</strong> são editáveis inline (clique → digite → tab/click fora salva).</li>
        <li><strong>Desativar</strong> uma categoria: ela some dos formulários de novo cadastro mas conversas/solicitações antigas que referenciam a categoria continuam funcionando.</li>
      </ul>
      <blockquote>
        <strong>Por que soft-delete?</strong> Conversas e solicitações têm chave estrangeira
        obrigatória apontando para <code>jurema_especialidades.codigo</code>. Apagar uma categoria
        com histórico geraria erro de integridade. Por isso só desativamos, sem apagar fisicamente.
      </blockquote>

      <h2>5. Boas práticas de gestão</h2>

      <h3>5.1. Alocação de profissionais</h3>
      <ul>
        <li>Mantenha pelo menos 2 especialistas ativos por categoria de alta demanda — evita gargalo quando um está ausente.</li>
        <li>Ao desativar um profissional, redirecione suas conversas em andamento manualmente (puxe e atribua a outro) antes de desativar.</li>
        <li>Promova a admin com cautela: admins veem dados sensíveis de todas as categorias.</li>
      </ul>

      <h3>5.2. Distribuição de filas</h3>
      <ul>
        <li>Olhe a tabela <em>"Em fila sem atendimento"</em> do dashboard com periodicidade — conversas com tempo aberto alto indicam que a categoria está sem cobertura.</li>
        <li>Se uma categoria entrar em rajada, admin pode puxar pessoalmente até alocar mais especialistas.</li>
      </ul>

      <h3>5.3. Monitoramento</h3>
      <ul>
        <li>Compare KPIs entre 7 e 30 dias para detectar tendência (volume crescendo, tempo médio piorando).</li>
        <li>Use o gráfico <em>Volume por hora</em> para identificar horários de pico e organizar escalas.</li>
        <li>Verifique <em>Solicitações por categoria</em> semanalmente — barra escura grande = backlog ativo.</li>
      </ul>

      <h2>6. Resolução de problemas</h2>
      <table>
        <thead>
          <tr><th>Sintoma</th><th>Causa provável</th><th>Como resolver</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Convite por email não chega</td>
            <td>SMTP não configurado no Supabase ou email no Spam</td>
            <td>Cheque "Authentication → Email Templates / SMTP" no painel Supabase. Reenvie pelo painel admin.</td>
          </tr>
          <tr>
            <td>"Self-demotion bloqueado" ao editar</td>
            <td>Você está tentando alterar seu próprio role/status</td>
            <td>Peça a outro admin para fazer a alteração.</td>
          </tr>
          <tr>
            <td>Erro ao desativar categoria</td>
            <td>—</td>
            <td>Não acontece, é soft-delete. Conversas antigas continuam OK.</td>
          </tr>
          <tr>
            <td>Conversa "presa" em <em>aguardando avaliação</em></td>
            <td>Paciente nunca respondeu a pesquisa</td>
            <td>Atualmente sem botão de "forçar encerramento". Peça TI para rodar UPDATE manual no banco se for crítico.</td>
          </tr>
          <tr>
            <td>Especialista promovido a admin não vê área Admin</td>
            <td>Sessão antiga em cache</td>
            <td>Peça para fazer logout e login novamente.</td>
          </tr>
          <tr>
            <td>Categoria nova não aparece no formulário</td>
            <td>Página em cache do servidor</td>
            <td>Recarregue a página de criação de usuário (server component re-renderiza).</td>
          </tr>
        </tbody>
      </table>

      <h2>7. Limites conhecidos</h2>
      <ul>
        <li>Não há histórico de "quem alterou o quê" no painel admin. Mudanças sensíveis (promoção a admin, desativação) ficam apenas no log do Supabase.</li>
        <li>Não há limite de tentativas de login (rate-limit fica a cargo do Supabase Auth).</li>
        <li>Códigos de categoria não podem ser renomeados após criados — apenas desativados e substituídos por uma nova categoria.</li>
      </ul>

      <h2>8. Em caso de dúvida</h2>
      <p>
        Para questões operacionais cotidianas, consulte primeiro o
        <Link href={"/ajuda" as never}> Manual do Especialista</Link>. Para questões de
        infraestrutura (SMTP, banco, deploys), contate a equipe de TI do IMIP.
      </p>
    </article>
  );
}

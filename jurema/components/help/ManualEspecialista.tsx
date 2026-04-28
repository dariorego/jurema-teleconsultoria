export function ManualEspecialista() {
  return (
    <article className="manual">
      <h1>Manual do Especialista</h1>
      <p className="text-whatsapp-muted">
        Guia para profissionais que atendem pela JUREMA — Teleconsultoria IMIP.
      </p>

      <h2>1. Introdução</h2>
      <p>
        A <strong>JUREMA</strong> é a plataforma de teleconsultoria do IMIP que conecta profissionais
        da saúde a especialistas via WhatsApp. Pacientes ou colegas de outros hospitais solicitam
        atendimento por mensagem; um especialista (médico, psicólogo, nutricionista, assistente
        social ou outras categorias cadastradas) recebe a solicitação na fila, puxa a conversa,
        responde, e finaliza com uma pesquisa de satisfação.
      </p>

      <h2>2. Acesso</h2>
      <p>
        URL de produção: <code>https://inovacao.imip.org.br/jurema</code>
      </p>

      <h3>2.1. Como obter acesso</h3>
      <p>Apenas um administrador pode criar usuários novos. Quando você for cadastrado:</p>
      <ol>
        <li>O sistema envia um <strong>convite por email</strong> com link mágico de definição de senha.</li>
        <li>Clique no link e crie sua senha de acesso.</li>
        <li>A partir daí, entre com email e senha em <code>/jurema/login</code>.</li>
      </ol>
      <blockquote>
        O email do convite vem do Supabase Auth e pode cair na pasta de Spam/Lixo eletrônico. Se
        não chegar em alguns minutos, peça ao administrador para reenviar.
      </blockquote>

      <h3>2.2. Login</h3>
      <p>Na tela de login digite email e senha e clique em <strong>Entrar</strong>.</p>
      <ul>
        <li>Há um botão de "olho" ao lado da senha para mostrá-la.</li>
        <li>O modo claro/escuro pode ser alternado pelo botão no topo direito.</li>
      </ul>
      <p>Após entrar, você é levado para o Dashboard.</p>

      <h3>2.3. Esqueci minha senha</h3>
      <p>
        Caso esqueça a senha, peça ao administrador para reenviar o convite por email ou entre em
        contato com a equipe de TI do IMIP.
      </p>

      <h3>2.4. Trocar minha senha</h3>
      <p>
        A qualquer momento, com você logado, é possível trocar a senha em <strong>Perfil → Trocar
        senha</strong> (item no rodapé do menu lateral). Defina a nova senha (mínimo 8 caracteres),
        confirme, e a sessão atual continua ativa — só usará a senha nova no próximo login.
      </p>
      <blockquote>
        <strong>Atenção:</strong> a tela de troca de senha não pede a senha atual. Mantenha sua
        estação de trabalho bloqueada quando se ausentar para evitar que outra pessoa altere sua
        senha enquanto você estiver longe.
      </blockquote>

      <h2>3. Dashboard</h2>
      <p>
        O Dashboard é a tela inicial após o login. Ele resume o atendimento e ajuda você a entender
        o que está aberto, quem está aguardando e como o dia está fluindo.
      </p>

      <h3>3.1. Filtros globais</h3>
      <p>No topo, dois controles afetam todas as visualizações:</p>
      <ul>
        <li><strong>Período</strong>: 7 dias (padrão), 30 dias ou 90 dias.</li>
        <li>
          <strong>Categorias</strong>: clique em uma ou mais pílulas para filtrar. Sem seleção,
          todas são exibidas. "Todas" reseta.
        </li>
      </ul>

      <h3>3.2. Cartões de KPI</h3>
      <table>
        <thead>
          <tr><th>KPI</th><th>Significado</th><th>Boa direção</th></tr>
        </thead>
        <tbody>
          <tr><td>Conversas abertas</td><td>Total em fila + em atendimento</td><td>depende do volume</td></tr>
          <tr><td>Em fila</td><td>Aguardando alguém puxar</td><td>quanto menor, melhor</td></tr>
          <tr><td>Em atendimento</td><td>Sendo respondidas agora</td><td>depende do volume</td></tr>
          <tr><td>Tempo médio</td><td>Entre abertura e encerramento (últimos 7 dias)</td><td>quanto menor, melhor</td></tr>
        </tbody>
      </table>
      <p>
        O cartão <strong>"Conversas abertas"</strong> também mostra um <em>sparkline</em> dos
        últimos 11 dias e o <em>delta vs. ontem</em>.
      </p>

      <h3>3.3. Solicitações por categoria</h3>
      <p>
        Barras horizontais com as categorias mais demandadas. Barra escura = solicitações em
        aberto (pendente + em andamento); barra clara sobreposta = total do período.
      </p>

      <h3>3.4. Volume por hora</h3>
      <p>
        Barras verticais por hora do dia (08h–19h), com cores indicando o status atual:
        laranja = em fila, verde = em atendimento, cinza = encerrada. A hora de pico é destacada.
      </p>

      <h3>3.5. Tabelas de conversas</h3>
      <p>Três tabelas empilhadas:</p>
      <ol>
        <li><strong>Em fila sem atendimento</strong> — botão "Abrir" puxa a conversa.</li>
        <li><strong>Em atendimento</strong> — ordenada da mais antiga.</li>
        <li><strong>Finalizados</strong> — ordenada da mais antiga.</li>
      </ol>
      <p>Cada tabela tem paginação independente (15, 20, 50 ou 100 itens por página).</p>

      <h3>3.6. Busca rápida</h3>
      <p>
        O campo <em>"Buscar conversas…"</em> no topo do Dashboard envia para a Caixa com filtro
        por nome ou conteúdo de mensagem.
      </p>

      <h2>4. Caixa de atendimento</h2>
      <p>A Caixa mostra as conversas sob sua responsabilidade ou disponíveis para serem puxadas.</p>

      <h3>4.1. Layout</h3>
      <ol>
        <li>Faixa de KPIs (versão compacta dos cartões do Dashboard).</li>
        <li>Filtros: data, busca por nome/mensagem.</li>
        <li>
          Lista dividida em <em>Fila</em>, <em>Minhas em atendimento</em> e
          <em> Em atendimento com outros</em>.
        </li>
      </ol>

      <h3>4.2. Filtros</h3>
      <table>
        <thead>
          <tr><th>Filtro</th><th>Comportamento</th></tr>
        </thead>
        <tbody>
          <tr><td>Buscar</td><td>Pesquisa em nome do paciente OU conteúdo de mensagem (debounce 350 ms)</td></tr>
          <tr><td>De / Até</td><td>Recorta a janela de criação das conversas</td></tr>
          <tr><td>Limpar</td><td>Reseta todos os filtros</td></tr>
        </tbody>
      </table>
      <p>
        Sem nenhum filtro, a Caixa mostra apenas conversas ativas (fila + em atendimento).
        Com filtros, conversas encerradas também entram (busca histórica).
      </p>

      <h3>4.3. Puxar uma conversa</h3>
      <p>
        Na lista de Fila, clique em <strong>"Puxar"</strong>. A conversa muda para
        <em> em atendimento</em> e fica atribuída a você. Só especialistas da mesma categoria
        podem puxar.
      </p>
      <p>
        Se já tiver sido puxada por outro colega, você verá:
        <em> "Conversa indisponível: pode ter sido puxada por outro especialista, já não estar
        em fila, ou não ser da sua categoria."</em>
      </p>

      <h3>4.4. Conversas vindas de videochamada</h3>
      <p>
        Quando o paciente pediu uma <strong>videoconferência</strong>, o admin trata o
        agendamento separadamente (envia o link de Meet/Zoom). Após o admin marcar o pedido como
        atendido, uma nova conversa entra na sua fila normal — com uma <em>mensagem de sistema
        no início</em> mostrando o link e a data combinados pelo admin. Você puxa, lê o que foi
        agendado, e segue o atendimento normalmente (texto e/ou videochamada).
      </p>

      <h3>4.5. Janela de 24 horas</h3>
      <p>
        O WhatsApp Business só permite que profissionais respondam <strong>dentro de 24h após a
        última mensagem do paciente</strong>. A plataforma exibe esse tempo no chat:
      </p>
      <ul>
        <li>"Janela: 5h" — quando há tempo confortável.</li>
        <li>"Janela: 1h" — em amarelo, faltando menos de 2h.</li>
        <li>Após expirar, a próxima mensagem do paciente reabre a janela.</li>
      </ul>

      <h2>5. Atendendo o paciente (chat)</h2>

      <h3>5.1. Mensagens de texto</h3>
      <p>
        Digite no campo inferior e pressione Enter ou clique em <strong>Enviar</strong>. A
        mensagem aparece como balão verde-claro à direita.
      </p>

      <h3>5.2. Enviar arquivo</h3>
      <p>Clique no ícone <strong>clipe (📎)</strong> ao lado do campo de texto.</p>
      <ul>
        <li>Imagem, áudio, vídeo ou documento.</li>
        <li>Limite: <strong>16 MB</strong>.</li>
        <li>Texto digitado antes vira <em>legenda</em> da mídia.</li>
      </ul>

      <h3>5.3. Encerrar conversa</h3>
      <p>Quando o atendimento estiver concluído, clique em <strong>"Encerrar"</strong>:</p>
      <ol>
        <li>Confirmação informa que será enviada pesquisa de satisfação.</li>
        <li>Lista interativa é enviada ao paciente: 1 (Muito ruim) → 5 (Muito bom).</li>
        <li>Status muda para <em>aguardando avaliação</em>; você volta à Caixa.</li>
        <li>Quando o paciente responder, a nota é salva e o status vira <em>encerrada</em>.</li>
        <li>Mensagens não-numéricas posteriores abrem nova teleconsultoria automaticamente.</li>
      </ol>
      <blockquote>
        A pesquisa pós-atendimento é mandatória para medirmos qualidade e dar feedback aos
        especialistas.
      </blockquote>

      <h2>6. Notificações</h2>
      <ul>
        <li>Som <code>notify.mp3</code> toca a cada nova mensagem inbound (paciente).</li>
        <li>O navegador precisa estar com a aba aberta. A plataforma <strong>não</strong> envia push externo.</li>
      </ul>

      <h2>7. Modo claro / escuro</h2>
      <p>Disponível em qualquer tela:</p>
      <ul>
        <li>Login: pílula no canto superior direito.</li>
        <li>Após login: ao final do menu lateral, abaixo de "Sair".</li>
      </ul>
      <p>
        A escolha persiste no navegador. O sistema respeita <code>prefers-reduced-motion</code> —
        animações são desativadas se o sistema operacional estiver com essa preferência.
      </p>

      <h2>8. Boas práticas e regras de uso</h2>

      <h3>8.1. Identificação do paciente</h3>
      <ul>
        <li>Confirme nome e CPF no header do chat antes de discutir conduta clínica.</li>
        <li>Em caso de dúvida sobre identidade, peça confirmação via documento.</li>
      </ul>

      <h3>8.2. Privacidade (LGPD)</h3>
      <ul>
        <li>A plataforma armazena dados pessoais sensíveis (nome, CPF, telefone, conversa clínica, mídia).</li>
        <li>Não compartilhe screenshots em grupos pessoais.</li>
        <li>Não envie dados de outros pacientes em uma mesma conversa.</li>
        <li>Em dúvida sobre LGPD, consulte o DPO do IMIP.</li>
      </ul>

      <h3>8.3. Janela de 24h</h3>
      <ul>
        <li>Responda assim que possível para não perder a janela.</li>
        <li>Se expirar antes da sua resposta, oriente o paciente a enviar nova mensagem.</li>
      </ul>

      <h3>8.4. Encerramento</h3>
      <ul>
        <li>Sempre encerre pelo botão <strong>"Encerrar"</strong> quando o caso terminar.</li>
        <li>Não use "encerrar" para sair temporariamente — apenas quando o caso estiver concluído.</li>
      </ul>

      <h3>8.5. Anexos</h3>
      <ul>
        <li>Comprima imagens antes de enviar; paciente também tem limite no WhatsApp.</li>
        <li>Imagens de exames devem ser nítidas e legíveis.</li>
      </ul>

      <h3>8.6. Tom de mensagens</h3>
      <ul>
        <li>Seja claro, objetivo e empático. Evite jargão médico excessivo.</li>
        <li>Termine sempre indicando se haverá retorno ou se o caso está encerrado.</li>
      </ul>

      <h3>8.7. Casos de emergência</h3>
      <blockquote>
        A plataforma não substitui o pronto atendimento. Se identificar urgência, oriente o
        paciente a procurar serviço presencial (PA / 192 SAMU) imediatamente, e registre essa
        orientação no chat.
      </blockquote>

      <h2>9. Resolução de problemas</h2>
      <table>
        <thead>
          <tr><th>Sintoma</th><th>Causa provável</th><th>Como resolver</th></tr>
        </thead>
        <tbody>
          <tr><td>"Sessão expirada" ao puxar</td><td>Cookie expirou</td><td>Logout e entre de novo</td></tr>
          <tr><td>"Conversa indisponível"</td><td>Já puxada por outro ou de outra categoria</td><td>Refresque a Caixa</td></tr>
          <tr><td>Anexo não envia</td><td>Arquivo &gt; 16 MB ou tipo não aceito</td><td>Comprima ou converta para PDF/JPG</td></tr>
          <tr><td>Convite não chegou</td><td>Spam</td><td>Cheque caixa de spam; admin pode reenviar</td></tr>
          <tr><td>Mensagem não chega ao paciente</td><td>Janela de 24h expirou</td><td>Aguardar paciente enviar nova mensagem</td></tr>
          <tr><td>"Erro ao encerrar"</td><td>Status já mudou</td><td>Refresque a página</td></tr>
          <tr><td>Som não toca</td><td>Aba inativa ou autoplay bloqueado</td><td>Clique uma vez na aba para autorizar áudio</td></tr>
        </tbody>
      </table>
      <p>
        Em qualquer outro caso, contate a equipe de TI do IMIP com email logado, URL acessada,
        mensagem de erro exata (screenshot ajuda) e horário em que ocorreu.
      </p>

      <h2>10. Glossário</h2>
      <table>
        <thead>
          <tr><th>Termo</th><th>Significado</th></tr>
        </thead>
        <tbody>
          <tr><td>Categoria</td><td>Área de atuação do profissional (médico, psicólogo, etc.)</td></tr>
          <tr><td>Especialista</td><td>Usuário com role <code>especialista</code></td></tr>
          <tr><td>Caixa</td><td>Tela com lista de conversas em fila e em atendimento</td></tr>
          <tr><td>Fila</td><td>Conversas aguardando alguém puxar</td></tr>
          <tr><td>Em atendimento</td><td>Conversas atribuídas a algum especialista</td></tr>
          <tr><td>Aguardando avaliação</td><td>Conversa em pesquisa de satisfação pós-encerramento</td></tr>
          <tr><td>Encerrada</td><td>Conversa finalizada</td></tr>
          <tr><td>Janela de 24h</td><td>Período em que profissionais podem responder após mensagem do paciente</td></tr>
          <tr><td>Convite</td><td>Email com link mágico para criar a senha</td></tr>
          <tr><td>Sparkline</td><td>Mini-gráfico que mostra tendência</td></tr>
          <tr><td>KPI</td><td>Indicador-chave de desempenho</td></tr>
        </tbody>
      </table>
    </article>
  );
}

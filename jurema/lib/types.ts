/** Código da categoria — mantido como string genérica desde sprint 5
 * (categorias passaram a ser dinâmicas via tabela jurema_especialidades). */
export type Especialidade = string;

export type Categoria = {
  codigo: string;
  rotulo: string;
  ordem: number;
  ativo: boolean;
};
export type StatusConversa = "fila" | "em_atendimento" | "aguardando_avaliacao" | "encerrada";
export type Direction = "inbound" | "outbound";
export type TipoMensagem = "text" | "image" | "audio" | "video" | "document" | "interactive" | "template" | "system";
export type Role = "especialista" | "admin";

export type Paciente = {
  id: string;
  wa_id: string;
  primeiro_nome: string;
  ultimo_nome: string | null;
  cpf: string | null;
  hospital: string | null;
};

export type Conversa = {
  id: string;
  paciente_id: string;
  especialidade: Especialidade;
  status: StatusConversa;
  especialista_id: string | null;
  ultima_mensagem_at: string | null;
  ultima_inbound_at: string | null;
  janela_expira_at: string | null;
  created_at: string;
  avaliacao: number | null;
};

export type Mensagem = {
  id: string;
  conversa_id: string | null;
  wa_id: string;
  direction: Direction;
  autor_user_id: string | null;
  tipo: TipoMensagem;
  content: string | null;
  media_path: string | null;
  media_mime: string | null;
  turn_message_id: string | null;
  status: string | null;
  created_at: string;
};

export type Especialista = {
  user_id: string;
  nome: string;
  especialidade: Especialidade | null;
  role: Role;
  ativo: boolean;
};

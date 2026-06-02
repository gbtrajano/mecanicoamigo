export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  cpf?: string;
  endereco?: string;
  createdAt: string;
}

export interface Veiculo {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  km?: number;
  createdAt: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  tempoEstimado?: number;
  categoria?: string;
  createdAt: string;
}

export interface Peca {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  precoCusto: number;
  precoVenda: number;
  minimo: number;
  fornecedor?: string;
  categoria?: string;
  createdAt: string;
}

export interface OrdemServico {
  id: string;
  numero: string;
  clienteId: string;
  veiculoId: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  servicos: { servicoId: string; quantidade: number; preco: number }[];
  pecas: { pecaId: string; quantidade: number; preco: number }[];
  observacoes?: string;
  valorTotal: number;
  dataEntrada: string;
  dataPrevisao?: string;
  dataSaida?: string;
  createdAt: string;
}

export interface Transacao {
  id: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  ordemId?: string;
  formaPagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  createdAt: string;
}

export interface NotaFiscal {
  id: string;
  numero: string;
  tipo: 'NF-e' | 'NFC-e' | 'NFS-e';
  ordemId: string;
  clienteId: string;
  valor: number;
  status: 'emitida' | 'cancelada';
  dataEmissao: string;
  chaveAcesso?: string;
  createdAt: string;
}

export interface UsuarioOnline {
  id: string;
  email: string;
  nome?: string;
  online: boolean;
  ultimoAcesso: string;
  subscriptionStatus?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
}

export interface DashboardStats {
  ordensPendentes: number;
  ordensConcluidasMes: number;
  faturamentoMes: number;
  despesasMes: number;
  lucroMes: number;
  pecasBaixoEstoque: number;
  clientesNovosMes: number;
}

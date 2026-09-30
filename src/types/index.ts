export interface Operador {
  nomeNormalizado: string;
  nome: string;
  veiculo: 'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro' | string;
  frente: 'Cobrança Leste' | 'Cobrança Alto Tietê' | 'Apoio Externo' | string;
  tipoEquipe?: 'PROPRIA' | 'APOIO_EXTERNO';
  funcao?: string;
  equipeNumero?: string;
  meta: number;
  percComissao: number;
  ativo?: boolean;
}

export interface HistoricoVisitaItem {
  data: string;
  resultado: string;
  operador?: string;
  os?: string;
  isInfrutifero?: boolean;
  isFimDoDia?: boolean;
}

export interface HistoricoPDE {
  pde: string;
  data: string; // Formatted date da última visita
  dataRaw?: string;
  resultado: string;
  os?: string;
  count: number; // contador de falhas / visitas para compatibilidade
  totalVisitas: number; // total de vezes que este PDE foi visitado (excluindo fim do dia)
  falhasCount: number; // total de visitas infrutíferas
  ultimoOperador?: string;
  isInfrutifero: boolean;
  historicoDetalhado: HistoricoVisitaItem[];
}

export interface UrgenciaItem {
  id: string;
  os: string;
  pde: string;
  pdeFormatado: string;
  descricao: string;
  tipoUrgencia: 'RESTABELECIMENTO' | 'RELIGACAO' | 'PISO' | 'OUTRO_CRITICO';
  frente: string;
  municipio: string;
  bairro: string;
  equipe: string;
  operadorAlocado?: string;
  statusOS?: string;
  dtCompetencia: Date;
  vencReal: Date;
  horarioVencimento?: string;
  statusPrazo: 'VENCIDA' | 'CRITICA' | 'AMANHA' | 'NO_PRAZO';
  horasRestantes: number;
  tempoFormatado: string;
  duplicadaNaCarteira?: boolean;
  isCobranca?: boolean;
  justificada?: boolean;
  justificativaMotivo?: string;
  justificativaData?: string;
  justificativaUsuario?: string;
}

export interface RetrabalhoItem {
  id: string;
  os: string;
  pde: string;
  pdeFormatado: string;
  descricao: string;
  frente: string;
  municipio: string;
  bairro: string;
  equipeAtual: string;
  operadorAlocado?: string;
  statusOS?: string;
  visitasAnteriores: number;
  ultimaData: string;
  motivoFalhaAnterior: string;
  operadorAnterior: string;
  tipoRetrabalho: 'INFRUTIFERO_ANTERIOR' | 'MULTIVISITAS' | 'DUPLICIDADE_CARTEIRA';
  duplicadaNaCarteira?: boolean;
  historicoVisitas?: HistoricoVisitaItem[];
  isCobranca?: boolean;
}

export interface CarteiraLivreItem {
  id: string;
  os: string;
  pde: string;
  descricao: string;
  frente: string;
  municipio: string;
  bairro: string;
  dtCompetencia: Date;
  equipe?: string;
  operadorAlocado?: string;
  statusOS?: string;
  duplicadaNaCarteira?: boolean;
  isCobranca?: boolean;
  isVencido?: boolean;
  diasVencido?: number;
  tipoCobranca?: 'CORTE' | 'SUPRESSAO' | 'VISTORIA' | 'OUTRO';
}

export interface ProducaoDiariaItem {
  data: string; // Formato DD/MM/AAAA
  totalOS: number;
  positivas: number;
  cortesSupressoes: number;
  cortes?: number;
  supressoes?: number;
  negociacoesPOS?: number;
  reposicoesPiso?: number;
  faturasPagas?: number;
  infrutiferas: number;
  fimDoDiaCount: number;
  faturado: number;
  percSucesso: number;
}

export interface OperadorProducao {
  nome: string;
  nomeNormalizado: string;
  veiculo: string;
  frente: string;
  tipoEquipe?: 'PROPRIA' | 'APOIO_EXTERNO';
  faturado: number;
  meta: number;
  totalOS: number;
  positivas: number;
  cortesSupressoes: number;
  cortes?: number;
  supressoes?: number;
  negociacoesPOS?: number;
  cortesViraramPOS?: number;
  reposicoesPiso?: number;
  faturasPagas?: number;
  infrutiferas: number;
  fimDoDiaCount: number;
  percSucesso: number;
  atingimentoMeta: number;
  excesso: number;
  comissao: number;
  ativo: boolean;
  bairrosMaisAtuados?: { local: string; quantidade: number }[];
  historicoDiario?: Record<string, ProducaoDiariaItem>;
  principaisBaixas?: { motivo: string; quantidade: number; percentual: number }[];
  diagnostico?: {
    padraoSuspeitoMigue: boolean;
    motivoAlerta?: string;
    ordensViciadasPerc: number;
    ordensVirgensPerc: number;
    sugestaoAcao: string;
  };
}

export interface OperadorDossie {
  nome: string;
  nomeNormalizado: string;
  veiculo: string;
  frente: string;
  tipoEquipe: 'PROPRIA' | 'APOIO_EXTERNO';
  totalOS: number;
  cortesSupressoes: number;
  cortes: number;
  supressoes: number;
  negociacoesPOS: number;
  cortesViraramPOS: number;
  reposicoesPiso: number;
  faturasPagas: number;
  positivas: number;
  infrutiferas: number;
  fimDoDiaCount: number;
  faturado: number;
  percSucesso: number;
  diasTrabalhados: number;
  bairrosMaisAtuados?: { local: string; quantidade: number }[];
  principaisBaixas: { motivo: string; quantidade: number; percentual: number }[];
  historicoDiario: Record<string, ProducaoDiariaItem>;
  diagnostico: {
    padraoSuspeitoMigue: boolean;
    motivoAlerta?: string;
    ordensViciadasPerc: number;
    ordensVirgensPerc: number;
    sugestaoAcao: string;
  };
}

export interface ReposicaoPisoItem {
  id: string;
  os: string;
  pde: string;
  operador: string;
  data: string;
  municipio: string;
  bairro: string;
  endereco?: string;
  frente: string;
  valor: number;
  reincidente?: boolean;
}

export interface InfrutiferaMotivoStat {
  motivo: string;
  quantidade: number;
  percentual: number;
}

export interface EvolucaoDiariaProducao {
  data: string;
  dataLabel: string;
  faturado: number;
  atendimentosConcluidos: number; // visitas positivas
  totalVisitas: number;
  infrutiferas: number;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  senha?: string;
  cargo: 'SUPERVISOR' | 'CCO' | 'OPERADOR';
  frente?: string;
  ativo: boolean;
  criadoEm: string;
  ultimoAcesso?: string;
}

export interface RegistroCarga {
  id: string;
  tipo: 'EXECUCOES' | 'PENDENCIAS';
  usuarioNome: string;
  usuarioEmail: string;
  dataHora: string;
  totalLinhas: number;
  periodo: string;
  resumo: string;
  detalhes?: {
    cortesSupressoes?: number;
    positivas?: number;
    infrutiferas?: number;
    faturado?: number;
    urgencias?: number;
    retrabalho?: number;
  };
}

export type TipoAgregacaoProducao = 'DIA' | 'SEMANA' | 'MES';

export interface AgregacaoItem {
  id: string;
  rotulo: string;
  datasContidas: string[];
}

export interface SessaoAtiva {
  id: string;
  dataSalvamento: string;
  usuarioEmail?: string;
  usuarioNome?: string;
  totalExecucoesProcessadas: number;
  execucoesBrutasResumo: {
    totalPositivas: number;
    totalInfrutiferas: number;
    totalFimDoDia: number;
    totalCortesSupressoes: number;
    totalCortes?: number;
    totalSupressoes?: number;
    totalCortesViraramPOS?: number;
    totalNegociacoesPOS?: number;
    totalReposicoesPiso?: number;
    faturadoReposicoesPiso?: number;
    totalFaturasPagasApresentadas?: number;
    valorFaturadoTotal: number;
  };
  producaoOperadores: OperadorProducao[];
  infrutiferasEstatisticas: InfrutiferaMotivoStat[];
  evolucaoDiaria: EvolucaoDiariaProducao[];
  reposicoesPiso?: ReposicaoPisoItem[];
  urgencias: UrgenciaItem[];
  retrabalho: RetrabalhoItem[];
  carteiraLivre: CarteiraLivreItem[];
  totalCarteiraImportada: number;
  duplicidadesCarteiraCount: number;
  datasDisponiveis?: string[];
  operadoresExcluidos?: string[];
  linhasExecucoesBrutas?: Record<string, unknown>[];
}

export interface BackupData {
  versao: string;
  dataExportacao: string;
  equipe: Operador[];
  historico: HistoricoPDE[];
  usuarios?: Usuario[];
  cargas?: RegistroCarga[];
}


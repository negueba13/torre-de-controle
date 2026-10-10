/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Users,
  Zap,
  Layers,
  Database,
  Trash2,
  Sliders,
  DollarSign,
  Activity,
  Calendar,
  FileText,
  PieChart,
  Eye,
  AlertCircle,
  Send,
  X,
  Check,
  History,
  Lock,
  UserCheck,
  CalendarDays,
  KeyRound,
  Share2,
  LayoutGrid,
  Table,
  Columns,
  Filter,
  Sparkles,
  UserPlus,
  Edit3,
  SlidersHorizontal,
  ClipboardList
} from 'lucide-react';

import {
  Operador,
  HistoricoPDE,
  HistoricoVisitaItem,
  UrgenciaItem,
  RetrabalhoItem,
  CarteiraLivreItem,
  OperadorProducao,
  InfrutiferaMotivoStat,
  EvolucaoDiariaProducao,
  BackupData,
  Usuario,
  RegistroCarga,
  OperadorDossie,
  ProducaoDiariaItem,
  SessaoAtiva,
  TipoAgregacaoProducao,
  IntervaloDatasCustom,
  AgregacaoItem,
  ReposicaoPisoItem
} from './types';

import {
  cleanPDE,
  normalize,
  isInfrutifero,
  isFimDoDiaOuBaixaInterna,
  isCorteOuSupressao,
  isCorteEfetivo,
  isSupressaoEfetiva,
  isRestabelecimentoEfetivo,
  isReligacaoEfetiva,
  isRestabelecimentoOuReligacao,
  isPDEViciado,
  parseDateString,
  isNegociacaoPOS,
  isTSSNegociacaoPOS,
  isReposicaoPiso,
  isFaturaPagaApresentada,
  formatDataHoraVencimento,
  categorizarMotivoInfrutifero,
  calcularValorServico,
  inferirFrente,
  parseExcelDate,
  calcularPrazoFatal,
  formatMoney,
  formatDataHora,
  formatDataAbrev,
  formatTempoRestante,
  validarArquivoExecucao,
  validarArquivoPendencia,
  getValFromRow,
  isServicoCobranca,
  agruparDatasPorSemana,
  agruparDatasPorMes,
  parseDataBrasileira
} from './utils/pdeCleaner';

import { GraficoEvolucaoDiaria } from './components/GraficoEvolucaoDiaria';
import { ModalReportChefia } from './components/ModalReportChefia';
import { ModalDossieOperador } from './components/ModalDossieOperador';
import { ModalHistoricoCargas } from './components/ModalHistoricoCargas';
import { ModalLogin } from './components/ModalLogin';
import { ModalGestaoUsuarios } from './components/ModalGestaoUsuarios';
import { ModalCentralRelatorios } from './components/ModalCentralRelatorios';
import { ModalImportarArquivos } from './components/ModalImportarArquivos';
import { ModalJustificarVencimento } from './components/ModalJustificarVencimento';
import { ModalComparadorOperadores } from './components/ModalComparadorOperadores';
import { ModalTabelaDePara } from './components/ModalTabelaDePara';
import { SeletorIntervaloDatas } from './components/SeletorIntervaloDatas';
import { AbaFaturasPagasAuditoria, FaturaPagaAuditoriaItem } from './components/AbaFaturasPagasAuditoria';
import { TabelaReposicaoPiso } from './components/TabelaReposicaoPiso';
import { ExcelColumnFilter } from './components/ExcelColumnFilter';
import { ModalEditarOperador } from './components/ModalEditarOperador';
import { ModalCadastroRapidoOperadores } from './components/ModalCadastroRapidoOperadores';
import { ModalAjusteRapidoEquipe } from './components/ModalAjusteRapidoEquipe';
import { ClockSLA } from './components/ClockSLA';
import { PAGE_SIZE, PaginationControls, usePagination } from './components/Pagination';
import { EQUIPE_DEMO } from './utils/sampleData';

import {
  openLocalDB,
  carregarTodosPDEs,
  salvarPDEsEmLote,
  limparBancoPDEs,
  carregarEquipe,
  salvarOperador,
  salvarEquipeEmLote,
  excluirOperador,
  gerarBackupCompleto,
  restaurarBackupCompleto,
  carregarUsuarios,
  salvarUsuario,
  excluirUsuario,
  carregarHistoricoCargas,
  salvarRegistroCarga,
  limparHistoricoCargas,
  salvarSessaoAtiva,
  carregarSessaoAtiva,
  limparSessaoAtiva
} from './utils/indexedDB';

import { METAS_PADRAO } from './utils/dePara';
import { readExcelInWorker } from './utils/readExcelInWorker';

type TabId =
  | 'dashboard'
  | 'urgencias'
  | 'retrabalho'
  | 'operadores_apoio'
  | 'carteira_livre'
  | 'producao'
  | 'cobranca_leste'
  | 'cobranca_alto'
  | 'raiox_infrutiferas'
  | 'equipe';

const SHARED_STATE_TIMEOUT_MS = 5000;
const PENDING_SHARED_STATE_KEY = 'torre_shared_sync_pending';

async function solicitarEstadoCompartilhado(init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), SHARED_STATE_TIMEOUT_MS);

  try {
    return await fetch('/api/shared_state', { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [frenteFiltro, setFrenteFiltro] = useState<string>('GLOBAL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<{ title: string; subtitle: string }>({
    title: '',
    subtitle: ''
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core Data States
  const [equipe, setEquipe] = useState<Operador[]>([]);
  const [pdeHistoricoMap, setPdeHistoricoMap] = useState<Map<string, HistoricoPDE>>(new Map());

  // Pending portfolio states (Motor B)
  const [urgencias, setUrgencias] = useState<UrgenciaItem[]>([]);
  const [retrabalho, setRetrabalho] = useState<RetrabalhoItem[]>([]);
  const [carteiraLivre, setCarteiraLivre] = useState<CarteiraLivreItem[]>([]);
  const [totalCarteiraImportada, setTotalCarteiraImportada] = useState<number>(0);
  const [duplicidadesCarteiraCount, setDuplicidadesCarteiraCount] = useState<number>(0);

  // Execution states (Motor A)
  const [producaoOperadores, setProducaoOperadores] = useState<OperadorProducao[]>([]);
  const [evolucaoDiaria, setEvolucaoDiaria] = useState<EvolucaoDiariaProducao[]>([]);
  const [totalExecucoesProcessadas, setTotalExecucoesProcessadas] = useState<number>(0);
  const [infrutiferasEstatisticas, setInfrutiferasEstatisticas] = useState<InfrutiferaMotivoStat[]>([]);
  const [reposicoesPiso, setReposicoesPiso] = useState<ReposicaoPisoItem[]>([]);
  const [modoCarga, setModoCarga] = useState<'INCREMENTAL' | 'SUBSTITUIR'>('INCREMENTAL');
  const [buscaOperadorProducao, setBuscaOperadorProducao] = useState<string>('');
  const [modalComparadorOpen, setModalComparadorOpen] = useState<boolean>(false);
  const [operadoresPendentesConfig, setOperadoresPendentesConfig] = useState<Operador[]>([]);
  const [filtroTipoPendencias, setFiltroTipoPendencias] = useState<'RESTAB_PISO' | 'VENCIDOS_COBRANCA' | 'TODOS'>('RESTAB_PISO');
  const [filtroStatusOSCarteira, setFiltroStatusOSCarteira] = useState<string>('TODOS');
  const [execucoesBrutasResumo, setExecucoesBrutasResumo] = useState<{
    totalPositivas: number;
    totalInfrutiferas: number;
    totalFimDoDia: number;
    totalCortesSupressoes: number;
    totalCortes: number;
    totalSupressoes: number;
    totalRestabes: number;
    totalReligacoes: number;
    totalCortesViraramPOS: number;
    totalNegociacoesPOS: number;
    totalReposicoesPiso: number;
    faturadoReposicoesPiso: number;
    totalFaturasPagasApresentadas: number;
    valorFaturadoTotal: number;
  }>({
    totalPositivas: 0,
    totalInfrutiferas: 0,
    totalFimDoDia: 0,
    totalCortesSupressoes: 0,
    totalCortes: 0,
    totalSupressoes: 0,
    totalRestabes: 0,
    totalReligacoes: 0,
    totalCortesViraramPOS: 0,
    totalNegociacoesPOS: 0,
    totalReposicoesPiso: 0,
    faturadoReposicoesPiso: 0,
    totalFaturasPagasApresentadas: 0,
    valorFaturadoTotal: 0
  });

  const [linhasExecucoesBrutas, setLinhasExecucoesBrutas] = useState<Record<string, unknown>[]>([]);
  const [operadorParaComparar, setOperadorParaComparar] = useState<string>('');
  const [modalReposicaoPisoOpen, setModalReposicaoPisoOpen] = useState<boolean>(false);
  const [modalTabelaDeParaOpen, setModalTabelaDeParaOpen] = useState<boolean>(false);

  // Estados para Gestão Rápida e Fácil de Operadores (Modais e Edição)
  const [modalEditarOperadorOpen, setModalEditarOperadorOpen] = useState<boolean>(false);
  const [operadorParaEditar, setOperadorParaEditar] = useState<Operador | null>(null);
  const [isNovoOperadorModal, setIsNovoOperadorModal] = useState<boolean>(false);
  const [modalCadastroRapidoLoteOpen, setModalCadastroRapidoLoteOpen] = useState<boolean>(false);
  const [modalAjusteRapidoEquipeOpen, setModalAjusteRapidoEquipeOpen] = useState<boolean>(false);

  // Estados para Visualização de Resultados (Eliminando o Arrasto Horizontal)
  const [modoVisualizacaoProducao, setModoVisualizacaoProducao] = useState<'COMPACTA' | 'CARDS' | 'TABELA'>('COMPACTA');

  // Filtros Avançados Estilo Excel & Chips Rápidos
  const [filtroRapidoChip, setFiltroRapidoChip] = useState<
    'TODOS' | 'LESTE' | 'ALTO' | 'MOTOS' | 'CARROS' | 'META_BATIDA' | 'NA_TRAVE' | 'ABAIXO_META' | 'MIGUE'
  >('TODOS');
  const [excelFiltros, setExcelFiltros] = useState<
    Record<
      string,
      {
        selected: string[];
        sort: 'asc' | 'desc' | null;
        min?: number;
        max?: number;
      }
    >
  >({});

  // Modal para novos operadores detectados na planilha de execuções
  const [modalNovosOperadoresOpen, setModalNovosOperadoresOpen] = useState<boolean>(false);
  const [novosOperadoresDetectados, setNovosOperadoresDetectados] = useState<
    {
      nome: string;
      nomeNormalizado: string;
      frente: 'Cobrança Leste' | 'Cobrança Alto Tietê' | 'Apoio Externo';
      veiculo: 'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro';
      tipoEquipe: 'PROPRIA' | 'APOIO_EXTERNO';
      meta: number;
      percComissao: number;
    }[]
  >([]);
  const [pendingExecucaoRows, setPendingExecucaoRows] = useState<Record<string, unknown>[] | null>(null);

  // Controle de Acesso & Usuários
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('torre_usuario_logado');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modalLoginOpen, setModalLoginOpen] = useState<boolean>(false);
  const [modalGestaoUsuariosOpen, setModalGestaoUsuariosOpen] = useState<boolean>(false);

  // Central Executiva de Relatórios & Importação de Arquivos (Layout Limpo)
  const [modalCentralRelatoriosOpen, setModalCentralRelatoriosOpen] = useState<boolean>(false);
  const [modalImportarArquivosOpen, setModalImportarArquivosOpen] = useState<boolean>(false);

  // Auditoria e Histórico de Cargas
  const [historicoCargas, setHistoricoCargas] = useState<RegistroCarga[]>([]);
  const [modalHistoricoCargasOpen, setModalHistoricoCargasOpen] = useState<boolean>(false);

  // Filtro Diário, Semanal e Mensal de Execuções (Agregação de Tendências de Longo Prazo)
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);
  const [tipoAgregacao, setTipoAgregacao] = useState<TipoAgregacaoProducao>('DIA');
  const [dataFiltro, setDataFiltro] = useState<string>('TODOS');
  const [semanaFiltro, setSemanaFiltro] = useState<string>('TODOS');
  const [mesFiltro, setMesFiltro] = useState<string>('TODOS');
  const [intervaloCustom, setIntervaloCustom] = useState<IntervaloDatasCustom>({
    dataInicio: '2026-10-01',
    dataFim: '2026-10-30',
    nomePreset: 'Ciclo 1 ao 30 (Outubro/2026)',
    compararComAnterior: false,
    dataInicioComp: '2026-07-01',
    dataFimComp: '2026-07-31'
  });
  const [operadoresExcluidos, setOperadoresExcluidos] = useState<string[]>([]);
  const [somenteEquipeOficial, setSomenteEquipeOficial] = useState<boolean>(false);
  const [dossieOperadorSelecionado, setDossieOperadorSelecionado] = useState<OperadorDossie | null>(null);

  // Meta Contratual Sabesp
  const META_SABESP_CORTES = 9220;

  // Filters & Search
  const [searchTermUrgencias, setSearchTermUrgencias] = useState<string>('');
  const [filtroStatusUrgencia, setFiltroStatusUrgencia] = useState<
    'TODOS' | 'CRITICA' | 'AMANHA' | 'NO_PRAZO' | 'VENCIDA_NAO_JUSTIFICADA' | 'VENCIDA_JUSTIFICADA'
  >('TODOS');
  const [itemParaJustificarModal, setItemParaJustificarModal] = useState<UrgenciaItem | null>(null);
  const [searchTermRetrabalho, setSearchTermRetrabalho] = useState<string>('');
  const [filtroRetrabalhoTipo, setFiltroRetrabalhoTipo] = useState<
    'TODOS' | 'FALHAS' | 'MULTIVISITAS' | 'DUPLICADAS' | 'RESOLVIDOS' | 'VICIADOS'
  >('TODOS');
  const [itemHistoricoModal, setItemHistoricoModal] = useState<RetrabalhoItem | null>(null);
  const [isReportChefiaOpen, setIsReportChefiaOpen] = useState<boolean>(false);
  const [searchTermOutrasFrentes, setSearchTermOutrasFrentes] = useState<string>('');
  const [searchTermLivre, setSearchTermLivre] = useState<string>('');
  const [buscaEquipe, setBuscaEquipe] = useState<string>('');
  const [filtroRapidoEquipe, setFiltroRapidoEquipe] = useState<
    'TODOS' | 'LESTE' | 'ALTO' | 'MOTOS' | 'CARROS' | 'PROPRIA' | 'APOIO' | 'ATIVOS' | 'INATIVOS'
  >('TODOS');

  // Team quick editing mode
  const [isModoEdicaoEquipe, setIsModoEdicaoEquipe] = useState<boolean>(false);
  const [edicaoEquipeBuffer, setEdicaoEquipeBuffer] = useState<Record<string, Operador>>({});

  // Manual Operator registration form
  const [novoOpNome, setNovoOpNome] = useState('');
  const [novoOpVeiculo, setNovoOpVeiculo] = useState<'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro'>('Moto');
  const [novoOpFrente, setNovoOpFrente] = useState('Cobrança Leste');
  const [novoOpMeta, setNovoOpMeta] = useState<number>(METAS_PADRAO.metaMoto);
  const [copiedPde, setCopiedPde] = useState<string | null>(null);

  // File input refs
  const fileInputPendenciasRef = useRef<HTMLInputElement>(null);
  const fileInputExecucoesRef = useRef<HTMLInputElement>(null);
  const fileInputBackupRef = useRef<HTMLInputElement>(null);
  const fileInputEquipeRef = useRef<HTMLInputElement>(null);

  // Toast notification helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  const atualizarSLA = useCallback((now: Date) => {
    setUrgencias((prev) => {
      let mudou = false;
      const atualizadas = prev.map((item) => {
        const diff = formatTempoRestante(item.vencReal, now);
        if (diff.status === item.statusPrazo && diff.texto === item.tempoFormatado) {
          return item;
        }
        mudou = true;
        return {
          ...item,
          statusPrazo: diff.status,
          horasRestantes: diff.horasRestantes,
          tempoFormatado: diff.texto
        };
      });
      return mudou ? atualizadas : prev;
    });
  }, []);

  const sincronizarSessaoCompartilhada = useCallback(async (sessao: SessaoAtiva): Promise<boolean> => {
    try {
      const resp = await solicitarEstadoCompartilhado({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessao)
      });
      if (!resp.ok) {
        throw new Error(`Servidor respondeu com status ${resp.status}`);
      }

      try {
        localStorage.removeItem(PENDING_SHARED_STATE_KEY);
      } catch (err) {
        console.error('Não foi possível limpar o indicador de sincronização pendente:', err);
      }
      return true;
    } catch (err) {
      console.error('Não foi possível sincronizar a sessão compartilhada:', err);
      try {
        localStorage.setItem(PENDING_SHARED_STATE_KEY, 'true');
      } catch (storageError) {
        console.error('Não foi possível registrar a sincronização pendente:', storageError);
      }
      showToast('Sessão salva neste dispositivo. A sincronização será retomada quando a conexão voltar.');
      return false;
    }
  }, [showToast]);

  // Helper para copiar PDE de 10 dígitos para o clipboard
  const handleCopiarPDE = useCallback((pde: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!pde) return;
    navigator.clipboard.writeText(pde);
    setCopiedPde(pde);
    showToast(`📋 PDE ${pde} copiado para a área de transferência!`);
    setTimeout(() => {
      setCopiedPde((curr) => (curr === pde ? null : curr));
    }, 2500);
  }, [showToast]);

  // Initial database hydration & session restoration
  useEffect(() => {
    async function init() {
      try {
        await openLocalDB();
        const [ops, pdes, users, cargas, sessao] = await Promise.all([
          carregarEquipe(),
          carregarTodosPDEs(),
          carregarUsuarios(),
          carregarHistoricoCargas(),
          carregarSessaoAtiva()
        ]);

        let listaEquipe = ops || [];
        if (listaEquipe.length === 0) {
          listaEquipe = EQUIPE_DEMO;
          await salvarEquipeEmLote(EQUIPE_DEMO);
        }
        setEquipe(listaEquipe);
        setPdeHistoricoMap(pdes || new Map());
        setHistoricoCargas(cargas || []);

        // Inicialização de usuários com Supervisor Master padrão
        let listaUsers = users || [];
        if (listaUsers.length === 0) {
          const master: Usuario = {
            id: 'user-master-matheus',
            email: 'matheusf566@gmail.com',
            nome: 'Matheus (Supervisor Master)',
            senha: '123456',
            cargo: 'SUPERVISOR',
            frente: 'Cobrança Geral',
            ativo: true,
            criadoEm: new Date().toLocaleDateString('pt-BR')
          };
          await salvarUsuario(master);
          listaUsers = [master];
        }
        setUsuarios(listaUsers);

        // Usuário ativo
        const savedUserStr = localStorage.getItem('torre_usuario_logado');
        if (savedUserStr) {
          try {
            setUsuarioLogado(JSON.parse(savedUserStr));
          } catch {
            setUsuarioLogado(listaUsers[0]);
          }
        } else {
          setUsuarioLogado(listaUsers[0]);
          localStorage.setItem('torre_usuario_logado', JSON.stringify(listaUsers[0]));
        }

        // Tenta primeiro sincronizar do servidor compartilhado (/api/shared_state) para que todos que abrirem o link vejam os dados carregados
        let sessaoServidor: SessaoAtiva | null = null;
        try {
          const resp = await solicitarEstadoCompartilhado();
          if (resp.ok) {
            sessaoServidor = await resp.json();
          } else {
            console.warn(`Não foi possível carregar a sessão compartilhada (status ${resp.status}).`);
          }
        } catch (err) {
          console.warn('Sessão compartilhada indisponível; usando os dados locais.', err);
        }

        const isSessaoValida = (valor: unknown): valor is SessaoAtiva => Boolean(
          valor &&
            typeof valor === 'object' &&
            !Array.isArray(valor) &&
            typeof (valor as SessaoAtiva).id === 'string'
        );

        const sessaoEfetiva = isSessaoValida(sessaoServidor) ? sessaoServidor : isSessaoValida(sessao) ? sessao : null;

        // Restauração do último serviço carregado (Persistência de Sessão)
        if (sessaoEfetiva) {
          if (sessaoEfetiva.producaoOperadores) setProducaoOperadores(sessaoEfetiva.producaoOperadores);
          if (sessaoEfetiva.evolucaoDiaria) setEvolucaoDiaria(sessaoEfetiva.evolucaoDiaria);
          if (sessaoEfetiva.totalExecucoesProcessadas) setTotalExecucoesProcessadas(sessaoEfetiva.totalExecucoesProcessadas);
          if (sessaoEfetiva.infrutiferasEstatisticas) setInfrutiferasEstatisticas(sessaoEfetiva.infrutiferasEstatisticas);
          if (sessaoEfetiva.reposicoesPiso) setReposicoesPiso(sessaoEfetiva.reposicoesPiso);
          if (sessaoEfetiva.execucoesBrutasResumo) setExecucoesBrutasResumo(sessaoEfetiva.execucoesBrutasResumo as any);
          if (sessaoEfetiva.datasDisponiveis) setDatasDisponiveis(sessaoEfetiva.datasDisponiveis);
          if (sessaoEfetiva.linhasExecucoesBrutas) setLinhasExecucoesBrutas(sessaoEfetiva.linhasExecucoesBrutas);
          if (sessaoEfetiva.urgencias) {
            setUrgencias(
              sessaoEfetiva.urgencias.map((u) => ({
                ...u,
                dtCompetencia: new Date(u.dtCompetencia),
                vencReal: new Date(u.vencReal)
              }))
            );
          }
          if (sessaoEfetiva.retrabalho) setRetrabalho(sessaoEfetiva.retrabalho);
          if (sessaoEfetiva.carteiraLivre) {
            setCarteiraLivre(
              sessaoEfetiva.carteiraLivre.map((c) => ({
                ...c,
                dtCompetencia: new Date(c.dtCompetencia)
              }))
            );
          }
          if (sessaoEfetiva.totalCarteiraImportada) setTotalCarteiraImportada(sessaoEfetiva.totalCarteiraImportada);
          if (sessaoEfetiva.duplicidadesCarteiraCount) setDuplicidadesCarteiraCount(sessaoEfetiva.duplicidadesCarteiraCount);
          if (sessaoEfetiva.operadoresExcluidos) setOperadoresExcluidos(sessaoEfetiva.operadoresExcluidos);

          const dataSessao = typeof sessaoEfetiva.dataSalvamento === 'string' && sessaoEfetiva.dataSalvamento
            ? sessaoEfetiva.dataSalvamento
            : new Date().toLocaleString('pt-BR');
          showToast(`💾 Sessão operacional conectada (${dataSessao})!`);
        }
      } catch (err) {
        console.error('Erro ao inicializar IndexedDB:', err);
      }
    }
    init();
  }, [showToast]);

  useEffect(() => {
    let sincronizando = false;
    let ativo = true;

    const aoPerderConexao = () => {
      showToast('Sem conexão. A sessão continua funcionando e as alterações ficam salvas neste dispositivo.');
    };

    const aoVoltarConexao = async () => {
      let sincronizacaoPendente = false;
      try {
        sincronizacaoPendente = localStorage.getItem(PENDING_SHARED_STATE_KEY) === 'true';
      } catch (err) {
        console.error('Não foi possível verificar a sincronização pendente:', err);
      }
      if (sincronizando || !sincronizacaoPendente) return;
      sincronizando = true;

      try {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        if (!ativo) return;

        const sessaoLocal = await carregarSessaoAtiva();
        if (!sessaoLocal) {
          throw new Error('Não há uma sessão local disponível para sincronizar.');
        }

        if (await sincronizarSessaoCompartilhada(sessaoLocal)) {
          showToast('Conexão restabelecida e sessão sincronizada.');
        }
      } catch (err) {
        console.error('Falha ao retomar a sincronização após a reconexão:', err);
        showToast('A conexão voltou, mas a sincronização ainda não foi concluída. Os dados locais estão preservados.');
      } finally {
        sincronizando = false;
      }
    };

    window.addEventListener('offline', aoPerderConexao);
    window.addEventListener('online', aoVoltarConexao);
    return () => {
      ativo = false;
      window.removeEventListener('offline', aoPerderConexao);
      window.removeEventListener('online', aoVoltarConexao);
    };
  }, [showToast, sincronizarSessaoCompartilhada]);

  // ========================================================
  // MOTOR 1: CARGA DE EXECUÇÕES (PASSADO / PRODUÇÃO)
  // ========================================================
  const processarLinhasExecucoes = useCallback(
    async (rows: Record<string, unknown>[], equipeBase?: Operador[]) => {
      setIsLoading(true);
      setLoadingMsg({
        title: '⚙️ MOTOR 1: Absorvendo Execuções...',
        subtitle: `Higienizando PDEs, expurgando baixas de Fim do Dia e calculando faturamento de ${rows.length.toLocaleString('pt-BR')} linhas...`
      });

      // Give UI breathing room to show loader
      await new Promise((resolve) => setTimeout(resolve, 60));

      const equipeTrabalho = equipeBase || equipe;

      try {
        const novosPDEsParaSalvar: HistoricoPDE[] = [];
        const localPdeMap = new Map<string, HistoricoPDE>(pdeHistoricoMap);
        const operacaoMap = new Map<
          string,
          {
            nome: string;
            frente: string;
            veiculo: string;
            tipoEquipe: 'PROPRIA' | 'APOIO_EXTERNO';
            faturado: number;
            totalOS: number;
            positivas: number;
            cortesSupressoes: number;
            cortes: number;
            supressoes: number;
            restabes: number;
            religacoes: number;
            negociacoesPOS: number;
            cortesViraramPOS: number;
            reposicoesPiso: number;
            faturasPagas: number;
            infrutiferas: number;
            fimDoDiaCount: number;
          }
        >();

        // Prepopulate with known registered operators
        equipeTrabalho.forEach((op) => {
          operacaoMap.set(op.nomeNormalizado, {
            nome: op.nome,
            frente: op.frente,
            veiculo: op.veiculo,
            tipoEquipe: op.tipoEquipe || 'PROPRIA',
            faturado: 0,
            totalOS: 0,
            positivas: 0,
            cortesSupressoes: 0,
            cortes: 0,
            supressoes: 0,
            restabes: 0,
            religacoes: 0,
            negociacoesPOS: 0,
            cortesViraramPOS: 0,
            reposicoesPiso: 0,
            faturasPagas: 0,
            infrutiferas: 0,
            fimDoDiaCount: 0
          });
        });

        const motivosContagem: Record<string, number> = {};
        const evolucaoMap = new Map<string, EvolucaoDiariaProducao>();
        const datasDisponiveisSet = new Set<string>();

        // Mapas para análise profunda por operador (Dia a Dia, Baixas, Bairros e Diagnóstico)
        const opDiarioMap = new Map<string, Map<string, ProducaoDiariaItem>>();
        const opMotivosMap = new Map<string, Map<string, number>>();
        const opBairrosMap = new Map<string, Map<string, number>>();
        const opViciadasMap = new Map<string, { total: number; viciadas: number }>();
        const reposicoesPisoArray: ReposicaoPisoItem[] = [];

        let totalPositivas = 0;
        let totalInfrutiferas = 0;
        let totalFimDoDia = 0;
        let totalCortesSupressoes = 0;
        let totalCortes = 0;
        let totalSupressoes = 0;
        let totalRestabes = 0;
        let totalReligacoes = 0;
        let totalNegociacoesPOS = 0;
        let totalCortesViraramPOS = 0;
        let totalReposicoesPiso = 0;
        let faturadoReposicoesPiso = 0;
        let totalFaturasPagasApresentadas = 0;
        let valorFaturadoTotal = 0;

        for (let i = 0; i < rows.length; i++) {
          if (i > 0 && i % 500 === 0) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          }
          const row = rows[i];
          const resultadoRaw = String(getValFromRow(row, ['Resultado', 'Ocorrência', 'Status', 'Desc_Resultado', 'OCORRENCIA', 'RESULTADO']) || '').trim();
          if (!resultadoRaw) continue;

          const descServicoRaw = String(getValFromRow(row, ['Descrição TSS', 'Serviço', 'TSS', 'Descrição', 'Servico', 'DESCRICAO_TSS', 'DESCRICAO']) || '').trim();
          const bairroRaw = String(getValFromRow(row, ['Bairro', 'Subprefeitura', 'Distrito', 'BAIRRO']) || '').trim();
          const municipioRaw = String(getValFromRow(row, ['Município', 'Cidade', 'Regional', 'Localidade', 'MUNICIPIO']) || '').trim();
          const enderecoRaw = String(getValFromRow(row, ['Endereço', 'Logradouro', 'Rua', 'ENDERECO']) || '').trim();

          const pdeRaw = getValFromRow(row, [
            'PDE',
            'Imóvel',
            'Ligação',
            'Cod_PDE',
            'Instalação',
            'NUM_LIGACAO',
            'LIGACAO',
            'IMOVEL',
            'INSTALACAO',
            'CONTRATO',
            'Pde',
            'pde',
            'Imovel',
            'Ligacao',
            'Instalacao',
            'No Ligacao',
            'Nº Ligação',
            'HIDROMETRO',
            'HD',
            'MATRICULA'
          ]);
          const pdeLimpo = cleanPDE(pdeRaw);
          const operadorRaw = String(getValFromRow(row, ['Equipe', 'Operador', 'Nome', 'Funcionario', 'Executor', 'EQUIPE', 'OPERADOR']) || '').trim();
          const opNorm = normalize(operadorRaw);
          const dtExecRaw = getValFromRow(row, ['Data', 'Data de Execução', 'Data Fim Execução', 'Data Exec', 'Competência', 'DATA']);
          const dataExec = parseExcelDate(dtExecRaw);
          const dataFormatada = formatDataAbrev(dataExec);
          const osNum = String(getValFromRow(row, ['Número OS', 'OS', 'ID', 'Ordem', 'NUM_OS']) || '').trim();

          if (dataFormatada !== '-') {
            datasDisponiveisSet.add(dataFormatada);
          }

          const checkFimDoDia = isFimDoDiaOuBaixaInterna(resultadoRaw);
          const checkNegociacaoPOS = !checkFimDoDia && isNegociacaoPOS(resultadoRaw, descServicoRaw);
          const checkCorteVirouPOS = checkNegociacaoPOS && isCorteOuSupressao(descServicoRaw);
          const checkReposicaoPiso = !checkFimDoDia && isReposicaoPiso(resultadoRaw, descServicoRaw);
          const checkFaturaPaga = !checkFimDoDia && isFaturaPagaApresentada(resultadoRaw);
          const checkInfrutifero = !checkFimDoDia && !checkFaturaPaga && isInfrutifero(resultadoRaw, descServicoRaw);
          const checkCorteEfetivo = !checkFimDoDia && !checkInfrutifero && !checkNegociacaoPOS && isCorteEfetivo(resultadoRaw);
          const checkSupressaoEfetiva = !checkFimDoDia && !checkInfrutifero && !checkNegociacaoPOS && isSupressaoEfetiva(resultadoRaw);
          const checkRestabelecimento = !checkFimDoDia && !checkInfrutifero && isRestabelecimentoEfetivo(resultadoRaw, descServicoRaw);
          const checkReligacao = !checkFimDoDia && !checkInfrutifero && isReligacaoEfetiva(resultadoRaw, descServicoRaw);
          const checkCorteGeral = !checkInfrutifero && (checkCorteEfetivo || checkSupressaoEfetiva || (!checkNegociacaoPOS && isCorteOuSupressao(resultadoRaw)));

          let valor = !checkFimDoDia ? calcularValorServico(resultadoRaw, descServicoRaw) : 0;
          if (valor === 0 && checkReposicaoPiso && !checkInfrutifero) valor = 32.02;
          if (valor === 0 && checkNegociacaoPOS && !checkInfrutifero) valor = 44.28;
          const motivoCat = checkInfrutifero ? categorizarMotivoInfrutifero(resultadoRaw, descServicoRaw) : '';

          if (checkFimDoDia) {
            // "Fim do Dia" é baixa interna e NÃO conta como visita ao imóvel
            totalFimDoDia++;
          } else if (checkFaturaPaga) {
            totalFaturasPagasApresentadas++;
            // Cliente apresentou faturas pagas: computado em destaque separado sem somar direto no lucro
          } else if (checkInfrutifero) {
            totalInfrutiferas++;
            motivosContagem[motivoCat] = (motivosContagem[motivoCat] || 0) + 1;
          } else {
            // Positiva / Executada
            totalPositivas++;
            valorFaturadoTotal += valor;
            if (checkCorteEfetivo) totalCortes++;
            if (checkSupressaoEfetiva) totalSupressoes++;
            if (checkCorteGeral) totalCortesSupressoes++;
            if (checkNegociacaoPOS) totalNegociacoesPOS++;
            if (checkCorteVirouPOS) totalCortesViraramPOS++;
            if (checkRestabelecimento) totalRestabes++;
            if (checkReligacao) totalReligacoes++;
            if (checkReposicaoPiso) {
              totalReposicoesPiso++;
              faturadoReposicoesPiso += (valor || 32.02);
              reposicoesPisoArray.push({
                id: `piso-${osNum || i}-${pdeLimpo}`,
                os: osNum || `OS-PISO-${i + 1}`,
                pde: pdeLimpo,
                operador: operadorRaw || 'Equipe Campo',
                data: dataFormatada !== '-' ? dataFormatada : new Date().toLocaleDateString('pt-BR'),
                municipio: municipioRaw || 'São Paulo',
                bairro: bairroRaw || '-',
                endereco: enderecoRaw,
                frente: inferirFrente(descServicoRaw, municipioRaw, bairroRaw),
                valor: valor || 32.02,
                reincidente: false
              });
            }
          }

          // Evolução Diária (não conta fim do dia como visita)
          const chaveDia = dataFormatada !== '-' ? dataFormatada : '27/09/2026';
          const labelDia = chaveDia.slice(0, 5);
          if (!evolucaoMap.has(chaveDia)) {
            evolucaoMap.set(chaveDia, {
              data: chaveDia,
              dataLabel: labelDia,
              faturado: 0,
              atendimentosConcluidos: 0,
              totalVisitas: 0,
              infrutiferas: 0
            });
          }
          const evolItem = evolucaoMap.get(chaveDia)!;
          if (!checkFimDoDia) {
            evolItem.totalVisitas += 1;
            if (valor > 0 || checkCorteGeral || checkNegociacaoPOS || checkReposicaoPiso) {
              evolItem.faturado += valor;
              evolItem.atendimentosConcluidos += 1;
            } else if (checkInfrutifero) {
              evolItem.infrutiferas += 1;
            }
          }

          // REGRA 2: Memória de PDEs (Fim do dia NÃO incrementa contador de visitas ao imóvel!)
          let eraViciadoPreviamente = false;
          if (pdeLimpo) {
            let histExistente = localPdeMap.get(pdeLimpo);

            if (!histExistente) {
              histExistente = {
                pde: pdeLimpo,
                data: dataFormatada,
                resultado: resultadoRaw,
                os: osNum,
                count: checkInfrutifero ? 1 : 0,
                totalVisitas: checkFimDoDia ? 0 : 1,
                falhasCount: checkInfrutifero ? 1 : 0,
                ultimoOperador: operadorRaw,
                isInfrutifero: checkInfrutifero,
                historicoDetalhado: [
                  {
                    data: dataFormatada,
                    resultado: resultadoRaw,
                    operador: operadorRaw,
                    os: osNum,
                    isInfrutifero: checkInfrutifero,
                    isFimDoDia: checkFimDoDia
                  }
                ]
              };
            } else {
              eraViciadoPreviamente = histExistente.totalVisitas >= 2 || histExistente.isInfrutifero;
              if (!checkFimDoDia) {
                histExistente.totalVisitas += 1;
              }
              histExistente.data = dataFormatada;
              histExistente.resultado = resultadoRaw;
              if (operadorRaw) histExistente.ultimoOperador = operadorRaw;
              if (checkInfrutifero) {
                histExistente.falhasCount += 1;
                histExistente.count += 1;
                histExistente.isInfrutifero = true;
              }
              if (!histExistente.historicoDetalhado) {
                histExistente.historicoDetalhado = [];
              }
              histExistente.historicoDetalhado.push({
                data: dataFormatada,
                resultado: resultadoRaw,
                operador: operadorRaw,
                os: osNum,
                isInfrutifero: checkInfrutifero,
                isFimDoDia: checkFimDoDia
              });
            }

            localPdeMap.set(pdeLimpo, histExistente);
            novosPDEsParaSalvar.push(histExistente);
          }

          // REGRA 1: Financeiro & Sucesso Diário por Operador
          if (opNorm) {
            if (!operacaoMap.has(opNorm)) {
              const cadastroOp = equipeTrabalho.find((o) => o.nomeNormalizado === opNorm);
              operacaoMap.set(opNorm, {
                nome: operadorRaw,
                frente: cadastroOp ? cadastroOp.frente : 'Apoio Externo',
                veiculo: cadastroOp ? cadastroOp.veiculo : 'Moto',
                tipoEquipe: cadastroOp?.tipoEquipe || 'APOIO_EXTERNO',
                faturado: 0,
                totalOS: 0,
                positivas: 0,
                cortesSupressoes: 0,
                cortes: 0,
                supressoes: 0,
                restabes: 0,
                religacoes: 0,
                negociacoesPOS: 0,
                cortesViraramPOS: 0,
                reposicoesPiso: 0,
                faturasPagas: 0,
                infrutiferas: 0,
                fimDoDiaCount: 0
              });
            }
            const opItem = operacaoMap.get(opNorm)!;
            opItem.totalOS += 1;
            if (checkFimDoDia) {
              opItem.fimDoDiaCount += 1;
            } else if (checkFaturaPaga) {
              opItem.faturasPagas += 1;
            } else if (checkInfrutifero) {
              opItem.infrutiferas += 1;
            } else {
              opItem.positivas += 1;
              opItem.faturado += valor;
              if (checkCorteEfetivo) opItem.cortes += 1;
              if (checkSupressaoEfetiva) opItem.supressoes += 1;
              if (checkCorteGeral) opItem.cortesSupressoes += 1;
              if (checkNegociacaoPOS) opItem.negociacoesPOS += 1;
              if (checkCorteVirouPOS) opItem.cortesViraramPOS += 1;
              if (checkReposicaoPiso) opItem.reposicoesPiso += 1;
              if (checkRestabelecimento) opItem.restabes += 1;
              if (checkReligacao) opItem.religacoes += 1;
            }

            // Tracking Geográfico (Bairros e Regiões)
            const localAtuacao = bairroRaw ? `${bairroRaw} (${municipioRaw || 'SP'})` : municipioRaw;
            if (localAtuacao && localAtuacao !== '-') {
              if (!opBairrosMap.has(opNorm)) opBairrosMap.set(opNorm, new Map());
              const bm = opBairrosMap.get(opNorm)!;
              bm.set(localAtuacao, (bm.get(localAtuacao) || 0) + 1);
            }

            // Tracking Dia a Dia do Operador
            const diaKey = dataFormatada !== '-' ? dataFormatada : 'Geral';
            if (!opDiarioMap.has(opNorm)) {
              opDiarioMap.set(opNorm, new Map());
            }
            const mapaDoOp = opDiarioMap.get(opNorm)!;
            if (!mapaDoOp.has(diaKey)) {
              mapaDoOp.set(diaKey, {
                data: diaKey,
                totalOS: 0,
                positivas: 0,
                cortesSupressoes: 0,
                cortes: 0,
                supressoes: 0,
                restabes: 0,
                religacoes: 0,
                negociacoesPOS: 0,
                reposicoesPiso: 0,
                faturasPagas: 0,
                infrutiferas: 0,
                fimDoDiaCount: 0,
                faturado: 0,
                percSucesso: 0
              });
            }
            const diaItem = mapaDoOp.get(diaKey)!;
            diaItem.totalOS += 1;
            if (checkFimDoDia) {
              diaItem.fimDoDiaCount += 1;
            } else if (checkFaturaPaga) {
              diaItem.faturasPagas = (diaItem.faturasPagas || 0) + 1;
            } else if (checkInfrutifero) {
              diaItem.infrutiferas += 1;
            } else {
              diaItem.positivas += 1;
              diaItem.faturado += valor;
              if (checkCorteGeral) diaItem.cortesSupressoes += 1;
              if (checkCorteEfetivo) diaItem.cortes = (diaItem.cortes || 0) + 1;
              if (checkSupressaoEfetiva) diaItem.supressoes = (diaItem.supressoes || 0) + 1;
              if (checkNegociacaoPOS) diaItem.negociacoesPOS = (diaItem.negociacoesPOS || 0) + 1;
              if (checkReposicaoPiso) diaItem.reposicoesPiso = (diaItem.reposicoesPiso || 0) + 1;
              if (checkRestabelecimento) diaItem.restabes = (diaItem.restabes || 0) + 1;
              if (checkReligacao) diaItem.religacoes = (diaItem.religacoes || 0) + 1;
            }
            const reaisDia = diaItem.positivas + diaItem.infrutiferas;
            diaItem.percSucesso = reaisDia > 0 ? (diaItem.positivas / reaisDia) * 100 : 0;

            // Tracking Motivos de Baixas do Operador
            if (checkInfrutifero && motivoCat) {
              if (!opMotivosMap.has(opNorm)) {
                opMotivosMap.set(opNorm, new Map());
              }
              const motMap = opMotivosMap.get(opNorm)!;
              motMap.set(motivoCat, (motMap.get(motivoCat) || 0) + 1);
            }

            // Tracking de Ordens Viciadas vs Virgens para Diagnóstico
            if (!opViciadasMap.has(opNorm)) {
              opViciadasMap.set(opNorm, { total: 0, viciadas: 0 });
            }
            const vicItem = opViciadasMap.get(opNorm)!;
            vicItem.total += 1;
            if (eraViciadoPreviamente) {
              vicItem.viciadas += 1;
            }
          }
        }

        // Persist PDEs to IndexedDB in batch
        await salvarPDEsEmLote(novosPDEsParaSalvar);
        setPdeHistoricoMap(localPdeMap);

        // Build Produção Operadores list com Dossiê, Bairros e Histórico Diário
        const producaoArray: OperadorProducao[] = [];
        operacaoMap.forEach((dados, norm) => {
          const cadastroOp = equipeTrabalho.find((o) => o.nomeNormalizado === norm);
          const meta = cadastroOp ? cadastroOp.meta : (dados.tipoEquipe === 'APOIO_EXTERNO' ? 0 : METAS_PADRAO.metaMoto);
          const veic = cadastroOp ? cadastroOp.veiculo : dados.veiculo || 'Moto';
          const percComissao = cadastroOp ? cadastroOp.percComissao : METAS_PADRAO.percComissaoPadrao;
          const atingimento = meta > 0 ? (dados.faturado / meta) * 100 : 0;
          const excesso = Math.max(0, dados.faturado - meta);
          const comissao = excesso * (percComissao / 100);

          // Taxa de Sucesso Real (expurga baixas de fim do dia para cálculo justo)
          const atendimentosReais = dados.positivas + dados.infrutiferas;
          const percSucesso = atendimentosReais > 0 ? (dados.positivas / atendimentosReais) * 100 : 0;

          // Histórico Diário do Operador
          const diarioMap = opDiarioMap.get(norm);
          const historicoDiarioObj: Record<string, ProducaoDiariaItem> = {};
          if (diarioMap) {
            diarioMap.forEach((val, k) => {
              historicoDiarioObj[k] = val;
            });
          }

          // Principais Baixas do Operador
          const motMap = opMotivosMap.get(norm);
          const baixasArray: { motivo: string; quantidade: number; percentual: number }[] = [];
          if (motMap) {
            const totalOpInfrutiferas = dados.infrutiferas || 1;
            motMap.forEach((qtd, mot) => {
              baixasArray.push({
                motivo: mot,
                quantidade: qtd,
                percentual: (qtd / totalOpInfrutiferas) * 100
              });
            });
            baixasArray.sort((a, b) => b.quantidade - a.quantidade);
          }

          // Bairros mais atuados
          const bairrosDoOp: { local: string; quantidade: number }[] = [];
          const bMap = opBairrosMap.get(norm);
          if (bMap) {
            bMap.forEach((qtd, loc) => {
              bairrosDoOp.push({ local: loc, quantidade: qtd });
            });
            bairrosDoOp.sort((a, b) => b.quantidade - a.quantidade);
          }

          // Diagnóstico Operacional
          const vicStats = opViciadasMap.get(norm) || { total: 1, viciadas: 0 };
          const ordensViciadasPerc = vicStats.total > 0 ? Math.round((vicStats.viciadas / vicStats.total) * 100) : 0;
          const ordensVirgensPerc = 100 - ordensViciadasPerc;

          let fechadoOuAusenteQtd = 0;
          baixasArray.forEach((b) => {
            const nm = normalize(b.motivo);
            if (nm.includes('FECHADO') || nm.includes('AUSENTE')) {
              fechadoOuAusenteQtd += b.quantidade;
            }
          });
          const percFechadoAusente = dados.infrutiferas > 0 ? (fechadoOuAusenteQtd / dados.infrutiferas) * 100 : 0;

          let padraoSuspeitoMigue = false;
          let motivoAlerta = '';
          let sugestaoAcao = '';

          if (
            dados.totalOS >= 8 &&
            dados.infrutiferas / dados.totalOS >= 0.70 &&
            percFechadoAusente >= 68 &&
            ordensViciadasPerc < 45
          ) {
            padraoSuspeitoMigue = true;
            motivoAlerta = `Atenção: ${percFechadoAusente.toFixed(0)}% das falhas deste colaborador foram registradas como Imóvel Fechado/Ausente em ordens virgens (1ª visita), com taxa de sucesso de apenas ${percSucesso.toFixed(0)}%. Risco de "migué" de campo.`;
            sugestaoAcao = 'Fiscalizar a rota presencialmente por amostragem e confrontar com o horário de passagem das motos vizinhas.';
          } else if (ordensViciadasPerc >= 50) {
            padraoSuspeitoMigue = false;
            motivoAlerta = `Colaborador penalizado pela rota: ${ordensViciadasPerc}% das suas ordens já eram PDEs viciados com histórico de repetidas visitas infrutíferas. A culpa não é do operador.`;
            sugestaoAcao = 'Reter esses PDEs viciados na aba de Retrabalho para corte de ramal/caminhão e municiar o colaborador com ordens virgens.';
          } else {
            padraoSuspeitoMigue = false;
            motivoAlerta = `Produção regular. Taxa de sucesso real em ${percSucesso.toFixed(1)}% com ${dados.cortesSupressoes} cortes/supressões Sabesp e ${dados.negociacoesPOS} negociações POS.`;
            sugestaoAcao = 'Manter rotina diária de despacho e acompanhamento de metas.';
          }

          producaoArray.push({
            nome: dados.nome,
            nomeNormalizado: norm,
            veiculo: veic,
            frente: cadastroOp ? cadastroOp.frente : dados.frente,
            tipoEquipe: cadastroOp?.tipoEquipe || dados.tipoEquipe,
            faturado: dados.faturado,
            meta: meta,
            totalOS: dados.totalOS,
            positivas: dados.positivas,
            cortesSupressoes: dados.cortesSupressoes,
            cortes: dados.cortes,
            supressoes: dados.supressoes,
            restabes: dados.restabes || 0,
            religacoes: dados.religacoes || 0,
            negociacoesPOS: dados.negociacoesPOS,
            cortesViraramPOS: dados.cortesViraramPOS,
            reposicoesPiso: dados.reposicoesPiso,
            faturasPagas: dados.faturasPagas,
            infrutiferas: dados.infrutiferas,
            fimDoDiaCount: dados.fimDoDiaCount,
            percSucesso: percSucesso,
            atingimentoMeta: atingimento,
            excesso: excesso,
            comissao: comissao,
            ativo: cadastroOp?.ativo !== false,
            historicoDiario: historicoDiarioObj,
            principaisBaixas: baixasArray,
            bairrosMaisAtuados: bairrosDoOp,
            diagnostico: {
              padraoSuspeitoMigue,
              motivoAlerta,
              ordensViciadasPerc,
              ordensVirgensPerc,
              sugestaoAcao
            }
          });
        });

        producaoArray.sort((a, b) => b.faturado - a.faturado);
        setProducaoOperadores(producaoArray);

        // Marca reincidências de reposição de piso
        const pdePisoMap = new Map<string, number>();
        reposicoesPisoArray.forEach((rp) => {
          pdePisoMap.set(rp.pde, (pdePisoMap.get(rp.pde) || 0) + 1);
        });
        reposicoesPisoArray.forEach((rp) => {
          const v = pdePisoMap.get(rp.pde) || 1;
          const hist = localPdeMap.get(rp.pde);
          rp.reincidente = v > 1 || Boolean(hist && hist.totalVisitas > 1);
        });
        setReposicoesPiso(reposicoesPisoArray);

        // Build Infrutíferas Motivos statistics
        const motivosStats: InfrutiferaMotivoStat[] = Object.entries(motivosContagem).map(([motivo, qtd]) => ({
          motivo,
          quantidade: qtd,
          percentual: totalInfrutiferas > 0 ? (qtd / totalInfrutiferas) * 100 : 0
        }));
        motivosStats.sort((a, b) => b.quantidade - a.quantidade);
        setInfrutiferasEstatisticas(motivosStats);

        // Sort daily evolution chronologically by date
        const evolucaoArray = Array.from(evolucaoMap.values());
        evolucaoArray.sort((a, b) => {
          const [diaA, mesA, anoA] = a.data.split('/').map(Number);
          const [diaB, mesB, anoB] = b.data.split('/').map(Number);
          const dateA = new Date(anoA || 2026, (mesA || 1) - 1, diaA || 1).getTime();
          const dateB = new Date(anoB || 2026, (mesB || 1) - 1, diaB || 1).getTime();
          return dateA - dateB;
        });
        setEvolucaoDiaria(evolucaoArray);

        // Lista de Datas Disponíveis para filtro calendário
        const listaDatasOrdenadas = Array.from(datasDisponiveisSet).sort((a, b) => {
          const [dA, mA, yA] = a.split('/').map(Number);
          const [dB, mB, yB] = b.split('/').map(Number);
          return new Date(yA || 2026, (mA || 1) - 1, dA || 1).getTime() - new Date(yB || 2026, (mB || 1) - 1, dB || 1).getTime();
        });
        setDatasDisponiveis(listaDatasOrdenadas);

        setTotalExecucoesProcessadas(rows.length);
        const resumoAtualizado = {
          totalPositivas,
          totalInfrutiferas,
          totalFimDoDia,
          totalCortesSupressoes,
          totalCortes,
          totalSupressoes,
          totalRestabes,
          totalReligacoes: 0,
          totalCortesViraramPOS,
          totalNegociacoesPOS,
          totalReposicoesPiso,
          faturadoReposicoesPiso,
          totalFaturasPagasApresentadas,
          valorFaturadoTotal
        };
        setExecucoesBrutasResumo(resumoAtualizado);

        // =========================================================================
        // MOTOR ANTI-RETRABALHO E NOVA CONDIÇÃO DOS PDES NAS EXECUÇÕES
        // Mapeia todas as ordens que geraram retrabalho ou foram visitadas múltiplas vezes,
        // e define com precisão cirúrgica a NOVA CONDIÇÃO DE CADA PDE após a execução.
        // =========================================================================
        const retrabalhosMap = new Map<string, RetrabalhoItem>();

        // 1. Se já existiam retrabalhos na base (ex: da Carteira), atualiza com a execução
        if (retrabalho.length > 0) {
          retrabalho.forEach((r) => {
            const hist = localPdeMap.get(r.pde);
            if (hist) {
              const ultVisita = hist.historicoDetalhado?.[hist.historicoDetalhado.length - 1];
              const cond = ultVisita ? (
                isCorteEfetivo(ultVisita.resultado) ? `✅ Cortado Sabesp (${ultVisita.data})` :
                isSupressaoEfetiva(ultVisita.resultado) ? `✅ Suprimido Sabesp (${ultVisita.data})` :
                isRestabelecimentoOuReligacao(ultVisita.resultado) ? `✅ Restabelecido/Religado (${ultVisita.data})` :
                isNegociacaoPOS(ultVisita.resultado) ? `✅ Negociado via POS (${ultVisita.data})` :
                isFaturaPagaApresentada(ultVisita.resultado) ? `✅ Fatura Paga Apresentada (${ultVisita.data})` :
                isReposicaoPiso(ultVisita.resultado) ? `✅ Piso Reposto (${ultVisita.data})` :
                isInfrutifero(ultVisita.resultado) ? `⚠️ Permanece Infrutífero: ${categorizarMotivoInfrutifero(ultVisita.resultado) || ultVisita.resultado}` :
                `Executado: ${ultVisita.resultado}`
              ) : 'Pendente de Execução';

              retrabalhosMap.set(r.pde, {
                ...r,
                novaCondicao: cond,
                visitasAnteriores: hist.totalVisitas,
                ultimaData: hist.data || r.ultimaData,
                statusOS: 'EXECUTADA',
                operadorAnterior: hist.ultimoOperador || r.operadorAnterior
              });
            } else {
              retrabalhosMap.set(r.pde, r);
            }
          });
        }

        // 2. Extrai retrabalhos diretamente da planilha de execuções (mesmo sem pendências prévias!)
        for (let i = 0; i < rows.length; i++) {
          if (i > 0 && i % 500 === 0) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          }
          const row = rows[i];
          const pdeRaw = getValFromRow(row, [
            'PDE', 'Imóvel', 'Ligação', 'Cod_PDE', 'Instalação', 'NUM_LIGACAO', 'LIGACAO', 'IMOVEL', 'INSTALACAO', 'CONTRATO', 'Pde', 'pde', 'Imovel', 'Ligacao', 'Instalacao', 'No Ligacao', 'Nº Ligação'
          ]);
          const pdeLimpo = cleanPDE(pdeRaw);
          if (!pdeLimpo) continue;

          const hist = localPdeMap.get(pdeLimpo);
          if (!hist) continue;

          const osNum = String(getValFromRow(row, ['Número OS', 'OS', 'ID', 'Ordem', 'NUM_OS']) || `OS-${pdeLimpo}`).trim();
          const descServicoRaw = String(getValFromRow(row, ['Descrição TSS', 'Serviço', 'TSS', 'Descrição', 'Servico', 'DESCRICAO_TSS']) || '').trim();
          const resultadoRaw = String(getValFromRow(row, ['Resultado', 'Ocorrência', 'Status', 'Desc_Resultado', 'OCORRENCIA', 'RESULTADO']) || '').trim();
          const municipioRaw = String(getValFromRow(row, ['Município', 'Cidade', 'Regional', 'Localidade', 'MUNICIPIO']) || 'São Paulo').trim();
          const bairroRaw = String(getValFromRow(row, ['Bairro', 'Subprefeitura', 'Distrito', 'BAIRRO']) || '').trim();
          const operadorRaw = String(getValFromRow(row, ['Equipe', 'Operador', 'Nome', 'Funcionario', 'Executor', 'EQUIPE', 'OPERADOR']) || '').trim();
          const dtExecRaw = getValFromRow(row, ['Data', 'Data de Execução', 'Data Fim Execução', 'Data Exec', 'Competência', 'DATA']);
          const dataExec = parseExcelDate(dtExecRaw);
          const dataFormatada = formatDataAbrev(dataExec);

          const checkCorte = isCorteEfetivo(resultadoRaw);
          const checkSupr = isSupressaoEfetiva(resultadoRaw);
          const checkRestabRelig = isRestabelecimentoOuReligacao(resultadoRaw, descServicoRaw);
          const checkPOS = isNegociacaoPOS(resultadoRaw, descServicoRaw);
          const checkFatPaga = isFaturaPagaApresentada(resultadoRaw);
          const checkPiso = isReposicaoPiso(resultadoRaw, descServicoRaw);
          const checkInf = isInfrutifero(resultadoRaw, descServicoRaw);
          const eFimDoDia = isFimDoDiaOuBaixaInterna(resultadoRaw);

          if (eFimDoDia) continue;

          const totalVisitas = hist.totalVisitas || 1;
          const falhasCount = hist.falhasCount || (checkInf ? 1 : 0);
          const eRetrabalho = totalVisitas >= 2 || falhasCount >= 1 || isPDEViciado(hist);

          if (eRetrabalho) {
            let condicaoStr = 'Pendente';
            let statusExec: 'EXECUTADO' | 'PENDENTE' | 'INFRUTIFERO_REINCIDENTE' | 'NEGOCIADO_POS' | 'CORTADO' | 'SUPRIMIDO' | 'RESTABELECIDO' = 'EXECUTADO';

            if (checkCorte) {
              condicaoStr = `✅ Cortado Sabesp por ${operadorRaw || 'Equipe'} (${dataFormatada})`;
              statusExec = 'CORTADO';
            } else if (checkSupr) {
              condicaoStr = `✅ Suprimido Sabesp por ${operadorRaw || 'Equipe'} (${dataFormatada})`;
              statusExec = 'SUPRIMIDO';
            } else if (checkRestabRelig) {
              condicaoStr = `✅ Restabelecido / Religado por ${operadorRaw || 'Equipe'} (${dataFormatada})`;
              statusExec = 'RESTABELECIDO';
            } else if (checkPOS) {
              condicaoStr = `✅ Quitado via Maquininha POS (R$ 44,28) por ${operadorRaw || 'Equipe'}`;
              statusExec = 'NEGOCIADO_POS';
            } else if (checkFatPaga) {
              condicaoStr = `✅ Fatura Paga Apresentada no Ato (${dataFormatada})`;
              statusExec = 'EXECUTADO';
            } else if (checkPiso) {
              condicaoStr = `✅ Reposição de Piso Realizada (${dataFormatada})`;
              statusExec = 'EXECUTADO';
            } else if (checkInf) {
              const mot = categorizarMotivoInfrutifero(resultadoRaw, descServicoRaw) || resultadoRaw;
              condicaoStr = `⚠️ Permanece Infrutífero: ${mot} (${dataFormatada})`;
              statusExec = 'INFRUTIFERO_REINCIDENTE';
            }

            const tipoRetrabalho = isPDEViciado(hist) || totalVisitas >= 3
              ? 'PDE_VICIADO'
              : falhasCount > 0
              ? 'INFRUTIFERO_ANTERIOR'
              : 'MULTIVISITAS';

            const itemExist = retrabalhosMap.get(pdeLimpo);
            if (!itemExist || statusExec !== 'INFRUTIFERO_REINCIDENTE') {
              retrabalhosMap.set(pdeLimpo, {
                id: `ret-exec-${osNum}-${pdeLimpo}`,
                os: osNum,
                pde: pdeLimpo,
                pdeFormatado: pdeLimpo,
                descricao: descServicoRaw || 'Serviço de Cobrança',
                frente: inferirFrente(descServicoRaw, municipioRaw, bairroRaw),
                municipio: municipioRaw || 'São Paulo',
                bairro: bairroRaw || '-',
                equipeAtual: operadorRaw || '-',
                operadorAlocado: operadorRaw,
                statusOS: 'EXECUTADA',
                visitasAnteriores: totalVisitas,
                ultimaData: dataFormatada,
                motivoFalhaAnterior: resultadoRaw,
                operadorAnterior: operadorRaw || hist.ultimoOperador || 'Equipe',
                tipoRetrabalho,
                isCobranca: true,
                novaCondicao: condicaoStr,
                statusExecucao: statusExec,
                dataUltimaExecucao: dataFormatada,
                operadorUltimaExecucao: operadorRaw,
                historicoVisitas: hist.historicoDetalhado || []
              });
            }
          }
        }

        const listaRetrabalhosExec = Array.from(retrabalhosMap.values());
        setRetrabalho(listaRetrabalhosExec);

        // REGISTRAR CARGA NO HISTÓRICO DE AUDITORIA
        const minData = listaDatasOrdenadas[0] || 'Hoje';
        const maxData = listaDatasOrdenadas[listaDatasOrdenadas.length - 1] || 'Hoje';
        const periodoStr = listaDatasOrdenadas.length > 1 ? `${minData} até ${maxData}` : minData;

        const novoRegistroCarga: RegistroCarga = {
          id: `carga-exec-${Date.now()}`,
          tipo: 'EXECUCOES',
          usuarioNome: usuarioLogado?.nome || 'Supervisor',
          usuarioEmail: usuarioLogado?.email || 'matheusf566@gmail.com',
          dataHora: new Date().toLocaleString('pt-BR'),
          totalLinhas: rows.length,
          periodo: periodoStr,
          resumo: `${rows.length.toLocaleString('pt-BR')} linhas • ${totalCortesSupressoes} cortes/supressões Sabesp • ${totalNegociacoesPOS} POS • R$ ${formatMoney(valorFaturadoTotal)} faturados`,
          detalhes: {
            cortesSupressoes: totalCortesSupressoes,
            positivas: totalPositivas,
            infrutiferas: totalInfrutiferas,
            faturado: valorFaturadoTotal
          }
        };
        await salvarRegistroCarga(novoRegistroCarga);
        setHistoricoCargas((prev) => [novoRegistroCarga, ...prev]);

        // SALVAR SESSÃO ATIVA NO BANCO LOCAL E COMPARTILHADO
        const sessaoSalvar: SessaoAtiva = {
          id: 'ultima_sessao',
          dataSalvamento: new Date().toLocaleString('pt-BR'),
          usuarioEmail: usuarioLogado?.email,
          usuarioNome: usuarioLogado?.nome,
          totalExecucoesProcessadas: rows.length,
          execucoesBrutasResumo: resumoAtualizado,
          producaoOperadores: producaoArray,
          infrutiferasEstatisticas: motivosStats,
          evolucaoDiaria: evolucaoArray,
          reposicoesPiso: reposicoesPisoArray,
          urgencias,
          retrabalho: listaRetrabalhosExec,
          carteiraLivre,
          totalCarteiraImportada,
          duplicidadesCarteiraCount,
          datasDisponiveis: listaDatasOrdenadas,
          operadoresExcluidos,
          linhasExecucoesBrutas: rows
        };
        await salvarSessaoAtiva(sessaoSalvar);

        void sincronizarSessaoCompartilhada(sessaoSalvar);

        showToast(
          `✅ Execuções Processadas! ${rows.length.toLocaleString('pt-BR')} linhas (${totalCortesSupressoes} cortes/supressões, ${totalNegociacoesPOS} POS, ${totalReposicoesPiso} reposições).`
        );
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Erro ao processar execuções:', error);
        alert('Erro ao processar arquivo de execuções: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [pdeHistoricoMap, equipe, showToast, sincronizarSessaoCompartilhada]
  );

  // ========================================================
  // MOTOR 2: CARGA DE PENDÊNCIAS (FUTURO / CARTEIRA)
  // ========================================================
  const processarLinhasPendencias = useCallback(
    async (rows: Record<string, unknown>[]) => {
      const now = new Date();
      setIsLoading(true);
      setLoadingMsg({
        title: '🔍 MOTOR 2: Triando Carteira de Pendências...',
        subtitle: `Executando Anti-Retrabalho, Detecção de Duplicidade e Radar de Prazos...`
      });

      await new Promise((resolve) => setTimeout(resolve, 60));

      try {
        const listaUrgencias: UrgenciaItem[] = [];
        const listaRetrabalho: RetrabalhoItem[] = [];
        const listaLivre: CarteiraLivreItem[] = [];

        // =========================================================================
        // CONSOLIDAÇÃO INTELIGENTE DO BANCO HISTÓRICO DE PDES (MOTOR LOCAL)
        // Agrupa registros redundantes (formatos com ou sem zeros à esquerda, espaços,
        // múltiplos registros históricos do mesmo PDE) acumulando o total de visitas,
        // falhas infrutíferas e todo o histórico detalhado de ocorrências.
        // =========================================================================
        const mapaHistoricoConsolidado = new Map<
          string,
          {
            pde: string;
            totalVisitas: number;
            falhasCount: number;
            isInfrutifero: boolean;
            ultimaData: string;
            ultimoMotivo: string;
            ultimoOperador: string;
            historicoDetalhado: HistoricoVisitaItem[];
          }
        >();

        pdeHistoricoMap.forEach((reg, chaveMap) => {
          const pdeKey = cleanPDE(chaveMap) || cleanPDE(reg.pde);
          if (!pdeKey) return;

          // Extrai e normaliza visitas detalhadas
          const visitasDoReg: HistoricoVisitaItem[] = [];
          if (Array.isArray(reg.historicoDetalhado) && reg.historicoDetalhado.length > 0) {
            reg.historicoDetalhado.forEach((v) => {
              const res = v.resultado || '';
              visitasDoReg.push({
                data: v.data || '-',
                resultado: res,
                operador: v.operador || reg.ultimoOperador || '',
                os: v.os || reg.os || '',
                isInfrutifero: v.isInfrutifero ?? isInfrutifero(res)
              });
            });
          } else if (reg.resultado || reg.data) {
            const res = reg.resultado || '';
            visitasDoReg.push({
              data: reg.data || '-',
              resultado: res,
              operador: reg.ultimoOperador || '',
              os: reg.os || '',
              isInfrutifero: reg.isInfrutifero ?? isInfrutifero(res)
            });
          }

          // Computa falhas e visitas deste registro (EXPURGANDO TOTALMENTE BAIXAS DE FIM DO DIA)
          const visitasReais = visitasDoReg.filter((v) => !isFimDoDiaOuBaixaInterna(v.resultado));
          const falhasNoDetalhado = visitasReais.filter((v) => v.isInfrutifero || isInfrutifero(v.resultado)).length;
          const falhasReg = falhasNoDetalhado;
          const visitasReg = visitasReais.length;

          const existente = mapaHistoricoConsolidado.get(pdeKey);
          if (!existente) {
            mapaHistoricoConsolidado.set(pdeKey, {
              pde: pdeKey,
              totalVisitas: visitasReg,
              falhasCount: falhasReg,
              isInfrutifero: Boolean(falhasReg > 0),
              ultimaData: reg.data && reg.data !== '-' ? reg.data : visitasDoReg[visitasDoReg.length - 1]?.data || '-',
              ultimoMotivo: reg.resultado || visitasDoReg[visitasDoReg.length - 1]?.resultado || 'Visita Anterior',
              ultimoOperador: reg.ultimoOperador || visitasDoReg[visitasDoReg.length - 1]?.operador || '',
              historicoDetalhado: [...visitasDoReg]
            });
          } else {
            // REGISTRO REDUNDANTE NO BANCO LOCAL: Acumula as visitas reais e falhas de forma unificada
            existente.totalVisitas += visitasReg;
            existente.falhasCount += falhasReg;
            if (falhasReg > 0) {
              existente.isInfrutifero = true;
            }
            if (reg.data && reg.data !== '-') {
              existente.ultimaData = reg.data;
            }
            if (reg.resultado) {
              existente.ultimoMotivo = reg.resultado;
            }
            if (reg.ultimoOperador) {
              existente.ultimoOperador = reg.ultimoOperador;
            }

            // Evita duplicar exatamente o mesmo registro detalhado
            visitasDoReg.forEach((vNova) => {
              const jaExiste = existente.historicoDetalhado.some(
                (vExist) =>
                  vExist.data === vNova.data &&
                  normalize(vExist.resultado) === normalize(vNova.resultado) &&
                  (vExist.os === vNova.os || (!vExist.os && !vNova.os))
              );
              if (!jaExiste) {
                existente.historicoDetalhado.push(vNova);
              }
            });
          }
        });

        // Track internal duplicates inside the current file
        const pdesVistosNestaCarteira = new Map<string, number>();
        let duplicidadesDetectadas = 0;

        for (let i = 0; i < rows.length; i++) {
          if (i > 0 && i % 500 === 0) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          }
          const row = rows[i];
          const pdeRaw = getValFromRow(row, [
            'PDE',
            'Imóvel',
            'Ligação',
            'Cod_PDE',
            'Instalação',
            'NUM_LIGACAO',
            'LIGACAO',
            'IMOVEL',
            'INSTALACAO',
            'CONTRATO',
            'Pde',
            'pde',
            'Imovel',
            'Ligacao',
            'Instalacao',
            'No Ligacao',
            'Nº Ligação',
            'HIDROMETRO',
            'HD',
            'MATRICULA'
          ]);
          const pdeLimpo = cleanPDE(pdeRaw);
          const descServico = String(getValFromRow(row, ['Descrição TSS', 'Serviço', 'TSS', 'Descrição', 'Servico', 'DESCRICAO_TSS']) || '').trim();
          if (!descServico && !pdeLimpo) continue;

          const osNum = String(getValFromRow(row, ['Número OS', 'OS', 'ID', 'Ordem', 'NUM_OS']) || `OS-${i + 1}`).trim();
          const municipio = String(getValFromRow(row, ['Município', 'Cidade', 'Regional', 'Localidade', 'MUNICIPIO']) || '').trim();
          const bairro = String(getValFromRow(row, ['Bairro', 'Subprefeitura', 'Distrito', 'BAIRRO']) || '').trim();
          const equipeDesignada = String(getValFromRow(row, ['Equipe', 'Operador', 'Encarregado', 'EQUIPE', 'RECURSO']) || '-').trim();
          const statusOS = String(getValFromRow(row, ['Status OS', 'Status', 'Situação', 'STATUS', 'SITUACAO', 'STATUS_OS', 'Fase', 'FASE']) || 'DESPACHADA').trim();
          const dtCompRaw = getValFromRow(row, ['Data de Competência', 'Competência', 'Data Inserção', 'Data Criacao', 'Data', 'DATA_COMPETENCIA']);
          const dtCompetencia = parseExcelDate(dtCompRaw);

          // VERIFICADOR DE DUPLICIDADE INTERNA (A Sabesp mandou 2x o mesmo PDE hoje?)
          let isDuplicadaHoje = false;
          if (pdeLimpo) {
            const countAtual = pdesVistosNestaCarteira.get(pdeLimpo) || 0;
            if (countAtual > 0) {
              isDuplicadaHoje = true;
              duplicidadesDetectadas++;
            }
            pdesVistosNestaCarteira.set(pdeLimpo, countAtual + 1);
          }

          // FILTRO 1: Guarita Anti-Retrabalho & Detector de PDEs Repetidos (Consulta ao Histórico Consolidado)
          const pdeSemZeros = pdeLimpo.replace(/^0+/, '');
          const memoHistorico = pdeLimpo
            ? mapaHistoricoConsolidado.get(pdeLimpo) || (pdeSemZeros ? mapaHistoricoConsolidado.get(pdeSemZeros) : undefined)
            : undefined;

          // Total preciso de visitas acumuladas no histórico local
          const visitasDoHistorico = memoHistorico
            ? Math.max(memoHistorico.totalVisitas, memoHistorico.falhasCount)
            : 0;

          const teveFalhaRecente = Boolean(
            memoHistorico &&
              visitasDoHistorico > 0 &&
              (memoHistorico.isInfrutifero ||
                memoHistorico.falhasCount > 0 ||
                memoHistorico.historicoDetalhado.some((d) => d.isInfrutifero || isInfrutifero(d.resultado)))
          );

          const teveMultiVisitas = Boolean(visitasDoHistorico >= 2);
          const eRepetidoOuRetrabalho = teveFalhaRecente || teveMultiVisitas || isDuplicadaHoje;

          if (eRepetidoOuRetrabalho) {
            let tipoRetrabalho: 'INFRUTIFERO_ANTERIOR' | 'MULTIVISITAS' | 'DUPLICIDADE_CARTEIRA' = 'INFRUTIFERO_ANTERIOR';
            let motivoFalha = memoHistorico?.ultimoMotivo || 'Visita Repetida';
            let visitasQtd = visitasDoHistorico || 1;

            if (isDuplicadaHoje) {
              const repeteHojeCount = pdesVistosNestaCarteira.get(pdeLimpo) || 1;
              tipoRetrabalho = 'DUPLICIDADE_CARTEIRA';
              motivoFalha = `Duplicada na Carteira de Hoje (${repeteHojeCount}ª OS enviada pela Sabesp)`;
              visitasQtd += (repeteHojeCount - 1);
            } else if (teveFalhaRecente) {
              tipoRetrabalho = 'INFRUTIFERO_ANTERIOR';
              // Pega o motivo da falha mais recente registrada no histórico detalhado
              const ultimaFalhaItem = memoHistorico?.historicoDetalhado
                .slice()
                .reverse()
                .find((d) => !isFimDoDiaOuBaixaInterna(d.resultado) && (d.isInfrutifero || isInfrutifero(d.resultado)));
              motivoFalha = ultimaFalhaItem?.resultado || memoHistorico?.ultimoMotivo || 'Falha Infrutífera';
            } else if (teveMultiVisitas) {
              tipoRetrabalho = 'MULTIVISITAS';
              motivoFalha = `Visitado ${visitasQtd}x no Histórico Recente`;
            }

            listaRetrabalho.push({
              id: `${osNum}-${pdeLimpo}-${i}`,
              os: osNum,
              pde: pdeLimpo,
              pdeFormatado: pdeLimpo,
              descricao: descServico || 'Ordem Pendente',
              frente: inferirFrente(descServico, municipio),
              municipio: municipio || 'São Paulo',
              bairro: bairro || '-',
              equipeAtual: equipeDesignada,
              operadorAlocado: equipeDesignada !== '-' ? equipeDesignada : undefined,
              statusOS: statusOS,
              visitasAnteriores: visitasQtd,
              ultimaData: memoHistorico?.ultimaData || 'Hoje',
              motivoFalhaAnterior: motivoFalha,
              operadorAnterior: memoHistorico?.ultimoOperador || 'Equipe Anterior',
              tipoRetrabalho: tipoRetrabalho,
              duplicadaNaCarteira: isDuplicadaHoje,
              historicoVisitas: memoHistorico?.historicoDetalhado || [],
              isCobranca: isServicoCobranca(descServico)
            });
            continue; // OS Bloqueada/Sequestrada
          }

          // FILTRO 2: Radar de Urgências e Cobrança
          const slaCalc = calcularPrazoFatal(descServico, dtCompetencia);
          const isCobrancaServico = isServicoCobranca(descServico);

          if (slaCalc.isUrgencia) {
            const diff = formatTempoRestante(slaCalc.vencReal, now);

            listaUrgencias.push({
              id: `${osNum}-${pdeLimpo}-${i}`,
              os: osNum,
              pde: pdeLimpo,
              pdeFormatado: pdeLimpo,
              descricao: descServico,
              tipoUrgencia: slaCalc.tipoUrgencia,
              frente: inferirFrente(descServico, municipio),
              municipio: municipio || 'São Paulo',
              bairro: bairro || '-',
              equipe: equipeDesignada,
              operadorAlocado: equipeDesignada !== '-' ? equipeDesignada : undefined,
              statusOS: statusOS,
              dtCompetencia: dtCompetencia,
              vencReal: slaCalc.vencReal,
              horarioVencimento: formatDataHoraVencimento(slaCalc.vencReal),
              statusPrazo: diff.status,
              horasRestantes: diff.horasRestantes,
              tempoFormatado: diff.texto,
              duplicadaNaCarteira: isDuplicadaHoje,
              isCobranca: isCobrancaServico
            });
          } else {
            // Carteira Livre: inclui cálculo de vencimento para serviços de cobrança
            const isVencidaLivre = slaCalc.vencReal.getTime() < now.getTime();
            const diasVencidaLivre = isVencidaLivre
              ? Math.max(1, Math.floor((now.getTime() - slaCalc.vencReal.getTime()) / (1000 * 60 * 60 * 24)))
              : 0;
            let tipoCobranca: 'CORTE' | 'SUPRESSAO' | 'VISTORIA' | 'OUTRO' = 'OUTRO';
            const normDesc = normalize(descServico);
            if (normDesc.includes('CORTE') || normDesc.includes('CORTAR')) tipoCobranca = 'CORTE';
            else if (normDesc.includes('SUPRESS') || normDesc.includes('SUPRIM')) tipoCobranca = 'SUPRESSAO';
            else if (normDesc.includes('VISTORIA')) tipoCobranca = 'VISTORIA';

            listaLivre.push({
              id: `${osNum}-${pdeLimpo}-${i}`,
              os: osNum,
              pde: pdeLimpo,
              descricao: descServico,
              frente: inferirFrente(descServico, municipio),
              municipio: municipio || 'São Paulo',
              bairro: bairro || '-',
              dtCompetencia: dtCompetencia,
              equipe: equipeDesignada,
              operadorAlocado: equipeDesignada !== '-' ? equipeDesignada : undefined,
              statusOS: statusOS,
              duplicadaNaCarteira: isDuplicadaHoje,
              isCobranca: isCobrancaServico,
              isVencido: isVencidaLivre,
              diasVencido: diasVencidaLivre,
              tipoCobranca
            });
          }
        }

        // Ordenar Urgências rigorosamente por quem vence primeiro (mais crítico)
        listaUrgencias.sort((a, b) => a.vencReal.getTime() - b.vencReal.getTime());

        // Ordenar Retrabalho pelo maior número de falhas
        listaRetrabalho.sort((a, b) => b.visitasAnteriores - a.visitasAnteriores);

        setUrgencias(listaUrgencias);
        setRetrabalho(listaRetrabalho);
        setCarteiraLivre(listaLivre);
        setTotalCarteiraImportada(rows.length);
        setDuplicidadesCarteiraCount(duplicidadesDetectadas);

        // REGISTRAR CARGA NO HISTÓRICO DE AUDITORIA
        const novoRegistroCarga: RegistroCarga = {
          id: `carga-pend-${Date.now()}`,
          tipo: 'PENDENCIAS',
          usuarioNome: usuarioLogado?.nome || 'Supervisor',
          usuarioEmail: usuarioLogado?.email || 'matheusf566@gmail.com',
          dataHora: new Date().toLocaleString('pt-BR'),
          totalLinhas: rows.length,
          periodo: new Date().toLocaleDateString('pt-BR'),
          resumo: `${rows.length.toLocaleString('pt-BR')} pendências triadas (${listaUrgencias.length} urgências • ${listaRetrabalho.length} bloqueios por retrabalho)`,
          detalhes: {
            urgencias: listaUrgencias.length,
            retrabalho: listaRetrabalho.length
          }
        };
        await salvarRegistroCarga(novoRegistroCarga);
        setHistoricoCargas((prev) => [novoRegistroCarga, ...prev]);

        // SALVAR SESSÃO ATIVA NO BANCO LOCAL E COMPARTILHADO
        const sessaoParaSalvarPend: SessaoAtiva = {
          id: 'ultima_sessao',
          dataSalvamento: new Date().toLocaleString('pt-BR'),
          usuarioEmail: usuarioLogado?.email,
          usuarioNome: usuarioLogado?.nome,
          totalExecucoesProcessadas,
          execucoesBrutasResumo,
          producaoOperadores,
          infrutiferasEstatisticas,
          evolucaoDiaria,
          reposicoesPiso,
          urgencias: listaUrgencias,
          retrabalho: listaRetrabalho,
          carteiraLivre: listaLivre,
          totalCarteiraImportada: rows.length,
          duplicidadesCarteiraCount: duplicidadesDetectadas,
          datasDisponiveis,
          operadoresExcluidos
        };
        await salvarSessaoAtiva(sessaoParaSalvarPend);

        void sincronizarSessaoCompartilhada(sessaoParaSalvarPend);

        showToast(
          `🎯 Carteira Triada & Salva no Banco! ${listaUrgencias.length} Urgências, ${listaRetrabalho.length} Bloqueadas por Retrabalho, ${listaLivre.length} Livres.`
        );
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Erro na triagem de pendências:', error);
        alert('Erro ao processar arquivo de pendências: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [pdeHistoricoMap, showToast, usuarioLogado, totalExecucoesProcessadas, execucoesBrutasResumo, producaoOperadores, infrutiferasEstatisticas, evolucaoDiaria, datasDisponiveis, sincronizarSessaoCompartilhada]
  );

  // File Handlers
  const handleFilePendencias = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const { rows } = await readExcelInWorker(file, 'pendencias');
      if (rows.length > 0) {
        const colunas = Object.keys(rows[0]);
        const validacao = validarArquivoPendencia(colunas);
        if (!validacao.valido) {
          const prosseguir = confirm(
            `⚠️ ATENÇÃO: ARQUIVO INCOMPATÍVEL DETECTADO!\n\n${validacao.motivo}\n\nDeseja forçar o processamento mesmo assim?`
          );
          if (!prosseguir) return;
        }
      }
      processarLinhasPendencias(rows);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erro ao ler planilha de pendências no Worker:', error);
      alert('Erro ao ler planilha de pendências: ' + error.message);
    }
  };

  const handleFileExecucoes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const { rows } = await readExcelInWorker(file, 'execucoes');
      if (rows.length > 0) {
        const colunas = Object.keys(rows[0]);
        const validacao = validarArquivoExecucao(colunas);
        if (!validacao.valido) {
          const prosseguir = confirm(
            `⚠️ ATENÇÃO: ARQUIVO INCOMPATÍVEL DETECTADO!\n\n${validacao.motivo}\n\nDeseja forçar o processamento mesmo assim?`
          );
          if (!prosseguir) return;
        }

          // Identifica operadores na planilha para cadastro prévio
          const nomesPlanilha = new Map<string, string>();
          for (let i = 0; i < rows.length; i++) {
            if (i > 0 && i % 500 === 0) {
              await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
            }
            const r = rows[i];
            const opRaw = String(getValFromRow(r, ['Equipe', 'Operador', 'Nome', 'Funcionario', 'Executor', 'EQUIPE', 'OPERADOR']) || '').trim();
            if (opRaw) {
              const norm = normalize(opRaw);
              if (!nomesPlanilha.has(norm)) {
                nomesPlanilha.set(norm, opRaw);
              }
            }
          }

          const naoCadastrados: {
            nome: string;
            nomeNormalizado: string;
            frente: 'Cobrança Leste' | 'Cobrança Alto Tietê' | 'Apoio Externo';
            veiculo: 'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro';
            tipoEquipe: 'PROPRIA' | 'APOIO_EXTERNO';
            meta: number;
            percComissao: number;
          }[] = [];

          nomesPlanilha.forEach((nomeOriginal, norm) => {
            const jaExiste = equipe.some((op) => op.nomeNormalizado === norm);
            if (!jaExiste) {
              naoCadastrados.push({
                nome: nomeOriginal,
                nomeNormalizado: norm,
                frente: 'Cobrança Leste',
                veiculo: 'Moto',
                tipoEquipe: 'PROPRIA',
                meta: METAS_PADRAO.metaMoto,
                percComissao: METAS_PADRAO.percComissaoPadrao
              });
            }
          });

          let novaEquipe = [...equipe];
          if (naoCadastrados.length > 0) {
            const novosOpsParaSalvar: Operador[] = naoCadastrados.map((item) => ({
              nome: item.nome,
              nomeNormalizado: item.nomeNormalizado,
              frente: 'Cobrança Leste',
              veiculo: 'Moto',
              tipoEquipe: 'PROPRIA',
              meta: METAS_PADRAO.metaMoto,
              percComissao: METAS_PADRAO.percComissaoPadrao,
              ativo: true
            }));
            novaEquipe = [...equipe, ...novosOpsParaSalvar];
            await salvarEquipeEmLote(novosOpsParaSalvar);
            setEquipe(novaEquipe);
            setOperadoresPendentesConfig((prev) => [...prev, ...novosOpsParaSalvar]);
            showToast(`👥 ${novosOpsParaSalvar.length} novos operadores salvos! Ajuste suas frentes na aba Equipe quando desejar.`);
          }

          // Anti-Soma Dupla (Desduplicação Inteligente por Chave Única OS + Data + Resultado)
          let rowsParaProcessar = rows;
          if (modoCarga === 'INCREMENTAL' && linhasExecucoesBrutas.length > 0) {
            const chavesExistentes = new Set<string>();
            for (let i = 0; i < linhasExecucoesBrutas.length; i++) {
              if (i > 0 && i % 500 === 0) {
                await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
              }
              const r = linhasExecucoesBrutas[i];
              const os = String(getValFromRow(r, ['Número OS', 'OS', 'ID', 'Ordem', 'NUM_OS']) || '').trim();
              const dt = String(getValFromRow(r, ['Data', 'Data de Execução', 'Data Fim Execução', 'Data Exec', 'Competência', 'DATA']) || '').trim();
              const res = String(getValFromRow(r, ['Resultado', 'Ocorrência', 'Status', 'Desc_Resultado', 'OCORRENCIA', 'RESULTADO']) || '').trim();
              chavesExistentes.add(`${os}_${dt}_${res}`);
            }

            let novasLinhasAdicionadas = 0;
            let duplicadasIgnoradas = 0;
            const linhasNovasUnicas: Record<string, unknown>[] = [];

            for (let i = 0; i < rows.length; i++) {
              if (i > 0 && i % 500 === 0) {
                await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
              }
              const r = rows[i];
              const os = String(getValFromRow(r, ['Número OS', 'OS', 'ID', 'Ordem', 'NUM_OS']) || '').trim();
              const dt = String(getValFromRow(r, ['Data', 'Data de Execução', 'Data Fim Execução', 'Data Exec', 'Competência', 'DATA']) || '').trim();
              const res = String(getValFromRow(r, ['Resultado', 'Ocorrência', 'Status', 'Desc_Resultado', 'OCORRENCIA', 'RESULTADO']) || '').trim();
              const chave = `${os}_${dt}_${res}`;
              if (chavesExistentes.has(chave)) {
                duplicadasIgnoradas++;
              } else {
                chavesExistentes.add(chave);
                linhasNovasUnicas.push(r);
                novasLinhasAdicionadas++;
              }
            }

            rowsParaProcessar = [...linhasExecucoesBrutas, ...linhasNovasUnicas];
            setLinhasExecucoesBrutas(rowsParaProcessar);
            showToast(`➕ Alimentação Contínua: ${novasLinhasAdicionadas} novas ordens somadas (${duplicadasIgnoradas} repetidas foram desduplicadas).`);
          } else {
            setLinhasExecucoesBrutas(rows);
          }

        processarLinhasExecucoes(rowsParaProcessar, novaEquipe);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erro ao ler planilha de execuções no Worker:', error);
      alert('Erro ao ler planilha de execuções: ' + error.message);
    }
  };

  // Salvar novos operadores detectados na planilha de execuções e continuar
  const handleConfirmarNovosOperadores = async () => {
    const novosOpsParaSalvar: Operador[] = novosOperadoresDetectados.map((item) => ({
      nome: item.nome,
      nomeNormalizado: item.nomeNormalizado,
      frente: item.tipoEquipe === 'APOIO_EXTERNO' ? 'Apoio Externo' : item.frente,
      veiculo: item.veiculo,
      tipoEquipe: item.tipoEquipe,
      meta: item.tipoEquipe === 'APOIO_EXTERNO' ? 0 : item.meta,
      percComissao: item.tipoEquipe === 'APOIO_EXTERNO' ? 0 : item.percComissao,
      ativo: true
    }));

    const novaEquipe = [...equipe, ...novosOpsParaSalvar];
    await salvarEquipeEmLote(novosOpsParaSalvar);
    setEquipe(novaEquipe);
    setModalNovosOperadoresOpen(false);

    if (pendingExecucaoRows) {
      const rows = pendingExecucaoRows;
      setPendingExecucaoRows(null);
      processarLinhasExecucoes(rows, novaEquipe);
    }
    showToast(`✅ ${novosOpsParaSalvar.length} operadores cadastrados com sucesso no banco!`);
  };

  // Continuar tratando não-cadastrados como Apoio Temporário
  const handlePularCadastroComoApoio = async () => {
    const opsApoio: Operador[] = novosOperadoresDetectados.map((item) => ({
      nome: item.nome,
      nomeNormalizado: item.nomeNormalizado,
      frente: 'Apoio Externo',
      veiculo: 'Moto',
      tipoEquipe: 'APOIO_EXTERNO',
      meta: 0,
      percComissao: 0,
      ativo: true
    }));

    const novaEquipe = [...equipe, ...opsApoio];
    await salvarEquipeEmLote(opsApoio);
    setEquipe(novaEquipe);
    setModalNovosOperadoresOpen(false);

    if (pendingExecucaoRows) {
      const rows = pendingExecucaoRows;
      setPendingExecucaoRows(null);
      processarLinhasExecucoes(rows, novaEquipe);
    }
    showToast('Operadores classificados como Apoio Externo na Cobrança.');
  };

  // Copiar Memorando de Justificativa Sabesp (Meta 9.220 Cortes/Supressões & Ordens Viciadas)
  const copiarJustificativaSabesp = () => {
    const dHoje = formatDataAbrev(new Date());
    const realizados = execucoesBrutasResumo.totalCortesSupressoes;
    const meta = META_SABESP_CORTES;
    const percAtingido = ((realizados / meta) * 100).toFixed(1);
    const gap = Math.max(0, meta - realizados);
    const pdesViciadosCount = Array.from(pdeHistoricoMap.values()).filter((p) => p.totalVisitas >= 2 && p.isInfrutifero).length;
    const totalInfrutiferas = execucoesBrutasResumo.totalInfrutiferas;

    const texto = `📑 *MEMORANDO TÉCNICO OPERACIONAL – DESEMPENHO DE CORTES & SUPRESSÕES (SABESP)*
📅 *Data:* ${dHoje} | *Frente:* Cobrança Alto & Leste (Enorsul)

1. *METAS CONTRATUAIS E REALIZAÇÃO:*
• Meta Mensal Estipulada Sabesp: 9.220 cortes/supressão
• Cortes/Supressões Efetivados: ${realizados} (${percAtingido}%)
• Déficit / Gap Atual: ${gap} ordens

2. *ORDENS VICIADAS E IMPACTO NA EFICIÊNCIA OPERACIONAL:*
• Total de PDEs Viciados Catalogados (2+ visitas anteriores infrutíferas): ${pdesViciadosCount}
• Total de Visitas Frustradas por Impedimentos no Imóvel: ${totalInfrutiferas}
• Impacto: Uma parcela substancial das tentativas de corte é absorvida por reiterações em imóveis com impedimentos crônicos, gerando ociosidade involuntária e deslocamentos improdutivos da equipe.

3. *PRINCIPAIS MOTIVOS DE IMPEDIMENTO EXTERNO:*
${infrutiferasEstatisticas.slice(0, 5).map((m) => `• ${m.motivo}: ${m.quantidade} OS (${m.percentual}%)`).join('\n')}

4. *PLEITO E JUSTIFICATIVA À FISCALIZAÇÃO:*
A operação diligenciou 100% dos despachos disponibilizados. O não atingimento linear da meta contratual vincula-se diretamente à alta incidência de ordens viciadas (imóveis fechados, morador ausente e impedimentos físicos reiterados). Solicita-se a higienização da carteira e remanejamento desses casos para ações específicas de fiscalização/corte no ramal externo.`;

    navigator.clipboard.writeText(texto).then(() => {
      showToast('📋 Memorando de Justificativa para a Sabesp copiado com sucesso!');
    });
  };

  // Exportar Backup
  const handleExportarBackup = async () => {
    try {
      const backup = await gerarBackupCompleto();
      const payload: BackupData = {
        versao: '2.0-alto-leste',
        dataExportacao: new Date().toISOString(),
        equipe: backup.equipe,
        historico: backup.historico
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_TorreControle_Sabesp_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('💾 Backup exportado com sucesso!');
    } catch (err: unknown) {
      const error = err as Error;
      alert('Erro ao exportar backup: ' + error.message);
    }
  };

  // Restaurar Backup
  const handleRestaurarBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const { opsCount, pdesCount } = await restaurarBackupCompleto(json);
        const [ops, pdes] = await Promise.all([carregarEquipe(), carregarTodosPDEs()]);
        setEquipe(ops);
        setPdeHistoricoMap(pdes);
        showToast(`🎉 Backup restaurado! ${opsCount} operadores e ${pdesCount} PDEs importados.`);
      } catch (err: unknown) {
        const error = err as Error;
        alert('Erro ao restaurar arquivo de backup: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Limpar Banco de PDEs
  const handleLimparBanco = async () => {
    if (confirm('Atenção: Deseja realmente zerar todo o histórico de PDEs salvos no banco local IndexedDB?')) {
      await limparBancoPDEs();
      setPdeHistoricoMap(new Map());
      setRetrabalho([]);
      showToast('🧹 Memória de PDEs limpa com sucesso!');
    }
  };

  // Exportar Ordens Bloqueadas (Retrabalho Cobrança) para Excel
  const exportarRetrabalhoExcel = () => {
    if (retrabalhoFiltrado.length === 0) {
      alert('Não há ordens de retrabalho de cobrança para exportar.');
      return;
    }
    const dadosExcel = retrabalhoFiltrado.map((r) => ({
      Alerta: 'BLOQUEADA - RETRABALHO COBRANÇA',
      'Nova OS': r.os,
      'PDE (Higienizado)': r.pde,
      'Serviço Solicitado': r.descricao,
      Frente: r.frente,
      Município: r.municipio,
      Bairro: r.bairro,
      'Nº de Visitas Anteriores': r.visitasAnteriores,
      'Última Visita Realizada': r.ultimaData,
      'Motivo da Falha': r.motivoFalhaAnterior,
      'Operador que Visitou': r.operadorAnterior
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Retrabalho Cobrança');
    XLSX.writeFile(wb, `Sabesp_Retrabalho_Cobranca_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📊 Planilha de Retrabalho (Cobrança) exportada para despacho/contestação!');
  };

  // Exportar Infrutíferas / Retrabalho de Outras Frentes para Excel
  const exportarOutrasFrentesExcel = () => {
    if (retrabalhoOutrasFrentesFiltrado.length === 0) {
      alert('Não há visitas de outras frentes para exportar.');
      return;
    }
    const dadosExcel = retrabalhoOutrasFrentesFiltrado.map((r) => ({
      Alerta: 'INFRUTÍFERA - OUTRAS FRENTES',
      'Nova OS': r.os,
      'PDE (Higienizado)': r.pde,
      'Serviço TSS': r.descricao,
      Frente: r.frente,
      Município: r.municipio,
      Bairro: r.bairro,
      'Nº de Visitas': r.visitasAnteriores,
      'Última Visita Realizada': r.ultimaData,
      'Motivo da Falha Registrado': r.motivoFalhaAnterior,
      'Operador Anterior': r.operadorAnterior
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outras Frentes');
    XLSX.writeFile(wb, `Sabesp_Infrutiferas_Outras_Frentes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📑 Planilha de Outras Frentes exportada para repasse aos setores!');
  };

  // Exportar Urgências para Excel
  const exportarUrgenciasExcel = () => {
    if (urgencias.length === 0) {
      alert('Não há urgências para exportar.');
      return;
    }
    const dadosExcel = urgencias.map((u) => ({
      Status: u.statusPrazo,
      OS: u.os,
      'PDE (Higienizado)': u.pde,
      'Serviço TSS': u.descricao,
      Frente: u.frente,
      Município: u.municipio,
      Bairro: u.bairro,
      Equipe: u.equipe,
      'Prazo Fatal': formatDataHora(u.vencReal),
      'Tempo Restante': u.tempoFormatado
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Urgências Restab e Piso');
    XLSX.writeFile(wb, `Sabesp_Urgencias_Restab_Piso_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('⚡ Planilha de Urgências exportada para despacho!');
  };

  // Exportar Carteira Livre para Excel
  const exportarCarteiraLivreExcel = () => {
    if (carteiraLivreFiltrada.length === 0) {
      alert('Não há ordens na carteira livre para exportar.');
      return;
    }
    const dadosExcel = carteiraLivreFiltrada.map((item) => ({
      OS: item.os,
      'PDE (Higienizado)': item.pde,
      'Serviço Solicitado': item.descricao,
      Frente: item.frente,
      Município: item.municipio,
      Bairro: item.bairro,
      Competência: formatDataAbrev(item.dtCompetencia),
      Equipe: item.equipe || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Carteira Livre');
    XLSX.writeFile(wb, `Sabesp_Carteira_Livre_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('📂 Planilha de Carteira Livre exportada com sucesso!');
  };

  // Exportar Produção para Excel
  const exportarProducaoExcel = () => {
    const dados = producaoFiltrada.filter((op) =>
      activeTab === 'cobranca_leste'
        ? op.frente.includes('Leste')
        : activeTab === 'cobranca_alto'
        ? op.frente.includes('Alto')
        : true
    );
    if (dados.length === 0) {
      alert('Não há dados de produção para exportar.');
      return;
    }
    const dadosExcel = dados.map((op) => ({
      Operador: op.nome,
      Veículo: op.veiculo,
      Frente: op.frente,
      'Total OS': op.totalOS,
      'Cortes / Supr.': op.cortesSupressoes,
      'Cortes Só': op.cortes || 0,
      'Supressões': op.supressoes || 0,
      'Restabes / Religações': (op.restabes || 0) + (op.religacoes || 0),
      'Negociações POS': op.negociacoesPOS || 0,
      'Reposições Piso': op.reposicoesPiso || 0,
      Positivas: op.positivas,
      Infrutíferas: op.infrutiferas,
      'Fim do Dia (Expurgado)': op.fimDoDiaCount,
      '% Sucesso': `${op.percSucesso.toFixed(1)}%`,
      'Meta (R$)': op.meta,
      'Faturamento (R$)': op.faturado,
      '% Meta': `${op.atingimentoMeta.toFixed(1)}%`,
      'Excesso (R$)': op.excesso,
      'Comissão Estimada (R$)': op.comissao
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produção Equipe');
    XLSX.writeFile(wb, `Sabesp_Producao_Equipe_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('💼 Planilha de Produção exportada com sucesso!');
  };

  // Compartilhar Painel com Chefia (Sincronização em Nuvem e Cópia do Link)
  const handleCompartilharComChefia = async () => {
    try {
      const sessaoAtual: SessaoAtiva = {
        id: 'ultima_sessao',
        dataSalvamento: new Date().toLocaleString('pt-BR'),
        usuarioEmail: usuarioLogado?.email,
        usuarioNome: usuarioLogado?.nome,
        totalExecucoesProcessadas,
        execucoesBrutasResumo,
        producaoOperadores,
        infrutiferasEstatisticas,
        evolucaoDiaria,
        reposicoesPiso,
        urgencias,
        retrabalho,
        carteiraLivre,
        totalCarteiraImportada,
        duplicidadesCarteiraCount,
        datasDisponiveis,
        operadoresExcluidos,
        linhasExecucoesBrutas
      };

      await salvarSessaoAtiva(sessaoAtual);
      const sincronizada = await sincronizarSessaoCompartilhada(sessaoAtual);

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
      showToast(sincronizada
        ? '🔗 Link sincronizado e copiado! Quem acessar o link já verá tudo o que foi puxado.'
        : '🔗 Link copiado. A sessão está salva localmente e será sincronizada quando a conexão voltar.');
    } catch (err) {
      console.error('Não foi possível copiar o link do painel:', err);
      showToast('A sessão está salva localmente, mas não foi possível copiar o link.');
    }
  };

  // Gerar e Copiar Relatório CCO / WhatsApp
  const reportCCOTexto = useMemo(() => {
    const dHoje = formatDataAbrev(new Date());
    const totalUrg = urgencias.length;
    const vencidas = urgencias.filter((u) => u.statusPrazo === 'VENCIDA').length;
    const criticas = urgencias.filter((u) => u.statusPrazo === 'CRITICA').length;
    const noPrazo = urgencias.filter((u) => u.statusPrazo === 'NO_PRAZO').length;
    const retrabCount = retrabalho.length;
    const totalCart = totalCarteiraImportada;
    const fatTotal = execucoesBrutasResumo.valorFaturadoTotal;
    const posTotal = execucoesBrutasResumo.totalPositivas;
    const infTotal = execucoesBrutasResumo.totalInfrutiferas;
    const percEficacia = posTotal + infTotal > 0 ? ((posTotal / (posTotal + infTotal)) * 100).toFixed(1) : '0.0';

    return `🚨 *TORRE DE CONTROLE OPERACIONAL – COBRANÇA ALTO & LESTE*
📅 *Posição CCO | ${dHoje}*
${frenteFiltro !== 'GLOBAL' ? `🏢 *FRENTE: ${frenteFiltro}*\n` : ''}
⚡ *RADAR DE URGÊNCIAS (RESTAB & PISO): ${totalUrg} OS*
• 🔴 Vencidas (Passivo Crítico): ${vencidas}
• ⚠️ Vencem Hoje (≤ 24h): ${criticas}
• 🟢 No Prazo: ${noPrazo}

🛡️ *FILTRO ANTI-RETRABALHO (BLOQUEIOS):*
• ${retrabCount} OS retidas no banco de memória (equipes poupadas de morador ausente/fechado).

📊 *PRODUÇÃO E FATURAMENTO:*
• Faturamento Apurado: R$ ${formatMoney(fatTotal)}
• Cortes/Supressões Concluídos: ${execucoesBrutasResumo.totalCortesSupressoes} (Meta Sabesp: 9.220)
• Positivas (Geraram Caixa): ${posTotal} OS
• Infrutíferas (Perdas no Local): ${infTotal} OS
• Baixas de Fim do Dia (Expurgadas): ${execucoesBrutasResumo.totalFimDoDia}
• Sucesso de Visita Diário: ${percEficacia}%

📦 *CARTEIRA TOTAL: ${totalCart} OS* (incluindo carteira livre)`;
  }, [urgencias, retrabalho, totalCarteiraImportada, execucoesBrutasResumo, frenteFiltro]);

  const copiarReportCCO = () => {
    navigator.clipboard.writeText(reportCCOTexto).then(() => {
      showToast('📋 Report CCO copiado para a Área de Transferência! Pronto para colar no WhatsApp.');
    });
  };

  const copiarItemWhatsApp = (item: UrgenciaItem) => {
    const horaVenc = item.horarioVencimento || formatDataHoraVencimento(item.vencReal);
    const op = item.operadorAlocado || item.equipe || 'Não alocado';
    const status = item.statusOS || 'DESPACHADA';
    const local = `${item.municipio || 'Cobrança'}${item.bairro ? ` - ${item.bairro}` : ''}`;

    const txt = `🚨 *ORDEM DE SERVIÇO URGENTE (RESTAB/PISO)*
📍 *OS:* ${item.os} | *PDE:* ${item.pde}
👤 *Com quem está:* ${op}
📌 *Status da OS:* ${status}
🏙️ *Onde fica:* ${local}
⏰ *Vence às:* ${horaVenc} (${item.tempoFormatado})
🔧 *Serviço:* ${item.descricao}`;

    navigator.clipboard.writeText(txt).then(() => {
      showToast(`📲 Dados da OS ${item.os} copiados para o WhatsApp!`);
    });
  };

  // Filtragem de Urgências com suporte a Passivo, Status Operacional e Tipo de Pendência
  const urgenciasFiltradas = useMemo(() => {
    return urgencias.filter((item) => {
      if (frenteFiltro !== 'GLOBAL' && normalize(item.frente) !== normalize(frenteFiltro)) {
        return false;
      }

      // Filtro Foco de Pendência (Restab/Piso vs Vencidos Cobrança vs Todos)
      if (filtroTipoPendencias === 'RESTAB_PISO') {
        const descN = normalize(item.descricao);
        const eRestabPiso = item.tipoUrgencia === 'RESTABELECIMENTO' || item.tipoUrgencia === 'RELIGACAO' || item.tipoUrgencia === 'PISO' ||
          descN.includes('RESTAB') || descN.includes('RELIG') || descN.includes('PISO');
        if (!eRestabPiso) return false;
      } else if (filtroTipoPendencias === 'VENCIDOS_COBRANCA') {
        if (item.statusPrazo !== 'VENCIDA') return false;
      }

      // Filtro por Status da Operação (Despachada / Planejada / Planejável)
      if (filtroStatusOSCarteira !== 'TODOS') {
        const st = normalize(item.statusOS || '');
        if (filtroStatusOSCarteira === 'DESPACHADA' && !st.includes('DESPACH')) return false;
        if (filtroStatusOSCarteira === 'PLANEJADA' && (!st.includes('PLANEJAD') || st.includes('DESPACH'))) return false;
        if (filtroStatusOSCarteira === 'PLANEJAVEL' && (!st.includes('PLANEJAV') && !st.includes('PENDENT') && !st.includes('ABERT') && !st.includes('LIVRE'))) return false;
      }

      // Lógica de Vencidas / Passivo:
      // Se justificada: some da visão padrão ativa! Só aparece se filtrar por VENCIDA_JUSTIFICADA.
      if (item.statusPrazo === 'VENCIDA') {
        if (filtroStatusUrgencia === 'VENCIDA_JUSTIFICADA') {
          if (!item.justificada) return false;
        } else if (filtroStatusUrgencia === 'VENCIDA_NAO_JUSTIFICADA') {
          if (item.justificada) return false;
        } else if (filtroStatusUrgencia === 'TODOS') {
          // Na visão geral ("TODOS"), ordens justificadas somem da lista ativa
          if (item.justificada) return false;
        } else {
          return false;
        }
      } else {
        if (filtroStatusUrgencia === 'VENCIDA_JUSTIFICADA' || filtroStatusUrgencia === 'VENCIDA_NAO_JUSTIFICADA') {
          return false;
        }
        if (filtroStatusUrgencia !== 'TODOS' && item.statusPrazo !== filtroStatusUrgencia) {
          return false;
        }
      }

      if (searchTermUrgencias.trim()) {
        const s = normalize(searchTermUrgencias);
        return (
          normalize(item.os).includes(s) ||
          normalize(item.pde).includes(s) ||
          normalize(item.descricao).includes(s) ||
          normalize(item.bairro).includes(s) ||
          normalize(item.municipio).includes(s) ||
          normalize(item.equipe).includes(s)
        );
      }
      return true;
    });
  }, [urgencias, frenteFiltro, filtroStatusUrgencia, filtroTipoPendencias, filtroStatusOSCarteira, searchTermUrgencias]);
  const {
    currentPage: urgenciasPage,
    totalPages: urgenciasTotalPages,
    pageItems: urgenciasPageItems,
    setCurrentPage: setUrgenciasPage
  } = usePagination(
    urgenciasFiltradas,
    PAGE_SIZE,
    `${frenteFiltro}|${filtroStatusUrgencia}|${filtroTipoPendencias}|${filtroStatusOSCarteira}|${searchTermUrgencias}`
  );

  // Filtragem de Retrabalho (ESTRITAMENTE COBRANÇA: Corte, Supressão, POS, Restabelecimento, Religação, Reposição)
  const retrabalhoFiltrado = useMemo(() => {
    return retrabalho.filter((item) => {
      // Filtrar estritamente serviços da frente de Cobrança
      if (item.isCobranca === false) {
        return false;
      }
      if (frenteFiltro !== 'GLOBAL' && normalize(item.frente) !== normalize(frenteFiltro)) {
        return false;
      }
      if (filtroRetrabalhoTipo === 'FALHAS' && item.tipoRetrabalho !== 'INFRUTIFERO_ANTERIOR') {
        return false;
      }
      if (filtroRetrabalhoTipo === 'MULTIVISITAS' && item.tipoRetrabalho !== 'MULTIVISITAS') {
        return false;
      }
      if (filtroRetrabalhoTipo === 'DUPLICADAS' && item.tipoRetrabalho !== 'DUPLICIDADE_CARTEIRA' && !item.duplicadaNaCarteira) {
        return false;
      }
      if (filtroRetrabalhoTipo === 'RESOLVIDOS') {
        const isResolvido = item.statusOS === 'EXECUTADA' && item.statusExecucao !== 'INFRUTIFERO_REINCIDENTE' && item.novaCondicao && !item.novaCondicao.includes('Infrutífero');
        if (!isResolvido) return false;
      }
      if (filtroRetrabalhoTipo === 'VICIADOS') {
        const isViciado = item.tipoRetrabalho === 'PDE_VICIADO' || item.visitasAnteriores >= 3;
        if (!isViciado) return false;
      }
      if (searchTermRetrabalho.trim()) {
        const s = normalize(searchTermRetrabalho);
        return (
          normalize(item.os).includes(s) ||
          normalize(item.pde).includes(s) ||
          normalize(item.descricao).includes(s) ||
          normalize(item.motivoFalhaAnterior).includes(s) ||
          normalize(item.operadorAnterior).includes(s)
        );
      }
      return true;
    });
  }, [retrabalho, frenteFiltro, filtroRetrabalhoTipo, searchTermRetrabalho]);
  const {
    currentPage: retrabalhoPage,
    totalPages: retrabalhoTotalPages,
    pageItems: retrabalhoPageItems,
    setCurrentPage: setRetrabalhoPage
  } = usePagination(retrabalhoFiltrado, PAGE_SIZE, `${frenteFiltro}|${filtroRetrabalhoTipo}|${searchTermRetrabalho}`);

  // Filtragem de Visitas / Retrabalho de OUTRAS FRENTES (Hidrometria, Irregularidades, Ramal, Esgoto, etc.)
  const retrabalhoOutrasFrentesFiltrado = useMemo(() => {
    return retrabalho.filter((item) => {
      // Apenas itens que NÃO são da frente de cobrança
      if (item.isCobranca !== false) {
        return false;
      }
      if (frenteFiltro !== 'GLOBAL' && normalize(item.frente) !== normalize(frenteFiltro)) {
        return false;
      }
      if (searchTermOutrasFrentes.trim()) {
        const s = normalize(searchTermOutrasFrentes);
        return (
          normalize(item.os).includes(s) ||
          normalize(item.pde).includes(s) ||
          normalize(item.descricao).includes(s) ||
          normalize(item.motivoFalhaAnterior).includes(s) ||
          normalize(item.operadorAnterior).includes(s) ||
          normalize(item.municipio).includes(s)
        );
      }
      return true;
    });
  }, [retrabalho, frenteFiltro, searchTermOutrasFrentes]);

  // Filtragem de Carteira Livre com Suporte a Vencidos Cobrança e Status Operação
  const carteiraLivreFiltrada = useMemo(() => {
    return carteiraLivre.filter((item) => {
      if (frenteFiltro !== 'GLOBAL' && normalize(item.frente) !== normalize(frenteFiltro)) {
        return false;
      }

      // Filtro Foco de Pendência
      if (filtroTipoPendencias === 'VENCIDOS_COBRANCA' && !item.isVencido) {
        return false;
      }

      // Filtro por Status da Operação (Despachada / Planejada / Planejável)
      if (filtroStatusOSCarteira !== 'TODOS') {
        const st = normalize(item.statusOS || '');
        if (filtroStatusOSCarteira === 'DESPACHADA' && !st.includes('DESPACH')) return false;
        if (filtroStatusOSCarteira === 'PLANEJADA' && (!st.includes('PLANEJAD') || st.includes('DESPACH'))) return false;
        if (filtroStatusOSCarteira === 'PLANEJAVEL' && (!st.includes('PLANEJAV') && !st.includes('PENDENT') && !st.includes('ABERT') && !st.includes('LIVRE'))) return false;
      }

      if (searchTermLivre.trim()) {
        const s = normalize(searchTermLivre);
        return (
          normalize(item.os).includes(s) ||
          normalize(item.pde).includes(s) ||
          normalize(item.descricao).includes(s) ||
          normalize(item.bairro).includes(s) ||
          normalize(item.municipio).includes(s)
        );
      }
      return true;
    });
  }, [carteiraLivre, frenteFiltro, filtroTipoPendencias, filtroStatusOSCarteira, searchTermLivre]);

  // Agrupamentos Disponíveis por Semana e Mês (Calculados a partir das datas da planilha)
  const semanasDisponiveis = useMemo(() => {
    return agruparDatasPorSemana(datasDisponiveis);
  }, [datasDisponiveis]);

  const mesesDisponiveis = useMemo(() => {
    return agruparDatasPorMes(datasDisponiveis);
  }, [datasDisponiveis]);

  // Filtragem e Agregação de Produção (Dia | Semana | Mês) com Suporte a Exclusão de Operador e Equipe Oficial
  const producaoFiltrada = useMemo(() => {
    return producaoOperadores
      .filter((op) => {
        // Filtro por Frente de Trabalho
        if (frenteFiltro !== 'GLOBAL' && normalize(op.frente) !== normalize(frenteFiltro)) {
          return false;
        }
        // Expurgo de operadores desconsiderados/excluídos pelo usuário (que não são da base)
        if (operadoresExcluidos.includes(op.nomeNormalizado)) {
          return false;
        }
        // Filtro por busca rápida de nome do operador
        if (buscaOperadorProducao.trim()) {
          const q = normalize(buscaOperadorProducao);
          if (!op.nomeNormalizado.includes(q)) return false;
        }
        // Filtro "Somente Minha Equipe Cadastrada"
        if (somenteEquipeOficial) {
          const pertence = equipe.some((e) => normalize(e.nome) === op.nomeNormalizado);
          if (!pertence) return false;
        }
        return true;
      })
      .map((op) => {
        // ----------------------------------------------------
        // VISÃO 1: DIÁRIO (POR DIA)
        // ----------------------------------------------------
        if (tipoAgregacao === 'DIA') {
          if (dataFiltro === 'TODOS') return op;

          const diaStats = op.historicoDiario?.[dataFiltro];
          if (!diaStats) {
            return {
              ...op,
              totalOS: 0,
              positivas: 0,
              cortesSupressoes: 0,
              cortes: 0,
              supressoes: 0,
              negociacoesPOS: 0,
              reposicoesPiso: 0,
              faturasPagas: 0,
              infrutiferas: 0,
              fimDoDiaCount: 0,
              faturado: 0,
              percSucesso: 0,
              atingimentoMeta: 0,
              excesso: 0,
              comissao: 0
            };
          }

          const metaDiaria = op.meta > 0 ? Math.round(op.meta / 22) : 0;
          const excessoDia = Math.max(0, diaStats.faturado - metaDiaria);
          const atingimentoDia = metaDiaria > 0 ? (diaStats.faturado / metaDiaria) * 100 : 0;
          const comissaoDia = excessoDia * (METAS_PADRAO.percComissaoPadrao / 100);

          return {
            ...op,
            totalOS: diaStats.totalOS,
            positivas: diaStats.positivas,
            cortesSupressoes: diaStats.cortesSupressoes,
            cortes: diaStats.cortes || 0,
            supressoes: diaStats.supressoes || 0,
            restabes: diaStats.restabes || 0,
            religacoes: diaStats.religacoes || 0,
            negociacoesPOS: diaStats.negociacoesPOS || 0,
            reposicoesPiso: diaStats.reposicoesPiso || 0,
            faturasPagas: diaStats.faturasPagas || 0,
            infrutiferas: diaStats.infrutiferas,
            fimDoDiaCount: diaStats.fimDoDiaCount,
            faturado: diaStats.faturado,
            percSucesso: diaStats.percSucesso,
            meta: metaDiaria,
            atingimentoMeta: atingimentoDia,
            excesso: excessoDia,
            comissao: comissaoDia
          };
        }

        // ----------------------------------------------------
        // VISÃO 2: SEMANAL (POR SEMANA)
        // ----------------------------------------------------
        if (tipoAgregacao === 'SEMANA') {
          let datasAlvo: string[] = [];
          if (semanaFiltro === 'TODOS') {
            datasAlvo = datasDisponiveis;
          } else {
            const semItem = semanasDisponiveis.find((s) => s.id === semanaFiltro);
            datasAlvo = semItem ? semItem.datasContidas : [];
          }

          let totOS = 0;
          let totPos = 0;
          let totCortes = 0;
          let totCortesIndiv = 0;
          let totSupressoesIndiv = 0;
          let totRestabes = 0;
          let totReligacoes = 0;
          let totNegociacoes = 0;
          let totPiso = 0;
          let totFaturasPagas = 0;
          let totInf = 0;
          let totFim = 0;
          let totFat = 0;

          datasAlvo.forEach((d) => {
            const item = op.historicoDiario?.[d];
            if (item) {
              totOS += item.totalOS;
              totPos += item.positivas;
              totCortes += item.cortesSupressoes;
              totCortesIndiv += (item.cortes || 0);
              totSupressoesIndiv += (item.supressoes || 0);
              totRestabes += (item.restabes || 0);
              totReligacoes += (item.religacoes || 0);
              totNegociacoes += (item.negociacoesPOS || 0);
              totPiso += (item.reposicoesPiso || 0);
              totFaturasPagas += (item.faturasPagas || 0);
              totInf += item.infrutiferas;
              totFim += item.fimDoDiaCount;
              totFat += item.faturado;
            }
          });

          const atendReais = totPos + totInf;
          const percSuc = atendReais > 0 ? (totPos / atendReais) * 100 : 0;

          // Meta semanal padrão: meta mensal dividida por ~4.33 semanas
          const divisorSemanas = semanaFiltro === 'TODOS' ? Math.max(1, semanasDisponiveis.length) : 1;
          const metaBaseSemanal = op.meta > 0 ? Math.round(op.meta / 4.33) : 0;
          const metaAjustada = semanaFiltro === 'TODOS' ? metaBaseSemanal * divisorSemanas : metaBaseSemanal;
          const excessoSem = Math.max(0, totFat - metaAjustada);
          const atingSem = metaAjustada > 0 ? (totFat / metaAjustada) * 100 : 0;
          const comissaoSem = excessoSem * (METAS_PADRAO.percComissaoPadrao / 100);

          return {
            ...op,
            totalOS: totOS,
            positivas: totPos,
            cortesSupressoes: totCortes,
            cortes: totCortesIndiv,
            supressoes: totSupressoesIndiv,
            restabes: totRestabes,
            religacoes: totReligacoes,
            negociacoesPOS: totNegociacoes,
            reposicoesPiso: totPiso,
            faturasPagas: totFaturasPagas,
            infrutiferas: totInf,
            fimDoDiaCount: totFim,
            faturado: totFat,
            percSucesso: percSuc,
            meta: metaAjustada,
            atingimentoMeta: atingSem,
            excesso: excessoSem,
            comissao: comissaoSem
          };
        }

        // ----------------------------------------------------
        // VISÃO 3: MENSAL (POR MÊS)
        // ----------------------------------------------------
        if (tipoAgregacao === 'MES') {
          let datasAlvo: string[] = [];
          if (mesFiltro === 'TODOS') {
            datasAlvo = datasDisponiveis;
          } else {
            const mesItem = mesesDisponiveis.find((m) => m.id === mesFiltro);
            datasAlvo = mesItem ? mesItem.datasContidas : [];
          }

          let totOS = 0;
          let totPos = 0;
          let totCortes = 0;
          let totCortesIndiv = 0;
          let totSupressoesIndiv = 0;
          let totRestabes = 0;
          let totReligacoes = 0;
          let totNegociacoes = 0;
          let totPiso = 0;
          let totFaturasPagas = 0;
          let totInf = 0;
          let totFim = 0;
          let totFat = 0;

          datasAlvo.forEach((d) => {
            const item = op.historicoDiario?.[d];
            if (item) {
              totOS += item.totalOS;
              totPos += item.positivas;
              totCortes += item.cortesSupressoes;
              totCortesIndiv += (item.cortes || 0);
              totSupressoesIndiv += (item.supressoes || 0);
              totRestabes += (item.restabes || 0);
              totReligacoes += (item.religacoes || 0);
              totNegociacoes += (item.negociacoesPOS || 0);
              totPiso += (item.reposicoesPiso || 0);
              totFaturasPagas += (item.faturasPagas || 0);
              totInf += item.infrutiferas;
              totFim += item.fimDoDiaCount;
              totFat += item.faturado;
            }
          });

          const atendReais = totPos + totInf;
          const percSuc = atendReais > 0 ? (totPos / atendReais) * 100 : 0;

          const metaMensal = op.meta;
          const excessoMes = Math.max(0, totFat - metaMensal);
          const atingMes = metaMensal > 0 ? (totFat / metaMensal) * 100 : 0;
          const comissaoMes = excessoMes * (METAS_PADRAO.percComissaoPadrao / 100);

          return {
            ...op,
            totalOS: totOS,
            positivas: totPos,
            cortesSupressoes: totCortes,
            cortes: totCortesIndiv,
            supressoes: totSupressoesIndiv,
            restabes: totRestabes,
            religacoes: totReligacoes,
            negociacoesPOS: totNegociacoes,
            reposicoesPiso: totPiso,
            faturasPagas: totFaturasPagas,
            infrutiferas: totInf,
            fimDoDiaCount: totFim,
            faturado: totFat,
            percSucesso: percSuc,
            meta: metaMensal,
            atingimentoMeta: atingMes,
            excesso: excessoMes,
            comissao: comissaoMes
          };
        }

        // ----------------------------------------------------
        // VISÃO 4: INTERVALO CUSTOM (QUALQUER PERÍODO / CICLO 1 A 30)
        // ----------------------------------------------------
        if (tipoAgregacao === 'CUSTOM') {
          const [yI, mI, dI] = (intervaloCustom.dataInicio || '2026-09-01').split('-').map(Number);
          const [yF, mF, dF] = (intervaloCustom.dataFim || '2026-09-30').split('-').map(Number);
          const dtIni = new Date(yI, (mI || 1) - 1, dI || 1);
          const dtFim = new Date(yF, (mF || 1) - 1, dF || 1);

          const datasAlvo = datasDisponiveis.filter((dStr) => {
            const [dia, mes, ano] = dStr.split('/').map(Number);
            const dt = new Date(ano || 2026, (mes || 1) - 1, dia || 1);
            return dt >= dtIni && dt <= dtFim;
          });

          let totOS = 0;
          let totPos = 0;
          let totCortes = 0;
          let totCortesIndiv = 0;
          let totSupressoesIndiv = 0;
          let totRestabes = 0;
          let totReligacoes = 0;
          let totNegociacoes = 0;
          let totPiso = 0;
          let totFaturasPagas = 0;
          let totInf = 0;
          let totFim = 0;
          let totFat = 0;

          datasAlvo.forEach((d) => {
            const item = op.historicoDiario?.[d];
            if (item) {
              totOS += item.totalOS;
              totPos += item.positivas;
              totCortes += item.cortesSupressoes;
              totCortesIndiv += item.cortes || 0;
              totSupressoesIndiv += item.supressoes || 0;
              totRestabes += (item.restabes || 0);
              totReligacoes += (item.religacoes || 0);
              totNegociacoes += item.negociacoesPOS || 0;
              totPiso += item.reposicoesPiso || 0;
              totFaturasPagas += item.faturasPagas || 0;
              totInf += item.infrutiferas;
              totFim += item.fimDoDiaCount;
              totFat += item.faturado;
            }
          });

          const atendReais = totPos + totInf;
          const percSuc = atendReais > 0 ? (totPos / atendReais) * 100 : 0;

          const ehCiclo30 = datasAlvo.length >= 20 || (intervaloCustom.nomePreset?.includes('30') ?? false);
          const metaPeriodo = ehCiclo30 ? op.meta : Math.round((op.meta / 22) * Math.max(1, datasAlvo.length));
          const excessoPeriodo = Math.max(0, totFat - metaPeriodo);
          const atingPeriodo = metaPeriodo > 0 ? (totFat / metaPeriodo) * 100 : 0;
          const comissaoPeriodo = excessoPeriodo * (METAS_PADRAO.percComissaoPadrao / 100);

          return {
            ...op,
            totalOS: totOS,
            positivas: totPos,
            cortesSupressoes: totCortes,
            cortes: totCortesIndiv,
            supressoes: totSupressoesIndiv,
            restabes: totRestabes,
            religacoes: totReligacoes,
            negociacoesPOS: totNegociacoes,
            reposicoesPiso: totPiso,
            faturasPagas: totFaturasPagas,
            infrutiferas: totInf,
            fimDoDiaCount: totFim,
            faturado: totFat,
            percSucesso: percSuc,
            meta: metaPeriodo,
            atingimentoMeta: atingPeriodo,
            excesso: excessoPeriodo,
            comissao: comissaoPeriodo
          };
        }

        // ----------------------------------------------------
        // VISÃO 5: COMPARATIVO (01/07 vs 01/08 ou PERÍODO A vs B)
        // ----------------------------------------------------
        if (tipoAgregacao === 'COMPARATIVO') {
          // Período A (Atual / Análise)
          const [yIA, mIA, dIA] = (intervaloCustom.dataInicio || '2026-08-01').split('-').map(Number);
          const [yFA, mFA, dFA] = (intervaloCustom.dataFim || '2026-08-31').split('-').map(Number);
          const dtIniA = new Date(yIA, (mIA || 1) - 1, dIA || 1);
          const dtFimA = new Date(yFA, (mFA || 1) - 1, dFA || 1);

          // Período B (Base / Comparação)
          const [yIB, mIB, dIB] = (intervaloCustom.dataInicioComp || '2026-07-01').split('-').map(Number);
          const [yFB, mFB, dFB] = (intervaloCustom.dataFimComp || '2026-07-31').split('-').map(Number);
          const dtIniB = new Date(yIB, (mIB || 1) - 1, dIB || 1);
          const dtFimB = new Date(yFB, (mFB || 1) - 1, dFB || 1);

          const datasAlvoA = datasDisponiveis.filter((dStr) => {
            const [dia, mes, ano] = dStr.split('/').map(Number);
            const dt = new Date(ano || 2026, (mes || 1) - 1, dia || 1);
            return dt >= dtIniA && dt <= dtFimA;
          });

          const datasAlvoB = datasDisponiveis.filter((dStr) => {
            const [dia, mes, ano] = dStr.split('/').map(Number);
            const dt = new Date(ano || 2026, (mes || 1) - 1, dia || 1);
            return dt >= dtIniB && dt <= dtFimB;
          });

          // Stats Período A
          let totOSA = 0, totPosA = 0, totCortesA = 0, totCortesIndivA = 0, totSupressoesIndivA = 0;
          let totRestabesA = 0, totReligacoesA = 0;
          let totNegociacoesA = 0, totPisoA = 0, totFaturasPagasA = 0, totInfA = 0, totFimA = 0, totFatA = 0;

          datasAlvoA.forEach((d) => {
            const item = op.historicoDiario?.[d];
            if (item) {
              totOSA += item.totalOS;
              totPosA += item.positivas;
              totCortesA += item.cortesSupressoes;
              totCortesIndivA += item.cortes || 0;
              totSupressoesIndivA += item.supressoes || 0;
              totRestabesA += item.restabes || 0;
              totReligacoesA += item.religacoes || 0;
              totNegociacoesA += item.negociacoesPOS || 0;
              totPisoA += item.reposicoesPiso || 0;
              totFaturasPagasA += item.faturasPagas || 0;
              totInfA += item.infrutiferas;
              totFimA += item.fimDoDiaCount;
              totFatA += item.faturado;
            }
          });

          // Stats Período B
          let totPosB = 0, totCortesB = 0, totFatB = 0;
          datasAlvoB.forEach((d) => {
            const item = op.historicoDiario?.[d];
            if (item) {
              totPosB += item.positivas;
              totCortesB += item.cortesSupressoes;
              totFatB += item.faturado;
            }
          });

          const atendReaisA = totPosA + totInfA;
          const percSucA = atendReaisA > 0 ? (totPosA / atendReaisA) * 100 : 0;

          const metaMensal = op.meta;
          const excessoA = Math.max(0, totFatA - metaMensal);
          const atingA = metaMensal > 0 ? (totFatA / metaMensal) * 100 : 0;
          const comissaoA = excessoA * (METAS_PADRAO.percComissaoPadrao / 100);

          const variacaoFat = totFatB > 0 ? ((totFatA - totFatB) / totFatB) * 100 : (totFatA > 0 ? 100 : 0);
          const variacaoCortes = totCortesB > 0 ? ((totCortesA - totCortesB) / totCortesB) * 100 : (totCortesA > 0 ? 100 : 0);

          return {
            ...op,
            totalOS: totOSA,
            positivas: totPosA,
            cortesSupressoes: totCortesA,
            cortes: totCortesIndivA,
            supressoes: totSupressoesIndivA,
            restabes: totRestabesA,
            religacoes: totReligacoesA,
            negociacoesPOS: totNegociacoesA,
            reposicoesPiso: totPisoA,
            faturasPagas: totFaturasPagasA,
            infrutiferas: totInfA,
            fimDoDiaCount: totFimA,
            faturado: totFatA,
            percSucesso: percSucA,
            meta: metaMensal,
            atingimentoMeta: atingA,
            excesso: excessoA,
            comissao: comissaoA,
            comparativo: {
              faturadoAnterior: totFatB,
              cortesAnterior: totCortesB,
              positivasAnterior: totPosB,
              variacaoFaturadoPerc: variacaoFat,
              variacaoCortesPerc: variacaoCortes,
              crescimento: totFatA >= totFatB
            }
          };
        }

        return op;
      })
      .sort((a, b) => b.faturado - a.faturado);
  }, [
    producaoOperadores,
    frenteFiltro,
    buscaOperadorProducao,
    tipoAgregacao,
    dataFiltro,
    semanaFiltro,
    mesFiltro,
    intervaloCustom,
    datasDisponiveis,
    semanasDisponiveis,
    mesesDisponiveis,
    operadoresExcluidos,
    somenteEquipeOficial,
    equipe
  ]);

  // Filtragem Final com Suporte a Filtros Estilo Excel e Chips Rápidos
  const producaoFinal = useMemo(() => {
    let list = [...producaoFiltrada];

    // 1. Filtros Rápidos (Chips)
    if (filtroRapidoChip === 'LESTE') {
      list = list.filter((op) => op.frente.includes('Leste'));
    } else if (filtroRapidoChip === 'ALTO') {
      list = list.filter((op) => op.frente.includes('Alto'));
    } else if (filtroRapidoChip === 'MOTOS') {
      list = list.filter((op) => op.veiculo === 'Moto');
    } else if (filtroRapidoChip === 'CARROS') {
      list = list.filter((op) => op.veiculo === 'Carro');
    } else if (filtroRapidoChip === 'META_BATIDA') {
      list = list.filter((op) => op.atingimentoMeta >= 100);
    } else if (filtroRapidoChip === 'NA_TRAVE') {
      list = list.filter((op) => op.atingimentoMeta >= 80 && op.atingimentoMeta < 100);
    } else if (filtroRapidoChip === 'ABAIXO_META') {
      list = list.filter((op) => op.atingimentoMeta < 80);
    } else if (filtroRapidoChip === 'MIGUE') {
      list = list.filter((op) => op.diagnostico?.padraoSuspeitoMigue);
    }

    // 2. Filtros Colunares Estilo Excel
    Object.entries(excelFiltros).forEach(([colId, filter]) => {
      if (!filter) return;
      if (filter.selected && filter.selected.length > 0) {
        if (colId === 'operador') {
          list = list.filter((op) => filter.selected.includes(op.nomeNormalizado));
        } else if (colId === 'frente') {
          list = list.filter((op) => filter.selected.includes(op.frente));
        } else if (colId === 'veiculo') {
          list = list.filter((op) => filter.selected.includes(op.veiculo));
        } else if (colId === 'tipoEquipe') {
          list = list.filter((op) => filter.selected.includes(op.tipoEquipe || 'PROPRIA'));
        }
      }

      if (filter.min !== undefined && filter.min > 0) {
        if (colId === 'faturado') list = list.filter((op) => op.faturado >= filter.min!);
        if (colId === 'totalOS') list = list.filter((op) => op.totalOS >= filter.min!);
        if (colId === 'percSucesso') list = list.filter((op) => op.percSucesso >= filter.min!);
        if (colId === 'cortes') list = list.filter((op) => op.cortesSupressoes >= filter.min!);
      }
    });

    // 3. Ordenação Colunar Estilo Excel
    const activeSortEntry = Object.entries(excelFiltros).find(([_, f]) => f?.sort !== null);
    if (activeSortEntry) {
      const [colId, filter] = activeSortEntry;
      const dir = filter.sort === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        if (colId === 'operador') return a.nome.localeCompare(b.nome) * dir;
        if (colId === 'frente') return a.frente.localeCompare(b.frente) * dir;
        if (colId === 'veiculo') return a.veiculo.localeCompare(b.veiculo) * dir;
        if (colId === 'totalOS') return (a.totalOS - b.totalOS) * dir;
        if (colId === 'cortes') return (a.cortesSupressoes - b.cortesSupressoes) * dir;
        if (colId === 'restabes') {
          const rA = (a.restabes || 0) + (a.religacoes || 0);
          const rB = (b.restabes || 0) + (b.religacoes || 0);
          return (rA - rB) * dir;
        }
        if (colId === 'pos') return ((a.negociacoesPOS || 0) - (b.negociacoesPOS || 0)) * dir;
        if (colId === 'sucesso') return (a.percSucesso - b.percSucesso) * dir;
        if (colId === 'faturado') return (a.faturado - b.faturado) * dir;
        if (colId === 'meta') return (a.meta - b.meta) * dir;
        if (colId === 'atingimento') return (a.atingimentoMeta - b.atingimentoMeta) * dir;
        return 0;
      });
    }

    return list;
  }, [producaoFiltrada, filtroRapidoChip, excelFiltros]);
  const {
    currentPage: producaoPage,
    totalPages: producaoTotalPages,
    pageItems: producaoPageItems,
    setCurrentPage: setProducaoPage
  } = usePagination(
    producaoFinal,
    PAGE_SIZE,
    `${frenteFiltro}|${buscaOperadorProducao}|${tipoAgregacao}|${dataFiltro}|${semanaFiltro}|${mesFiltro}|${filtroRapidoChip}|${JSON.stringify(excelFiltros)}|${JSON.stringify(intervaloCustom)}|${operadoresExcluidos.join('|')}|${somenteEquipeOficial}`
  );

  const opcoesOperadoresExcel = useMemo(() => {
    return Array.from(new Set(producaoFiltrada.map((op) => op.nomeNormalizado))).map((norm) => {
      const op = producaoFiltrada.find((o) => o.nomeNormalizado === norm);
      return { value: norm, label: op?.nome || norm };
    });
  }, [producaoFiltrada]);

  const opcoesFrentesExcel = useMemo(() => {
    return Array.from(new Set(producaoFiltrada.map((op) => op.frente))).map((f) => ({
      value: f,
      label: f
    }));
  }, [producaoFiltrada]);

  const opcoesVeiculosExcel = useMemo(() => {
    return Array.from(new Set(producaoFiltrada.map((op) => op.veiculo))).map((v) => ({
      value: v,
      label: v
    }));
  }, [producaoFiltrada]);

  const opcoesTiposEquipeExcel = useMemo(() => {
    return [
      { value: 'PROPRIA', label: 'Equipe Própria' },
      { value: 'APOIO_EXTERNO', label: 'Apoio Externo' }
    ];
  }, []);

  // Métricas Consolidadas do Período Filtrado (Geral / Frentes)
  const cortesAtuais = useMemo(() => {
    return producaoFiltrada
      .filter((op) =>
        activeTab === 'cobranca_leste'
          ? op.frente.includes('Leste')
          : activeTab === 'cobranca_alto'
          ? op.frente.includes('Alto')
          : true
      )
      .reduce((acc, curr) => acc + curr.cortesSupressoes, 0);
  }, [producaoFiltrada, activeTab]);

  const restabesReligacoesAtuais = useMemo(() => {
    return producaoFiltrada
      .filter((op) =>
        activeTab === 'cobranca_leste'
          ? op.frente.includes('Leste')
          : activeTab === 'cobranca_alto'
          ? op.frente.includes('Alto')
          : true
      )
      .reduce((acc, curr) => acc + (curr.restabesReligacoes ?? ((curr.restabes || 0) + (curr.religacoes || 0))), 0);
  }, [producaoFiltrada, activeTab]);

  const faturadoAtual = useMemo(() => {
    return producaoFiltrada
      .filter((op) =>
        activeTab === 'cobranca_leste'
          ? op.frente.includes('Leste')
          : activeTab === 'cobranca_alto'
          ? op.frente.includes('Alto')
          : true
      )
      .reduce((acc, curr) => acc + curr.faturado, 0);
  }, [producaoFiltrada, activeTab]);

  const faturadoComparadoBase = useMemo(() => {
    if (tipoAgregacao !== 'COMPARATIVO') return 0;
    return producaoFiltrada
      .filter((op) =>
        activeTab === 'cobranca_leste'
          ? op.frente.includes('Leste')
          : activeTab === 'cobranca_alto'
          ? op.frente.includes('Alto')
          : true
      )
      .reduce((acc, curr) => acc + (curr.comparativo?.faturadoAnterior || 0), 0);
  }, [producaoFiltrada, activeTab, tipoAgregacao]);

  const cortesComparadosBase = useMemo(() => {
    if (tipoAgregacao !== 'COMPARATIVO') return 0;
    return producaoFiltrada
      .filter((op) =>
        activeTab === 'cobranca_leste'
          ? op.frente.includes('Leste')
          : activeTab === 'cobranca_alto'
          ? op.frente.includes('Alto')
          : true
      )
      .reduce((acc, curr) => acc + (curr.comparativo?.cortesAnterior || 0), 0);
  }, [producaoFiltrada, activeTab, tipoAgregacao]);

  const variacaoFaturadoTotal = useMemo(() => {
    if (faturadoComparadoBase === 0) return faturadoAtual > 0 ? 100 : 0;
    return ((faturadoAtual - faturadoComparadoBase) / faturadoComparadoBase) * 100;
  }, [faturadoAtual, faturadoComparadoBase]);

  const variacaoCortesTotal = useMemo(() => {
    if (cortesComparadosBase === 0) return cortesAtuais > 0 ? 100 : 0;
    return ((cortesAtuais - cortesComparadosBase) / cortesComparadosBase) * 100;
  }, [cortesAtuais, cortesComparadosBase]);

  const melhorEvolucaoOperador = useMemo(() => {
    if (tipoAgregacao !== 'COMPARATIVO') return null;
    const ops = [...producaoFiltrada]
      .filter((op) => (op.comparativo?.faturadoAnterior || 0) > 0)
      .sort((a, b) => (b.comparativo?.variacaoFaturadoPerc || 0) - (a.comparativo?.variacaoFaturadoPerc || 0));
    return ops[0] || null;
  }, [producaoFiltrada, tipoAgregacao]);

  // Agrupamento de Urgências por Tipo (Cards no topo da aba)
  const urgenciasAgrupadas = useMemo(() => {
    const mapa: Record<string, { tipo: string; qtd: number; vencMaisProximo: Date; temVencido: boolean }> = {};

    urgenciasFiltradas.forEach((u) => {
      const key = u.descricao.length > 36 ? u.descricao.slice(0, 36) + '...' : u.descricao;
      if (!mapa[key]) {
        mapa[key] = {
          tipo: key,
          qtd: 0,
          vencMaisProximo: u.vencReal,
          temVencido: false
        };
      }
      mapa[key].qtd += 1;
      if (u.vencReal < mapa[key].vencMaisProximo) {
        mapa[key].vencMaisProximo = u.vencReal;
      }
      if (u.statusPrazo === 'VENCIDA') {
        mapa[key].temVencido = true;
      }
    });

    return Object.values(mapa).sort((a, b) => b.qtd - a.qtd);
  }, [urgenciasFiltradas]);

  // Gestão de Limpeza de Cargas Erradas & Remoção de Operadores Intrusos
  const limparCargaExecucoes = useCallback(async () => {
    if (!window.confirm('⚠️ Tem certeza que deseja apagar a planilha de Execuções atual? Os dados de produção e faturamento desta planilha serão zerados.')) {
      return;
    }
    setProducaoOperadores([]);
    setTotalExecucoesProcessadas(0);
    setExecucoesBrutasResumo({
      totalPositivas: 0,
      totalInfrutiferas: 0,
      totalFimDoDia: 0,
      totalCortesSupressoes: 0,
      totalCortes: 0,
      totalSupressoes: 0,
      totalRestabes: 0,
      totalReligacoes: 0,
      totalCortesViraramPOS: 0,
      totalNegociacoesPOS: 0,
      totalReposicoesPiso: 0,
      faturadoReposicoesPiso: 0,
      totalFaturasPagasApresentadas: 0,
      valorFaturadoTotal: 0
    });
    setInfrutiferasEstatisticas([]);
    setEvolucaoDiaria([]);
    setReposicoesPiso([]);
    setLinhasExecucoesBrutas([]);
    setDatasDisponiveis([]);
    setDataFiltro('TODOS');
    setSemanaFiltro('TODOS');
    setMesFiltro('TODOS');

    await salvarSessaoAtiva({
      id: 'ultima_sessao',
      dataSalvamento: new Date().toLocaleString('pt-BR'),
      usuarioEmail: usuarioLogado?.email,
      usuarioNome: usuarioLogado?.nome,
      totalExecucoesProcessadas: 0,
      execucoesBrutasResumo: {
        totalPositivas: 0,
        totalInfrutiferas: 0,
        totalFimDoDia: 0,
        totalCortesSupressoes: 0,
        totalCortes: 0,
        totalSupressoes: 0,
        totalCortesViraramPOS: 0,
        totalNegociacoesPOS: 0,
        totalReposicoesPiso: 0,
        faturadoReposicoesPiso: 0,
        totalFaturasPagasApresentadas: 0,
        valorFaturadoTotal: 0
      },
      producaoOperadores: [],
      infrutiferasEstatisticas: [],
      evolucaoDiaria: [],
      reposicoesPiso: [],
      urgencias,
      retrabalho,
      carteiraLivre,
      totalCarteiraImportada,
      duplicidadesCarteiraCount,
      datasDisponiveis: [],
      operadoresExcluidos,
      linhasExecucoesBrutas: []
    });

    showToast('🗑️ Carga de Execuções apagada com sucesso!');
  }, [usuarioLogado, urgencias, retrabalho, carteiraLivre, totalCarteiraImportada, duplicidadesCarteiraCount, operadoresExcluidos, showToast]);

  const limparCargaPendencias = useCallback(async () => {
    if (!window.confirm('⚠️ Tem certeza que deseja apagar a carteira de Pendências atual? As urgências, retrabalhos e ordens livres desta planilha serão removidas.')) {
      return;
    }
    setUrgencias([]);
    setRetrabalho([]);
    setCarteiraLivre([]);
    setTotalCarteiraImportada(0);
    setDuplicidadesCarteiraCount(0);

    await salvarSessaoAtiva({
      id: 'ultima_sessao',
      dataSalvamento: new Date().toLocaleString('pt-BR'),
      usuarioEmail: usuarioLogado?.email,
      usuarioNome: usuarioLogado?.nome,
      totalExecucoesProcessadas,
      execucoesBrutasResumo,
      producaoOperadores,
      infrutiferasEstatisticas,
      evolucaoDiaria,
      urgencias: [],
      retrabalho: [],
      carteiraLivre: [],
      totalCarteiraImportada: 0,
      duplicidadesCarteiraCount: 0,
      datasDisponiveis,
      operadoresExcluidos
    });

    showToast('🗑️ Carteira de Pendências apagada com sucesso!');
  }, [usuarioLogado, totalExecucoesProcessadas, execucoesBrutasResumo, producaoOperadores, infrutiferasEstatisticas, evolucaoDiaria, datasDisponiveis, operadoresExcluidos, showToast]);

  const removerOperadorDaProducao = useCallback((nomeNorm: string, nomeExibicao: string) => {
    if (window.confirm(`Deseja desconsiderar o operador "${nomeExibicao}" desta análise? Ele e seus números não entrarão nos cálculos.`)) {
      setOperadoresExcluidos((prev) => Array.from(new Set([...prev, nomeNorm])));
      showToast(`🚫 Operador "${nomeExibicao}" removido da visualização de produção.`);
    }
  }, [showToast]);

  const restaurarOperadoresExcluidos = useCallback(() => {
    setOperadoresExcluidos([]);
    showToast('🔄 Todos os operadores foram restaurados na tabela de produção!');
  }, [showToast]);

  // Operações da Equipe
  const handleAbrirEditarOperador = (op: OperadorProducao | Operador) => {
    setOperadorParaEditar({
      nome: op.nome,
      nomeNormalizado: op.nomeNormalizado,
      veiculo: op.veiculo,
      frente: op.frente,
      tipoEquipe: op.tipoEquipe || 'PROPRIA',
      meta: op.meta,
      percComissao: (op as any).percComissao || METAS_PADRAO.percComissaoPadrao,
      ativo: op.ativo !== false
    });
    setIsNovoOperadorModal(false);
    setModalEditarOperadorOpen(true);
  };

  const handleAbrirNovoOperador = () => {
    setOperadorParaEditar(null);
    setIsNovoOperadorModal(true);
    setModalEditarOperadorOpen(true);
  };

  const handleSalvarOperadorIndividual = async (dados: Operador) => {
    await salvarOperador(dados);
    const atualizados = await carregarEquipe();
    setEquipe(atualizados);

    // Atualiza imediatamente a lista de producaoOperadores em tempo real
    setProducaoOperadores((prev) => {
      const idx = prev.findIndex((p) => p.nomeNormalizado === dados.nomeNormalizado);
      if (idx >= 0) {
        return prev.map((p) => {
          if (p.nomeNormalizado !== dados.nomeNormalizado) return p;
          const atingimento = dados.meta > 0 ? (p.faturado / dados.meta) * 100 : 100;
          const excesso = dados.meta > 0 ? Math.max(0, p.faturado - dados.meta) : p.faturado;
          const comissao = excesso * (dados.percComissao / 100);
          return {
            ...p,
            nome: dados.nome,
            veiculo: dados.veiculo,
            frente: dados.frente,
            tipoEquipe: dados.tipoEquipe,
            meta: dados.meta,
            percComissao: dados.percComissao,
            atingimentoMeta: atingimento,
            excesso: excesso,
            comissao: comissao,
            ativo: dados.ativo !== false
          };
        });
      } else {
        return [
          ...prev,
          {
            nome: dados.nome,
            nomeNormalizado: dados.nomeNormalizado,
            veiculo: dados.veiculo,
            frente: dados.frente,
            tipoEquipe: dados.tipoEquipe || 'PROPRIA',
            faturado: 0,
            meta: dados.meta,
            totalOS: 0,
            positivas: 0,
            cortesSupressoes: 0,
            cortes: 0,
            supressoes: 0,
            restabes: 0,
            religacoes: 0,
            restabesReligacoes: 0,
            negociacoesPOS: 0,
            cortesViraramPOS: 0,
            reposicoesPiso: 0,
            faturasPagas: 0,
            infrutiferas: 0,
            fimDoDiaCount: 0,
            percSucesso: 0,
            atingimentoMeta: 0,
            excesso: 0,
            comissao: 0,
            ativo: dados.ativo !== false
          }
        ];
      }
    });

    showToast(`✅ Colaborador ${dados.nome} salvo com sucesso!`);
  };

  const handleCadastrarOperadoresLote = async (novos: Operador[]) => {
    await salvarEquipeEmLote(novos);
    const atualizados = await carregarEquipe();
    setEquipe(atualizados);
    showToast(`✅ ${novos.length} novos colaboradores cadastrados na equipe!`);
  };

  const handleLimparTodosFiltrosExcel = () => {
    setFiltroRapidoChip('TODOS');
    setExcelFiltros({});
    setBuscaOperadorProducao('');
    showToast('🔄 Filtros restaurados com sucesso.');
  };

  const handleCadastrarOperadorManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoOpNome.trim()) {
      alert('Digite o nome do operador.');
      return;
    }

    const op: Operador = {
      nome: novoOpNome.trim(),
      nomeNormalizado: normalize(novoOpNome),
      veiculo: novoOpVeiculo,
      frente: novoOpFrente,
      meta: novoOpMeta,
      percComissao: METAS_PADRAO.percComissaoPadrao,
      ativo: true
    };

    await salvarOperador(op);
    const atualizados = await carregarEquipe();
    setEquipe(atualizados);
    setNovoOpNome('');
    showToast(`👤 Operador ${op.nome} cadastrado com sucesso!`);
  };

  const handleExcluirOperador = async (nomeNorm: string) => {
    if (confirm('Deseja excluir este operador da base?')) {
      await excluirOperador(nomeNorm);
      const atualizados = await carregarEquipe();
      setEquipe(atualizados);
      showToast('🗑️ Operador removido da equipe.');
    }
  };

  const handleAlternarStatusOperador = async (nomeNorm: string) => {
    const op = equipe.find((o) => o.nomeNormalizado === nomeNorm);
    if (!op) return;
    const atualizado: Operador = { ...op, ativo: op.ativo === false ? true : false };
    await salvarOperador(atualizado);
    const lista = await carregarEquipe();
    setEquipe(lista);
  };

  const handleToggleModoEdicao = () => {
    if (!isModoEdicaoEquipe) {
      const buffer: Record<string, Operador> = {};
      equipe.forEach((op) => {
        buffer[op.nomeNormalizado] = { ...op };
      });
      setEdicaoEquipeBuffer(buffer);
      setIsModoEdicaoEquipe(true);
    } else {
      setIsModoEdicaoEquipe(false);
    }
  };

  const handleSalvarEdicaoMassa = async () => {
    const listaParaSalvar = Object.values(edicaoEquipeBuffer);
    await salvarEquipeEmLote(listaParaSalvar);
    const atualizados = await carregarEquipe();
    setEquipe(atualizados);
    setIsModoEdicaoEquipe(false);
    showToast('💾 Alterações na equipe salvas com sucesso!');
  };

  // Funções de Gestão de Usuários e Auditoria
  const handleSalvarUsuario = async (u: Usuario) => {
    await salvarUsuario(u);
    const atualizados = await carregarUsuarios();
    setUsuarios(atualizados);
    showToast(`✅ Usuário ${u.nome} salvo com sucesso!`);
  };

  const handleExcluirUsuario = async (id: string) => {
    if (confirm('Deseja realmente remover o acesso deste usuário?')) {
      await excluirUsuario(id);
      const atualizados = await carregarUsuarios();
      setUsuarios(atualizados);
      showToast('🗑️ Usuário removido do sistema.');
    }
  };

  const handleLimparHistoricoCargas = async () => {
    if (confirm('Deseja limpar todos os registros de auditoria de cargas?')) {
      await limparHistoricoCargas();
      setHistoricoCargas([]);
      showToast('🗑️ Histórico de auditoria de cargas limpo.');
    }
  };

  const handleLoginSucesso = (u: Usuario) => {
    setUsuarioLogado(u);
    localStorage.setItem('torre_usuario_logado', JSON.stringify(u));
    setModalLoginOpen(false);
    showToast(`👋 Bem-vindo(a), ${u.nome}!`);
  };

  const handleConfirmarJustificativa = async (urgenciaId: string, motivo: string, observacao: string) => {
    setUrgencias((prev) =>
      prev.map((item) => {
        if (item.id === urgenciaId) {
          return {
            ...item,
            justificada: true,
            justificativaMotivo: motivo,
            justificativaData: new Date().toLocaleString('pt-BR'),
            justificativaUsuario: usuarioLogado?.nome || 'Supervisor'
          };
        }
        return item;
      })
    );

    // Atualiza a sessão salva no banco local
    const sessaoAtual = await carregarSessaoAtiva();
    if (sessaoAtual) {
      const urgenciasAtualizadas = (sessaoAtual.urgencias || []).map((u) => {
        if (u.id === urgenciaId) {
          return {
            ...u,
            justificada: true,
            justificativaMotivo: motivo,
            justificativaData: new Date().toLocaleString('pt-BR'),
            justificativaUsuario: usuarioLogado?.nome || 'Supervisor'
          };
        }
        return u;
      });
      await salvarSessaoAtiva({ ...sessaoAtual, urgencias: urgenciasAtualizadas });
    }

    showToast('✅ Justificativa registrada! Ordem movida para o Passivo Justificado.');
  };

  // Importação em massa de colaboradores via Excel
  const handleImportarEquipeExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
        const { rows } = await readExcelInWorker(file, 'generic');

        if (rows.length === 0) {
          alert('A planilha de colaboradores está vazia.');
          return;
        }

        const novosOperadores: Operador[] = [];
        let atualizadosCount = 0;
        let novosCount = 0;

        for (let i = 0; i < rows.length; i++) {
          if (i > 0 && i % 500 === 0) {
            await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
          }
          const row = rows[i];
          const nomeRaw = String(
            getValFromRow(row, [
              'Nome',
              'Colaborador',
              'Operador',
              'Funcionário',
              'Nome Completo',
              'NOME',
              'OPERADOR',
              'COLABORADOR'
            ]) || ''
          ).trim();

          if (!nomeRaw) continue;

          const nomeNorm = normalize(nomeRaw);
          const modalRaw = String(
            getValFromRow(row, [
              'Modal',
              'Veículo',
              'Veiculo',
              'Transporte',
              'Tipo',
              'VEICULO',
              'MODAL'
            ]) || ''
          ).trim();

          // Normalizar tipo de veículo
          let veiculo: 'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro' = 'Moto';
          const modalNorm = normalize(modalRaw);
          if (modalNorm.includes('CARRO') || modalNorm.includes('AUTO')) {
            veiculo = 'Carro';
          } else if (modalNorm.includes('AJUDANTE')) {
            veiculo = 'Ajudante de Carro';
          } else if (modalNorm.includes('PEDESTRE') || modalNorm.includes('A PE') || modalNorm.includes('A PÉ')) {
            veiculo = 'Pedestre';
          } else {
            veiculo = 'Moto';
          }

          // Frente de Atuação
          const frenteRaw = String(
            getValFromRow(row, [
              'Frente',
              'Área',
              'Area',
              'Setor',
              'Regional',
              'FRENTE'
            ]) || ''
          ).trim();

          let frente = 'Cobrança Leste';
          const frenteNorm = normalize(frenteRaw);
          if (frenteNorm.includes('ALTO') || frenteNorm.includes('TIETE')) {
            frente = 'Cobrança Alto Tietê';
          } else if (frenteNorm.includes('IRREG') || frenteNorm.includes('VISTORIA')) {
            frente = 'Irregularidade';
          } else if (frenteNorm.includes('HIDRO') || frenteNorm.includes('AFERI')) {
            frente = 'Hidrometria e Aferição';
          }

          // Meta financeira
          const metaRaw = getValFromRow(row, [
            'Meta',
            'Valor Meta',
            'Meta (R$)',
            'Meta Financeira',
            'META',
            'VALOR_META'
          ]);

          let metaValor = 0;
          if (typeof metaRaw === 'number') {
            metaValor = metaRaw;
          } else if (metaRaw) {
            const cleanMeta = String(metaRaw).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            metaValor = parseFloat(cleanMeta) || 0;
          }

          if (metaValor <= 0) {
            metaValor =
              veiculo === 'Carro'
                ? METAS_PADRAO.metaCarro
                : veiculo === 'Moto'
                ? METAS_PADRAO.metaMoto
                : METAS_PADRAO.metaPedestre;
          }

          // Verificar se já existe na base
          const existe = equipe.some((o) => o.nomeNormalizado === nomeNorm);
          if (existe) atualizadosCount++;
          else novosCount++;

          novosOperadores.push({
            nome: nomeRaw,
            nomeNormalizado: nomeNorm,
            veiculo,
            frente,
            meta: metaValor,
            percComissao: METAS_PADRAO.percComissaoPadrao,
            ativo: true
          });
        }

        if (novosOperadores.length === 0) {
          alert('Nenhum colaborador válido identificado na planilha. Verifique as colunas (Nome, Modal/Veículo, Frente, Meta).');
          return;
        }

        await salvarEquipeEmLote(novosOperadores);
        const atualizados = await carregarEquipe();
        setEquipe(atualizados);
        showToast(
          `👥 Sucesso! ${novosOperadores.length} colaboradores processados (${novosCount} novos, ${atualizadosCount} atualizados).`
        );
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Erro ao importar colaboradores via Excel:', error);
      alert('Erro ao importar planilha de equipe: ' + error.message);
    }
  };

  // Baixar modelo de planilha para preenchimento da equipe
  const handleBaixarModeloEquipeExcel = () => {
    const dadosModelo = [
      {
        Nome: 'Exemplo João Silva',
        'Modal / Veículo': 'Moto',
        'Frente de Atuação': 'Cobrança Leste',
        'Meta (R$)': 12739.31
      },
      {
        Nome: 'Exemplo Maria Oliveira',
        'Modal / Veículo': 'Carro',
        'Frente de Atuação': 'Cobrança Alto Tietê',
        'Meta (R$)': 20550.49
      },
      {
        Nome: 'Exemplo Carlos Souza',
        'Modal / Veículo': 'Pedestre',
        'Frente de Atuação': 'Cobrança Leste',
        'Meta (R$)': 6883.45
      }
    ];

    const ws = XLSX.utils.json_to_sheet(dadosModelo);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Equipe');
    XLSX.writeFile(wb, 'Modelo_Importacao_Equipe_Sabesp.xlsx');
    showToast('📥 Modelo de planilha baixado! Preencha e importe de volta.');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e6edf3] flex flex-col font-sans">
      {/* Toast Floating Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f172a] border border-blue-500/50 text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fade-in text-sm font-medium">
          <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Processing Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-red-500/20 border-b-red-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2 text-center">{loadingMsg.title}</h2>
          <p className="text-sm text-slate-400 text-center max-w-md">{loadingMsg.subtitle}</p>
        </div>
      )}

      {/* TOP HEADER - FUTURISTIC EXECUTIVE COMMAND HUD */}
      <header className="bg-[#0b0f19] border-b border-[#1e293b] px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md">
        {/* Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            EC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white tracking-wider">
                ENORSUL <span className="text-cyan-400 font-light">COBRANÇA</span>
              </span>
              <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold uppercase">
                ALTO & LESTE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operação Conectada
              </span>
              <span>•</span>
              <span className="text-slate-400">Meta Sabesp: 9.220 Cortes</span>
            </div>
          </div>
        </div>

        {/* Live HUD Quick Telemetry Strip */}
        <div className="hidden lg:flex items-center gap-4 bg-[#070a12] border border-[#1e293b] px-4 py-1.5 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Cortes Sabesp:</span>
            <span className="text-cyan-400 font-bold">
              {execucoesBrutasResumo.totalCortesSupressoes.toLocaleString('pt-BR')}
            </span>
            <span className="text-slate-600">/ 9.220</span>
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Urgências:</span>
            <span className={`font-bold ${urgencias.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {urgencias.length}
            </span>
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Retrabalho:</span>
            <span className={`font-bold ${retrabalhoFiltrado.length > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
              {retrabalhoFiltrado.length}
            </span>
          </div>
          <div className="w-px h-3.5 bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Faturado:</span>
            <span className="text-emerald-400 font-bold">
              R$ {formatMoney(execucoesBrutasResumo.valorFaturadoTotal)}
            </span>
          </div>
        </div>

        {/* Executive Action Cluster */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 bg-[#070a12] border border-[#1e293b] px-3 py-2 rounded-xl font-mono">
            <span className="text-slate-500 text-[10px] uppercase font-bold">Relógio SLA:</span>
            <span className="text-blue-400 font-bold">
              <ClockSLA onTick={atualizarSLA} />
            </span>
          </div>

          {/* BOTÃO 1: IMPORTAR PLANILHAS (ABRE MODAL DEDICADO, SEM POLUIR A FRENTE) */}
          <button
            onClick={() => setModalImportarArquivosOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
            title="Subir planilhas de Execuções (Motor 1) ou Carteira de Pendências (Motor 2)"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Planilhas</span>
            {(totalExecucoesProcessadas > 0 || totalCarteiraImportada > 0) && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* BOTÃO 2: CENTRAL DE RELATÓRIOS (CONSOLIDA OS 7 BOTÕES SOLTOS) */}
          <button
            onClick={() => setModalCentralRelatoriosOpen(true)}
            className="flex items-center gap-2 bg-[#0f1523] hover:bg-[#162035] text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
            title="Acessar Relatórios de WhatsApp, Memorando Sabesp, Auditoria de Cargas e Backups"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Central de Relatórios</span>
          </button>

          {/* BOTÃO 3: COMPARTILHAR COM CHEFIA (SINCRONIZAÇÃO EM NUVEM E COPIAR LINK) */}
          <button
            onClick={handleCompartilharComChefia}
            className="flex items-center gap-2 bg-[#0f1523] hover:bg-[#162035] text-indigo-300 border border-indigo-500/40 hover:border-indigo-400 font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
            title="Copiar link com dados sincronizados. Seu chefe ou colegas abrem e veem tudo salvo sem ter que subir planilha!"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Compartilhar com Chefia</span>
          </button>

          {/* User Profile Badge & Lock */}
          <div className="flex items-center gap-2 bg-[#070a12] border border-[#1e293b] px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
              {usuarioLogado?.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-white font-bold text-xs leading-none">
                {usuarioLogado?.nome ? usuarioLogado.nome.split(' ')[0] : 'Matheus'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                {usuarioLogado?.cargo || 'SUPERVISOR'}
              </div>
            </div>
            <button
              onClick={() => setModalLoginOpen(true)}
              title="Trocar usuário ou bloquear painel"
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition ml-1"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hidden file inputs for direct programmatic access */}
      <input
        ref={fileInputExecucoesRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileExecucoes}
      />
      <input
        ref={fileInputPendenciasRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFilePendencias}
      />

      {/* NAVIGATION TABS - STREAMLINED & FUTURISTIC */}
      <nav className="bg-[#0b0f19] border-b border-[#1e293b] px-6 flex items-center overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'border-cyan-400 text-white bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Dashboard Executivo
        </button>

        <button
          onClick={() => setActiveTab('urgencias')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'urgencias'
              ? 'border-amber-500 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-amber-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          Urgências & Prazos
          {urgencias.length > 0 && (
            <span className="bg-amber-500 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
              {urgencias.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('retrabalho')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'retrabalho'
              ? 'border-orange-500 text-orange-300 bg-orange-500/10'
              : 'border-transparent text-slate-400 hover:text-orange-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
          Análise de Retrabalho
          {retrabalhoFiltrado.length > 0 && (
            <span className="bg-orange-500 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
              {retrabalhoFiltrado.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('producao')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'producao' || activeTab === 'cobranca_leste' || activeTab === 'cobranca_alto'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-emerald-300'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          Produção & Metas (Diário / Mensal)
        </button>

        <button
          onClick={() => setActiveTab('operadores_apoio')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'operadores_apoio'
              ? 'border-purple-500 text-purple-300 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-purple-300'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          Operadores de Apoio
          {producaoOperadores.filter((op) => op.tipoEquipe === 'APOIO_EXTERNO' || op.frente.includes('Apoio')).length > 0 && (
            <span className="bg-purple-500 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
              {producaoOperadores.filter((op) => op.tipoEquipe === 'APOIO_EXTERNO' || op.frente.includes('Apoio')).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('carteira_livre')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'carteira_livre'
              ? 'border-blue-500 text-blue-300 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-blue-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          Carteira Livre
          {carteiraLivre.length > 0 && (
            <span className="bg-slate-800 text-slate-300 px-2 py-0.2 rounded-full text-[10px]">
              {carteiraLivre.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('raiox_infrutiferas')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'raiox_infrutiferas'
              ? 'border-pink-500 text-pink-300 bg-pink-500/10'
              : 'border-transparent text-slate-400 hover:text-pink-300'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-pink-400" />
          Análise de Infrutíferas
        </button>

        <button
          onClick={() => setActiveTab('equipe')}
          className={`px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition flex items-center gap-2 ${
            activeTab === 'equipe'
              ? 'border-slate-300 text-white bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          Gestão de Equipe
        </button>

        <button
          onClick={() => setModalReposicaoPisoOpen(true)}
          className="px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 border-transparent text-indigo-300 hover:text-white transition flex items-center gap-1.5 ml-auto"
          title="Ver tabela detalhada de reposições de piso executadas, OS e operadores"
        >
          <span className="text-sm">🧱</span>
          Reposição de Piso
          {reposicoesPiso.length > 0 && (
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.2 rounded-full text-[10px] font-bold">
              {reposicoesPiso.length}
            </span>
          )}
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ========================================================= */}
        {/* ABA 1: VISÃO GERAL / DASHBOARD CHEFIA */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Filter bar by Operational Front */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  VISÃO DA FRENTE OPERACIONAL:
                </span>
                <select
                  value={frenteFiltro}
                  onChange={(e) => setFrenteFiltro(e.target.value)}
                  className="bg-[#07090e] border border-[#1f293d] text-white text-xs font-bold px-3 py-1.5 rounded-lg outline-none focus:border-blue-500 transition"
                >
                  <option value="GLOBAL">🌐 COBRANÇA TOTAL (ALTO TIETÊ + LESTE)</option>
                  <option value="Cobrança Alto Tietê">💧 COBRANÇA ALTO TIETÊ</option>
                  <option value="Cobrança Leste">💧 COBRANÇA LESTE</option>
                </select>
              </div>

            </div>

            {/* 4 Super KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Faturamento */}
              <div className="bg-[#0f1523] border border-[#1f293d] border-l-4 border-l-emerald-500 rounded-xl p-5 shadow-sm">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Faturamento Realizado
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  R$ {formatMoney(execucoesBrutasResumo.valorFaturadoTotal)}
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                  <span>{execucoesBrutasResumo.totalPositivas} OS Positivas</span>
                  <span className="text-emerald-500/80 font-bold">DE-PARA Sabesp</span>
                </div>
              </div>

              {/* KPI 2: Sucesso Diário */}
              <div className="bg-[#0f1523] border border-[#1f293d] border-l-4 border-l-blue-500 rounded-xl p-5 shadow-sm">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Sucesso de Visita Diário
                </span>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  {execucoesBrutasResumo.totalPositivas + execucoesBrutasResumo.totalInfrutiferas > 0
                    ? (
                        (execucoesBrutasResumo.totalPositivas /
                          (execucoesBrutasResumo.totalPositivas + execucoesBrutasResumo.totalInfrutiferas)) *
                        100
                      ).toFixed(1)
                    : '0.0'}
                  %
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                  <span>{execucoesBrutasResumo.totalInfrutiferas} Infrutíferas</span>
                  <span className="text-blue-400 font-bold">Visitas com Caixa</span>
                </div>
              </div>

              {/* KPI 3: Urgências Restab & Piso */}
              <div className="bg-[#0f1523] border border-[#1f293d] border-l-4 border-l-amber-500 rounded-xl p-5 shadow-sm">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Urgências Ativas (Restab & Piso)
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono flex items-center gap-2">
                  {urgencias.length}
                  {urgencias.some((u) => u.statusPrazo === 'CRITICA' || u.statusPrazo === 'VENCIDA') && (
                    <span className="text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-400 px-2 py-0.5 rounded-full animate-pulse-fast">
                      Críticas Ativas
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                  <span className="text-red-400 font-semibold">
                    {urgencias.filter((u) => u.statusPrazo === 'VENCIDA').length} Vencidas
                  </span>
                  <span className="text-amber-300 font-semibold">
                    {urgencias.filter((u) => u.statusPrazo === 'CRITICA').length} ≤ 24 Horas
                  </span>
                </div>
              </div>

              {/* KPI 4: Retrabalho Bloqueado Cobrança */}
              <div
                onClick={() => setActiveTab('retrabalho')}
                className="bg-[#0f1523] border border-[#1f293d] border-l-4 border-l-orange-500 rounded-xl p-5 shadow-sm cursor-pointer hover:border-orange-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Retrabalho (Cobrança)
                  </span>
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                    Exclusivo Cobrança
                  </span>
                </div>
                <div className="text-2xl font-black text-orange-400 font-mono flex items-center gap-2">
                  {retrabalhoFiltrado.length}
                  <ShieldAlert className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
                  <span className="text-orange-300 font-medium">OS Cobrança Bloqueadas</span>
                  <span className="text-slate-400 font-medium">
                    Evita visitas viciadas
                  </span>
                </div>
              </div>
            </div>

            {/* TERMOÔMETRO DA META CONTRATUAL SABESP (9.220 CORTES/SUPRESSÕES) */}
            <div className="bg-gradient-to-r from-[#0c182c] via-[#0f1523] to-[#121c2e] border border-blue-500/30 rounded-xl p-5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      CONTRATO SABESP
                    </span>
                    <span className="text-xs text-blue-300 font-bold">
                      Meta Oficial: 9.220 Cortes & Supressões / Mês
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    🎯 Termômetro de Execução da Meta Sabesp
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Acompanhamento do volume de cortes e supressões efetivados e cálculo de impacto das ordens viciadas.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copiarJustificativaSabesp}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
                    title="Copiar texto formal com números consolidados para protocolar na fiscalização da Sabesp"
                  >
                    📋 Copiar Justificativa Técnica para Sabesp
                  </button>
                </div>
              </div>

              {/* Progress Bar & Key Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-[#07090e]/70 border border-[#1f293d] rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cortes/Supressões Concluídos</span>
                  <div className="text-2xl font-black text-blue-400 font-mono">
                    {execucoesBrutasResumo.totalCortesSupressoes.toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">de 9.220 contratadas</span>
                </div>

                <div className="bg-[#07090e]/70 border border-[#1f293d] rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">% da Meta Atingida</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {((execucoesBrutasResumo.totalCortesSupressoes / META_SABESP_CORTES) * 100).toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-emerald-500/80 font-medium">Execução líquida</span>
                </div>

                <div className="bg-[#07090e]/70 border border-[#1f293d] rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Saldo Restante (Gap)</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {Math.max(0, META_SABESP_CORTES - execucoesBrutasResumo.totalCortesSupressoes).toLocaleString('pt-BR')}
                  </div>
                  <span className="text-[11px] text-amber-500/80 font-medium">Cortes pendentes</span>
                </div>

                <div className="bg-[#07090e]/70 border border-[#1f293d] rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PDEs Viciados (2+ Visitas)</span>
                  <div className="text-2xl font-black text-red-400 font-mono">
                    {Array.from(pdeHistoricoMap.values()).filter((p) => p.totalVisitas >= 2 && p.isInfrutifero).length}
                  </div>
                  <span className="text-[11px] text-red-400/80 font-medium">Obstáculos crônicos no local</span>
                </div>
              </div>

              {/* Progress Bar Visual */}
              <div className="w-full bg-slate-900 border border-[#1f293d] h-3.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (execucoesBrutasResumo.totalCortesSupressoes / META_SABESP_CORTES) * 100)}%`
                  }}
                />
              </div>

              {/* Mini Dossiê de Justificativa */}
              <div className="bg-[#07090e]/60 border border-[#1f293d] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <div>
                    <span className="font-bold text-slate-200">Justificativa Operacional Sabesp: </span>
                    <span className="text-slate-400">
                      Foram registradas <strong className="text-amber-300">{execucoesBrutasResumo.totalInfrutiferas} visitas infrutíferas</strong> externas que frustraram cortes devido a impedimentos físicos nos imóveis (portão fechado, cão bravo e morador ausente).
                    </span>
                  </div>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Baixas de Fim do Dia expurgadas: <strong className="text-blue-300">{execucoesBrutasResumo.totalFimDoDia}</strong> (não penalizam a equipe)
                </div>
              </div>
            </div>

            {/* PAINEL EXECUTIVO: CORTES, SUPRESSÕES, NEGOCIAÇÕES POS, REPOSIÇÕES & FATURAS PAGAS */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f293d]/60 pb-3">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    ⚡ Raio-X Executivo da Cobrança: Cortes, Supressões, POS & Pisos
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Visão discriminada: Cortes executados, reversões em negociação via máquina POS, supressões, faturas apresentadas e reposições de piso.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalTabelaDeParaOpen(true)}
                    className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                    title="Visualizar a Tabela Parametrizada de DE → PARA (Item 3.5 do Edital Sabesp/Enorsul)"
                  >
                    <span>📋 Tabela DE → PARA (Edital 3.5)</span>
                  </button>
                  <button
                    onClick={() => setModalReposicaoPisoOpen(true)}
                    className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                  >
                    <span>🧱 Ver Tabela de Reposição de Piso ({reposicoesPiso.length})</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {/* 1. Cortes Executados */}
                <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3.5 shadow-sm min-h-[105px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Cortes Só</span>
                    <span className="text-[9px] text-cyan-300 font-bold bg-cyan-500/10 px-1 py-0.2 rounded font-mono">Meta</span>
                  </div>
                  <div className="text-2xl font-black text-cyan-300 font-mono mt-1">
                    {execucoesBrutasResumo.totalCortes}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cortes estritos executados
                  </div>
                </div>

                {/* 2. Supressões Executadas */}
                <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3.5 shadow-sm min-h-[105px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Supressões Só</span>
                    <span className="text-[9px] text-blue-300 font-bold bg-blue-500/10 px-1 py-0.2 rounded font-mono">Meta</span>
                  </div>
                  <div className="text-2xl font-black text-blue-300 font-mono mt-1">
                    {execucoesBrutasResumo.totalSupressoes}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Supressões concluídas
                  </div>
                </div>

                {/* 3. Cortes que Viraram POS */}
                <div className="bg-[#07090e] border border-[#1f293d] border-l-2 border-l-emerald-500 rounded-xl p-3.5 shadow-sm min-h-[105px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Cortes Viraram POS</span>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">Reversão</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
                    {execucoesBrutasResumo.totalCortesViraramPOS}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Quitou no ato da visita
                  </div>
                </div>

                {/* 4. Total Negociações POS */}
                <div className="bg-[#07090e] border border-[#1f293d] border-l-2 border-l-teal-500 rounded-xl p-3.5 shadow-sm min-h-[105px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Negociações POS</span>
                    <span className="text-[9px] text-teal-300 font-mono bg-teal-500/10 px-1 rounded">R$ 44,28</span>
                  </div>
                  <div className="text-2xl font-black text-teal-300 font-mono mt-1">
                    {execucoesBrutasResumo.totalNegociacoesPOS}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Pagamento na maquininha
                  </div>
                </div>

                {/* 5. Restabes / Religações (Unificado) */}
                <div className="bg-[#07090e] border border-[#1f293d] border-l-2 border-l-sky-500 rounded-xl p-3.5 shadow-sm min-h-[105px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Restabes / Relig.</span>
                    <span className="text-[9px] text-sky-300 font-bold bg-sky-500/10 px-1 rounded font-mono">Unificado</span>
                  </div>
                  <div className="text-2xl font-black text-sky-300 font-mono mt-1">
                    {(execucoesBrutasResumo.totalRestabes || 0) + (execucoesBrutasResumo.totalReligacoes || 0)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Restabelecimentos e religações
                  </div>
                </div>

                {/* 6. Reposições de Piso */}
                <div
                  onClick={() => setModalReposicaoPisoOpen(true)}
                  className="bg-[#07090e] border border-[#1f293d] hover:border-indigo-500/50 cursor-pointer rounded-xl p-3.5 transition shadow-sm min-h-[105px] flex flex-col justify-between"
                  title="Clique para abrir tabela detalhada com OS e operador"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Reposição Piso</span>
                    <span className="text-[9px] text-indigo-300 font-bold bg-indigo-500/10 px-1 rounded font-mono">Lucro</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-300 font-mono mt-1">
                    {execucoesBrutasResumo.totalReposicoesPiso}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    R$ {formatMoney(execucoesBrutasResumo.faturadoReposicoesPiso)} faturados
                  </div>
                </div>
              </div>

              {/* Destaque Especial: Cliente Apresentou Faturas Pagas */}
              <div className="bg-[#07090e]/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📄</span>
                  <div>
                    <span className="font-bold text-amber-300">Cliente Apresentou Faturas Pagas: </span>
                    <span className="text-slate-200 font-black font-mono text-sm px-1.5 py-0.5 bg-amber-500/20 rounded">
                      {execucoesBrutasResumo.totalFaturasPagasApresentadas} OS registradas
                    </span>
                    <span className="text-slate-400 ml-2">
                      (Conforme regra do Edital 3.5, exige validação prévia da Sabesp e da Diretoria para compor medição. Mantido em acompanhamento de auditoria).
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-amber-400/90 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  ⏳ Pendente Validação Sabesp / Diretoria
                </div>
              </div>
            </div>

            {/* GRÁFICO RECHARTS: EVOLUÇÃO DIÁRIA DE FATURAMENTO & ATENDIMENTOS */}
            <GraficoEvolucaoDiaria dados={evolucaoDiaria} />

            {/* Middle Section: Top Performers & Live Report preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Operators with % Sucesso Diário */}
              <div className="lg:col-span-2 bg-[#0f1523] border border-[#1f293d] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Top Produtores & Taxa de Sucesso Diário
                  </h3>
                  <button
                    onClick={() => setActiveTab('producao')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Ver Tabela Completa →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1f293d] text-slate-400">
                        <th className="py-2 px-3">Operador</th>
                        <th className="py-2 px-3">Veículo</th>
                        <th className="py-2 px-3">Frente</th>
                        <th className="py-2 px-3 text-right">Faturado</th>
                        <th className="py-2 px-3 text-center">% Sucesso</th>
                        <th className="py-2 px-3 text-right">Meta (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/50">
                      {producaoFiltrada.slice(0, 5).map((op) => (
                        <tr key={op.nomeNormalizado} className="hover:bg-slate-800/20">
                          <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                            <span>{op.nome}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{op.veiculo}</td>
                          <td className="py-2.5 px-3 text-slate-400">{op.frente}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            R$ {formatMoney(op.faturado)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                op.percSucesso >= 60
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : op.percSucesso >= 40
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {op.percSucesso.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400 font-mono">
                            R$ {formatMoney(op.meta)}
                          </td>
                        </tr>
                      ))}
                      {producaoFiltrada.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">
                            Nenhuma produção carregada. Suba a planilha no Motor 1 de Execuções.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Report CCO WhatsApp Box */}
              <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3 border-b border-[#1f293d] pb-2">
                  <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                    <FileText className="w-4 h-4" />
                    Report Oficial CCO
                  </h3>
                  <button
                    onClick={copiarReportCCO}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1 rounded flex items-center gap-1 transition"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </div>
                <div className="bg-[#07090e] border border-[#1f293d] rounded-lg p-3 text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed flex-1 overflow-y-auto max-h-[300px]">
                  {reportCCOTexto}
                </div>
              </div>
            </div>

            {/* Bottom Section: Raio-X Rápido de Infrutíferas e Carteira Livre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Raio-X de Infrutíferas Resumo */}
              <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                    <PieChart className="w-4 h-4" />
                    Raio-X de Falhas nas Visitas
                  </h3>
                  <button
                    onClick={() => setActiveTab('raiox_infrutiferas')}
                    className="text-xs text-pink-400 hover:underline font-semibold"
                  >
                    Ver Detalhes →
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Por que as equipes estão perdendo viagens? Ranking dos motivos mais frequentes:
                </p>

                <div className="space-y-3">
                  {infrutiferasEstatisticas.slice(0, 4).map((item) => (
                    <div key={item.motivo}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">{item.motivo}</span>
                        <span className="font-mono text-pink-400 font-bold">
                          {item.quantidade} ({item.percentual.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, item.percentual)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {infrutiferasEstatisticas.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Aguardando processamento de execuções para gerar o Raio-X.
                    </p>
                  )}
                </div>
              </div>

              {/* Status da Carteira Livre (Gaveta) */}
              <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4" />
                    Estoque Regular (Carteira Livre)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ordens comuns (Cortes normais, Supressões, Comunicados) que não possuem urgência imediata. O
                    sistema guarda essas ordens no fundo da gaveta, sem poluir os alertas de Restabelecimento e Piso.
                  </p>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-[#07090e] border border-[#1f293d] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Total em Carteira Livre:</span>
                    <span className="text-2xl font-black text-white font-mono">{carteiraLivre.length}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('carteira_livre')}
                    className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs px-3.5 py-2 rounded-lg transition"
                  >
                    Abrir Gaveta →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: RESTAB & PISO (URGÊNCIAS) */}
        {/* ========================================================= */}
        {activeTab === 'urgencias' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Radar de Urgências Exclusivas (Restabelecimento & Piso)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Monitoramento cirúrgico de SLA para Restabelecimentos, Religações e Reposições de Piso. Ordens que vencem hoje (≤ 24h) e amanhã (24h-48h) em destaque prioritário.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsReportChefiaOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
                  title="Gerar report formatado com Vencem Hoje e Vencem Amanhã para enviar no WhatsApp"
                >
                  <Send className="w-4 h-4" />
                  Report para Chefia (WhatsApp)
                </button>

                {urgencias.length > 0 && (
                  <button
                    onClick={limparCargaPendencias}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                    title="Apagar dados desta carteira de pendências caso tenha subido a planilha errada"
                  >
                    <Trash2 className="w-4 h-4" />
                    Apagar Carteira
                  </button>
                )}

                <button
                  onClick={exportarUrgenciasExcel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#1f293d] font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar (.xlsx)
                </button>
              </div>
            </div>

            {/* Métricas e Contadores por Calendário Civil Real */}
            {(() => {
              const vencidasNaoJustificadas = urgencias.filter((u) => u.statusPrazo === 'VENCIDA' && !u.justificada);
              const vencidasJustificadas = urgencias.filter((u) => u.statusPrazo === 'VENCIDA' && u.justificada);
              const vencemHoje = urgencias.filter((u) => u.statusPrazo === 'CRITICA');
              const vencemProximos2Dias = urgencias.filter((u) => u.statusPrazo === 'AMANHA');
              const noPrazo = urgencias.filter((u) => u.statusPrazo === 'NO_PRAZO');

              return (
                <>
                  {/* 4 Cards de Status SLA com Filtro Instantâneo ao Clicar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div
                      onClick={() => setFiltroStatusUrgencia(filtroStatusUrgencia === 'VENCIDA_NAO_JUSTIFICADA' ? 'TODOS' : 'VENCIDA_NAO_JUSTIFICADA')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        filtroStatusUrgencia === 'VENCIDA_NAO_JUSTIFICADA'
                          ? 'border-red-500 bg-red-500/20 ring-2 ring-red-500/50'
                          : vencidasNaoJustificadas.length > 0
                          ? 'bg-[#0f1523] border-red-500/50 hover:bg-red-500/10'
                          : 'bg-[#0f1523] border-[#1e293b] hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center justify-between">
                        <span>🔴 Passivo Vencido</span>
                        {vencidasNaoJustificadas.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                        )}
                      </div>
                      <div className="text-2xl font-black text-red-300 font-mono mt-1">
                        {vencidasNaoJustificadas.length}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {vencidasNaoJustificadas.length > 0 ? '⚠️ Não justificado (Risco)' : 'Sem pendências passivas'}
                      </div>
                    </div>

                    <div
                      onClick={() => setFiltroStatusUrgencia(filtroStatusUrgencia === 'CRITICA' ? 'TODOS' : 'CRITICA')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        filtroStatusUrgencia === 'CRITICA'
                          ? 'border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50'
                          : 'bg-[#0f1523] border-amber-500/40 hover:bg-amber-500/10'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        ⚡ Vencem Hoje ({new Date().toLocaleDateString('pt-BR').slice(0, 5)})
                      </div>
                      <div className="text-2xl font-black text-amber-300 font-mono mt-1">
                        {vencemHoje.length}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Dia civil atual • Despachar agora</div>
                    </div>

                    <div
                      onClick={() => setFiltroStatusUrgencia(filtroStatusUrgencia === 'AMANHA' ? 'TODOS' : 'AMANHA')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        filtroStatusUrgencia === 'AMANHA'
                          ? 'border-yellow-500 bg-yellow-500/20 ring-2 ring-yellow-500/50'
                          : 'bg-[#0f1523] border-yellow-500/40 hover:bg-yellow-500/10'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1">
                        🟡 Próximos 2 Dias (D+1 e D+2)
                      </div>
                      <div className="text-2xl font-black text-yellow-300 font-mono mt-1">
                        {vencemProximos2Dias.length}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Programar rotas com antecedência</div>
                    </div>

                    <div
                      onClick={() => setFiltroStatusUrgencia(filtroStatusUrgencia === 'NO_PRAZO' ? 'TODOS' : 'NO_PRAZO')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        filtroStatusUrgencia === 'NO_PRAZO'
                          ? 'border-emerald-500 bg-emerald-500/20 ring-2 ring-emerald-500/50'
                          : 'bg-[#0f1523] border-emerald-500/40 hover:bg-emerald-500/10'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        🟢 No Prazo (&gt; 2 Dias)
                      </div>
                      <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
                        {noPrazo.length}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Vencimento a partir de D+3</div>
                    </div>
                  </div>

                  {/* BANNER DE ALERTA SE HOUVER PASSIVO NÃO JUSTIFICADO */}
                  {vencidasNaoJustificadas.length > 0 && (
                    <div className="bg-red-500/15 border-2 border-red-500/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-red-500/10 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/30 text-red-300 flex items-center justify-center border border-red-500/50 shrink-0">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white flex items-center gap-2">
                            ⚠️ ALERTA CONTRATUAL: {vencidasNaoJustificadas.length} ORDENS NO PASSIVO VENCIDO SEM JUSTIFICATIVA!
                          </h4>
                          <p className="text-xs text-red-200 mt-0.5">
                            Estas ordens já ultrapassaram a data limite da Sabesp. Registre a justificativa operacional para mitigar multas ou despache com prioridade máxima.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFiltroStatusUrgencia('VENCIDA_NAO_JUSTIFICADA')}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-md flex items-center gap-1.5 shrink-0"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Ver Passivos para Justificar ({vencidasNaoJustificadas.length})
                      </button>
                    </div>
                  )}

                  {/* Agrupamento Rápido em Cards por TSS */}
                  {urgenciasAgrupadas.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {urgenciasAgrupadas.map((card) => (
                        <div
                          key={card.tipo}
                          className={`p-3.5 rounded-xl border bg-[#0f1523] ${
                            card.temVencido ? 'border-red-500/60 glow-red' : 'border-amber-500/40'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-300 truncate" title={card.tipo}>
                            {card.tipo}
                          </div>
                          <div className="text-xl font-black text-amber-400 font-mono mt-1">
                            {card.qtd} <span className="text-xs font-normal text-slate-400">ordens</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Prazo mais próximo: <span className="font-semibold text-white">{formatDataHora(card.vencMaisProximo)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Foco de Carteira e Status da Operação (Filtros Requisitados pela Gestão) */}
                  <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-3.5 space-y-3">
                    {/* Linha 1: Foco Principal (Restab/Piso vs Vencidos Cobrança vs Todos) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f293d]/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          🎯 Foco da Carteira:
                        </span>
                        <button
                          onClick={() => setFiltroTipoPendencias('RESTAB_PISO')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                            filtroTipoPendencias === 'RESTAB_PISO'
                              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>⚡ Restab & Piso (Foco Multa Sabesp)</span>
                        </button>
                        <button
                          onClick={() => setFiltroTipoPendencias('VENCIDOS_COBRANCA')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 ${
                            filtroTipoPendencias === 'VENCIDOS_COBRANCA'
                              ? 'bg-red-600 text-white shadow-md font-black ring-2 ring-red-400/50'
                              : 'bg-slate-800 text-red-300 hover:text-white'
                          }`}
                        >
                          <span>🔴 Todos os Vencidos da Cobrança (Cortes, Supressão, Vistorias)</span>
                        </button>
                        <button
                          onClick={() => setFiltroTipoPendencias('TODOS')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                            filtroTipoPendencias === 'TODOS'
                              ? 'bg-blue-600 text-white shadow-md font-black'
                              : 'bg-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>📋 Todas as Pendências</span>
                        </button>
                      </div>

                      {/* Linha 2: Status da Operação (Despachada / Planejada / Planejável) */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          Status da Operação:
                        </span>
                        {(['TODOS', 'DESPACHADA', 'PLANEJADA', 'PLANEJAVEL'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => setFiltroStatusOSCarteira(st)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                              filtroStatusOSCarteira === st
                                ? 'bg-cyan-500 text-slate-950 font-black shadow'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {st === 'TODOS'
                              ? 'Todos os Status'
                              : st === 'DESPACHADA'
                              ? '🛵 Despachada (Em Campo)'
                              : st === 'PLANEJADA'
                              ? '📋 Planejada (CCO)'
                              : '⏳ Planejável / Pendente'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Linha 3: Busca e Filtro de Prazos SLA */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                        <Search className="w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="🔍 Buscar por OS, PDE, Bairro, Município ou Equipe..."
                          value={searchTermUrgencias}
                          onChange={(e) => setSearchTermUrgencias(e.target.value)}
                          className="w-full bg-[#07090e] border border-[#1f293d] text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-amber-500 transition"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 text-xs flex-wrap">
                        <span className="text-slate-400 font-medium">Prazo:</span>
                        <button
                          onClick={() => setFiltroStatusUrgencia('TODOS')}
                          className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                            filtroStatusUrgencia === 'TODOS'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Todas Ativas ({urgencias.filter((u) => !u.justificada).length})
                        </button>

                        <button
                          onClick={() => setFiltroStatusUrgencia('CRITICA')}
                          className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                            filtroStatusUrgencia === 'CRITICA'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          ⚡ Vencem Hoje ({vencemHoje.length})
                        </button>

                        <button
                          onClick={() => setFiltroStatusUrgencia('AMANHA')}
                          className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                            filtroStatusUrgencia === 'AMANHA'
                              ? 'bg-yellow-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟡 Próximos 2 Dias ({vencemProximos2Dias.length})
                        </button>

                        <button
                          onClick={() => setFiltroStatusUrgencia('NO_PRAZO')}
                          className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                            filtroStatusUrgencia === 'NO_PRAZO'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          🟢 No Prazo ({noPrazo.length})
                        </button>

                        <button
                          onClick={() => setFiltroStatusUrgencia('VENCIDA_NAO_JUSTIFICADA')}
                          className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                            filtroStatusUrgencia === 'VENCIDA_NAO_JUSTIFICADA'
                              ? 'bg-red-500 text-white shadow'
                              : 'bg-slate-800 text-red-400 hover:text-white'
                          }`}
                        >
                          🔴 Passivo Não Justificado ({vencidasNaoJustificadas.length})
                        </button>

                        <button
                          onClick={() => setFiltroStatusUrgencia('VENCIDA_JUSTIFICADA')}
                          className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                            filtroStatusUrgencia === 'VENCIDA_JUSTIFICADA'
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-slate-800 text-blue-400 hover:text-white'
                          }`}
                        >
                          📁 Passivo Justificado ({vencidasJustificadas.length})
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Urgencies Table */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#161f33] text-white border-b border-[#1f293d] z-10 shadow-sm">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Status SLA</th>
                      <th className="py-2.5 px-3 font-bold">Número OS</th>
                      <th className="py-2.5 px-3 font-bold">PDE (10 Dígitos)</th>
                      <th className="py-2.5 px-3 font-bold">Serviço TSS</th>
                      <th className="py-2.5 px-3 font-bold">Onde Fica (Município / Bairro)</th>
                      <th className="py-2.5 px-3 font-bold">Com Quem Está</th>
                      <th className="py-2.5 px-3 font-bold">Status da OS</th>
                      <th className="py-2.5 px-3 font-bold">Horário de Vencimento</th>
                      <th className="py-2.5 px-3 font-bold text-center">Tratativa / Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]/50">
                    {urgenciasPageItems.map((item) => {
                      const isVencida = item.statusPrazo === 'VENCIDA';
                      const isCritica = item.statusPrazo === 'CRITICA';
                      const isAmanha = item.statusPrazo === 'AMANHA';
                      const horaVenc = item.horarioVencimento || formatDataHoraVencimento(item.vencReal);
                      const opAlocado = item.operadorAlocado || item.equipe || '-';
                      const status = item.statusOS || 'DESPACHADA';

                      return (
                        <tr
                          key={item.id}
                          className={`transition ${
                            isVencida
                              ? 'bg-red-500/10 hover:bg-red-500/20'
                              : isCritica
                              ? 'bg-amber-500/10 hover:bg-amber-500/20'
                              : isAmanha
                              ? 'bg-yellow-500/5 hover:bg-yellow-500/15'
                              : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isVencida ? (
                              item.justificada ? (
                                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 w-max">
                                  📁 JUSTIFICADA
                                </span>
                              ) : (
                                <span className="bg-red-500/25 text-red-300 border border-red-500/50 px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1 w-max">
                                  🔴 VENCIDA (PASSIVO)
                                </span>
                              )
                            ) : isCritica ? (
                              <span className="bg-amber-500/25 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1 w-max animate-pulse-fast">
                                ⚡ VENCE HOJE
                              </span>
                            ) : isAmanha ? (
                              <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded text-[11px] font-black flex items-center gap-1 w-max">
                                🟡 PRÓXIMOS 2 DIAS
                              </span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[11px] font-bold">
                                🟢 NO PRAZO (&gt; 2 DIAS)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                            {item.os}
                            {item.duplicadaNaCarteira && (
                              <span
                                className="ml-1.5 text-[10px] bg-red-500/30 text-red-300 border border-red-500/40 px-1 rounded font-bold"
                                title="Sabesp enviou este PDE mais de uma vez na carteira de hoje!"
                              >
                                2x
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-400 whitespace-nowrap pde-cell">
                            <div className="flex items-center gap-1.5">
                              <span>{item.pde}</span>
                              <button
                                onClick={(e) => handleCopiarPDE(item.pde, e)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-blue-500/20 transition"
                                title="Copiar PDE para consulta no sistema Sabesp"
                              >
                                {copiedPde === item.pde ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-200">{item.descricao}</td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            <span className="font-semibold text-white">{item.municipio}</span>
                            {item.bairro && <span className="text-slate-400 text-[11px]"> • {item.bairro}</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 font-medium whitespace-nowrap">
                            <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-[#1f293d] text-slate-200">
                              👤 {opAlocado}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] px-2 py-0.5 rounded font-bold">
                              {status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={isVencida ? 'text-red-400' : isCritica ? 'text-amber-300' : 'text-slate-300'}>
                                ⏰ {horaVenc}
                              </span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                {item.tempoFormatado}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isVencida && !item.justificada && (
                                <button
                                  onClick={() => setItemParaJustificarModal(item)}
                                  className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded font-bold transition flex items-center gap-1 shadow-sm"
                                  title="Registrar justificativa de vencimento para auditoria"
                                >
                                  📝 Justificar
                                </button>
                              )}

                              {item.justificada && (
                                <span
                                  className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold"
                                  title={`Justificado por ${item.justificativaUsuario} em ${item.justificativaData}: ${item.justificativaMotivo}`}
                                >
                                  ✓ Justificada
                                </span>
                              )}

                              <button
                                onClick={() => copiarItemWhatsApp(item)}
                                className="text-[10px] bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white px-2 py-1 rounded border border-emerald-500/40 transition font-bold flex items-center gap-1 shadow-sm"
                                title="Copiar texto pronto desta OS para enviar no WhatsApp do operador"
                              >
                                <Send className="w-3 h-3" />
                                WhatsApp
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {urgenciasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500 text-sm">
                          {urgencias.length === 0
                            ? 'Aguardando inserção da Carteira de Pendências (Motor 2) para mapear Restabelecimento e Piso.'
                            : 'Nenhuma urgência encontrada para os filtros selecionados.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-3">
                <PaginationControls
                  currentPage={urgenciasPage}
                  totalPages={urgenciasTotalPages}
                  totalItems={urgenciasFiltradas.length}
                  onPageChange={setUrgenciasPage}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: RETRABALHO BLOQUEADO (EXCLUSIVO COBRANÇA) */}
        {/* ========================================================= */}
        {activeTab === 'retrabalho' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-950/40 via-[#0f1523] to-[#0f1523] border border-orange-500/30 rounded-xl p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-orange-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      FRENTE DE COBRANÇA
                    </span>
                    <span className="text-xs text-slate-400">
                      Corte • Supressão • Negociação POS • Restabelecimento • Religação • Reposição
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-orange-400 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-orange-400" />
                    Guarita Anti-Retrabalho: Visitas Repetidas Bloqueadas (Cobrança)
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    Ordens de cobrança sequestradas preventivamente porque o PDE já possui histórico de visitas infrutíferas recentes no Banco Local. Economize combustível e tempo da sua equipe de cobrança!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('operadores_apoio')}
                    className="bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                  >
                    🤝 Ver Colaboradores de Apoio
                  </button>

                  <button
                    onClick={exportarRetrabalhoExcel}
                    className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Exportar Retrabalho (.xlsx)
                  </button>
                </div>
              </div>
            </div>

            {/* Banner de Estatísticas e Status Pós-Execução */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0f1523] border border-orange-500/30 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Retrabalhos Mapeados</span>
                <span className="text-xl font-black text-orange-400 font-mono mt-0.5 block">
                  {retrabalho.filter((r) => r.isCobranca !== false).length}
                </span>
                <span className="text-[10px] text-slate-500">Histórico de visitas repetidas</span>
              </div>

              <div className="bg-[#0f1523] border border-emerald-500/30 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Resolvidos nesta Carga</span>
                <span className="text-xl font-black text-emerald-300 font-mono mt-0.5 block">
                  {retrabalho.filter((r) => r.isCobranca !== false && r.statusOS === 'EXECUTADA' && r.statusExecucao !== 'INFRUTIFERO_REINCIDENTE' && r.novaCondicao && !r.novaCondicao.includes('Infrutífero')).length}
                </span>
                <span className="text-[10px] text-slate-500">Cortes, supressões e POS executados</span>
              </div>

              <div className="bg-[#0f1523] border border-red-500/30 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Permanece Infrutífero</span>
                <span className="text-xl font-black text-red-400 font-mono mt-0.5 block">
                  {retrabalho.filter((r) => r.isCobranca !== false && (r.statusExecucao === 'INFRUTIFERO_REINCIDENTE' || (r.novaCondicao && r.novaCondicao.includes('Infrutífero')))).length}
                </span>
                <span className="text-[10px] text-slate-500">Reincidência de imóvel fechado/ausente</span>
              </div>

              <div className="bg-[#0f1523] border border-purple-500/30 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">PDEs Viciados Crônicos</span>
                <span className="text-xl font-black text-purple-300 font-mono mt-0.5 block">
                  {retrabalho.filter((r) => r.isCobranca !== false && (r.tipoRetrabalho === 'PDE_VICIADO' || r.visitasAnteriores >= 3)).length}
                </span>
                <span className="text-[10px] text-slate-500">3 ou mais visitas sem desfecho</span>
              </div>
            </div>

            {/* Search and Subfilters Bar */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="🔍 Filtrar retrabalho de cobrança por OS, PDE, Serviço ou Motivo da Falha..."
                  value={searchTermRetrabalho}
                  onChange={(e) => setSearchTermRetrabalho(e.target.value)}
                  className="w-full bg-[#07090e] border border-[#1f293d] text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-orange-500 transition"
                />
              </div>

              {/* Subfilters */}
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="text-slate-400 font-medium">Classificação:</span>
                <button
                  onClick={() => setFiltroRetrabalhoTipo('TODOS')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                    filtroRetrabalhoTipo === 'TODOS'
                      ? 'bg-orange-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Cobrança ({retrabalho.filter((r) => r.isCobranca !== false).length})
                </button>
                <button
                  onClick={() => setFiltroRetrabalhoTipo('RESOLVIDOS')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                    filtroRetrabalhoTipo === 'RESOLVIDOS'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-emerald-400 hover:text-white'
                  }`}
                >
                  ✅ Resolvidos ({retrabalho.filter((r) => r.isCobranca !== false && r.statusOS === 'EXECUTADA' && r.statusExecucao !== 'INFRUTIFERO_REINCIDENTE' && r.novaCondicao && !r.novaCondicao.includes('Infrutífero')).length})
                </button>
                <button
                  onClick={() => setFiltroRetrabalhoTipo('FALHAS')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                    filtroRetrabalhoTipo === 'FALHAS'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🔴 Falhas ({retrabalho.filter((r) => r.isCobranca !== false && r.tipoRetrabalho === 'INFRUTIFERO_ANTERIOR').length})
                </button>
                <button
                  onClick={() => setFiltroRetrabalhoTipo('MULTIVISITAS')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                    filtroRetrabalhoTipo === 'MULTIVISITAS'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🔁 Múltiplas Visitas ({retrabalho.filter((r) => r.isCobranca !== false && r.tipoRetrabalho === 'MULTIVISITAS').length})
                </button>
                <button
                  onClick={() => setFiltroRetrabalhoTipo('VICIADOS')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                    filtroRetrabalhoTipo === 'VICIADOS'
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-purple-400 hover:text-white'
                  }`}
                >
                  🚨 PDEs Viciados ({retrabalho.filter((r) => r.isCobranca !== false && (r.tipoRetrabalho === 'PDE_VICIADO' || r.visitasAnteriores >= 3)).length})
                </button>
                <button
                  onClick={() => setFiltroRetrabalhoTipo('DUPLICADAS')}
                  className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                    filtroRetrabalhoTipo === 'DUPLICADAS'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ⚠️ Duplicadas ({retrabalho.filter((r) => r.isCobranca !== false && (r.tipoRetrabalho === 'DUPLICIDADE_CARTEIRA' || r.duplicadaNaCarteira)).length})
                </button>
              </div>
            </div>

            {/* Blocked Orders Table */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#161f33] text-white border-b border-[#1f293d] z-10 shadow-sm">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Tipo de Bloqueio</th>
                      <th className="py-2.5 px-3 font-bold text-center text-cyan-300">Nova Condição do PDE / Status</th>
                      <th className="py-2.5 px-3 font-bold">Nova OS (Sabesp)</th>
                      <th className="py-2.5 px-3 font-bold">PDE (10 Dígitos)</th>
                      <th className="py-2.5 px-3 font-bold">Serviço de Cobrança</th>
                      <th className="py-2.5 px-3 font-bold text-center">Nº Visitas Anteriores</th>
                      <th className="py-2.5 px-3 font-bold">Última Visita (Data)</th>
                      <th className="py-2.5 px-3 font-bold">Motivo da Falha / Detalhe</th>
                      <th className="py-2.5 px-3 font-bold">Operador Anterior</th>
                      <th className="py-2.5 px-3 font-bold text-center">Histórico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]/50">
                    {retrabalhoPageItems.map((item) => {
                      const isViciadoCronico = item.visitasAnteriores >= 3;
                      return (
                        <tr
                          key={item.id}
                          className={`transition ${
                            isViciadoCronico
                              ? 'bg-red-950/20 hover:bg-red-900/30'
                              : 'hover:bg-orange-500/5'
                          }`}
                        >
                          <td className="py-2 px-3 whitespace-nowrap">
                            {item.tipoRetrabalho === 'DUPLICIDADE_CARTEIRA' || item.duplicadaNaCarteira ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-max">
                                ⚠️ DUPLICADA
                              </span>
                            ) : isViciadoCronico ? (
                              <span className="bg-red-600/30 text-red-300 border border-red-500/50 px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 w-max animate-pulse">
                                🚨 PDE VICIADO (3+)
                              </span>
                            ) : item.tipoRetrabalho === 'MULTIVISITAS' ? (
                              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-max">
                                🔁 REINCIDENTE
                              </span>
                            ) : (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-max">
                                🔴 FALHA ANTERIOR
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-center">
                            {item.novaCondicao ? (
                              <span className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 border shadow-sm ${
                                item.novaCondicao.includes('Cortado') || item.novaCondicao.includes('Suprimido')
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                  : item.novaCondicao.includes('POS')
                                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                                  : item.novaCondicao.includes('Restabelecido') || item.novaCondicao.includes('Relig')
                                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                  : item.novaCondicao.includes('Infrutífero')
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}>
                                {item.novaCondicao}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">Aguardando Execução</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-white whitespace-nowrap">
                            {item.os}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-orange-400 whitespace-nowrap pde-cell">
                            <div className="flex items-center gap-1.5 bg-[#07090e] border border-orange-500/20 px-2 py-0.5 rounded">
                              <span>{item.pde}</span>
                              <button
                                onClick={(e) => handleCopiarPDE(item.pde, e)}
                                className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-orange-500/30 transition"
                                title="Copiar PDE para consulta no sistema Sabesp"
                              >
                                {copiedPde === item.pde ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-200 max-w-[220px] truncate" title={item.descricao}>
                            {item.descricao}
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span
                              className={`font-mono font-black text-xs px-2 py-0.5 rounded-full border ${
                                isViciadoCronico
                                  ? 'bg-red-600 text-white border-red-400 shadow-sm'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {item.visitasAnteriores}x
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {item.ultimaData}
                          </td>
                          <td className="py-2 px-3 font-semibold text-amber-300 max-w-[260px] truncate" title={item.motivoFalhaAnterior}>
                            {item.motivoFalhaAnterior}
                          </td>
                          <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-slate-300">
                              {item.operadorAnterior || 'Equipe Anterior'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => setItemHistoricoModal(item)}
                              className="text-[11px] bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white px-2.5 py-1 rounded border border-blue-500/30 transition font-bold"
                            >
                              🔍 Ver ({item.historicoVisitas?.length || item.visitasAnteriores})
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {retrabalhoFiltrado.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                          {retrabalho.filter((r) => r.isCobranca !== false).length === 0
                            ? 'Nenhum PDE repetido de cobrança detectado na carteira atual.'
                            : 'Nenhuma ordem de cobrança encontrada para os filtros selecionados.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-3">
                <PaginationControls
                  currentPage={retrabalhoPage}
                  totalPages={retrabalhoTotalPages}
                  totalItems={retrabalhoFiltrado.length}
                  onPageChange={setRetrabalhoPage}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3.1: OPERADORES DE APOIO / OUTRAS FRENTES NA COBRANÇA */}
        {/* ========================================================= */}
        {activeTab === 'operadores_apoio' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-950/40 via-[#0f1523] to-[#0f1523] border border-purple-500/30 rounded-xl p-5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      COLABORADORES DE APOIO
                    </span>
                    <span className="text-xs text-slate-400">
                      Operadores temporários ou de outros setores que executaram ordens na Cobrança
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-purple-300 flex items-center gap-2">
                    🤝 Operadores de Apoio & Outras Frentes na Cobrança
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    Aqui aparecem exclusivamente os funcionários <strong>não fixos na cobrança</strong> que produziram ordens na sua frente. O serviço e faturamento deles são contabilizados na meta geral da Sabesp, sem distorcer o cálculo de desempenho da sua equipe própria.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('producao')}
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                  >
                    💰 Ver Produção Geral
                  </button>
                </div>
              </div>
            </div>

            {/* KPIs de Apoio */}
            {(() => {
              const opsApoio = producaoOperadores.filter(
                (op) => op.tipoEquipe === 'APOIO_EXTERNO' || op.frente.includes('Apoio')
              );
              const totalOS = opsApoio.reduce((acc, curr) => acc + curr.totalOS, 0);
              const totalCortes = opsApoio.reduce((acc, curr) => acc + curr.cortesSupressoes, 0);
              const totalFaturado = opsApoio.reduce((acc, curr) => acc + curr.faturado, 0);
              const totalPositivas = opsApoio.reduce((acc, curr) => acc + curr.positivas, 0);
              const totalReais = opsApoio.reduce((acc, curr) => acc + (curr.positivas + curr.infrutiferas), 0);
              const percSucessoMedio = totalReais > 0 ? ((totalPositivas / totalReais) * 100).toFixed(1) : '0.0';

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#0f1523] border border-purple-500/30 rounded-xl p-4">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">
                        Operadores de Apoio
                      </span>
                      <div className="text-2xl font-black text-purple-300 font-mono">{opsApoio.length}</div>
                      <span className="text-[11px] text-slate-400">Atuando temporariamente</span>
                    </div>

                    <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        OS Executadas na Cobrança
                      </span>
                      <div className="text-2xl font-black text-white font-mono">{totalOS}</div>
                      <span className="text-[11px] text-slate-400">{totalPositivas} positivas com faturamento</span>
                    </div>

                    <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Cortes & Supressões (Apoio)
                      </span>
                      <div className="text-2xl font-black text-blue-400 font-mono">{totalCortes}</div>
                      <span className="text-[11px] text-blue-400/80">Contribuem para a meta 9.220</span>
                    </div>

                    <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Faturamento Gerado
                      </span>
                      <div className="text-2xl font-black text-emerald-400 font-mono">
                        R$ {formatMoney(totalFaturado)}
                      </div>
                      <span className="text-[11px] text-slate-400">Sucesso Médio: {percSucessoMedio}%</span>
                    </div>
                  </div>

                  {/* Tabela de Operadores de Apoio */}
                  <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto max-h-[550px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-[#161f33] text-white border-b border-[#1f293d] z-10 shadow-sm">
                          <tr>
                            <th className="py-2.5 px-3 font-bold">Colaborador</th>
                            <th className="py-2.5 px-3 font-bold">Modal / Veículo</th>
                            <th className="py-2.5 px-3 font-bold">Origem / Status</th>
                            <th className="py-2.5 px-3 font-bold text-center">Total OS</th>
                            <th className="py-2.5 px-3 font-bold text-center">Cortes / Supressões</th>
                            <th className="py-2.5 px-3 font-bold text-center">Positivas</th>
                            <th className="py-2.5 px-3 font-bold text-center">Infrutíferas</th>
                            <th className="py-2.5 px-3 font-bold text-right">Faturamento Gerado</th>
                            <th className="py-2.5 px-3 font-bold text-center">% Sucesso Real</th>
                            <th className="py-2.5 px-3 font-bold text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f293d]/50">
                          {opsApoio.map((op) => (
                            <tr key={op.nomeNormalizado} className="hover:bg-purple-500/5 transition">
                              <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                                👤 {op.nome}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">{op.veiculo}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-black">
                                  Apoio Temporário
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                                {op.totalOS}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-400">
                                {op.cortesSupressoes}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">
                                {op.positivas}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-red-400 font-bold">
                                {op.infrutiferas}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                                R$ {formatMoney(op.faturado)}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                    op.percSucesso >= 60
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : op.percSucesso >= 40
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                                  }`}
                                >
                                  {op.percSucesso.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={async () => {
                                      const novaEquipe = equipe.map((item) =>
                                        item.nomeNormalizado === op.nomeNormalizado
                                          ? {
                                              ...item,
                                              frente: 'Cobrança Leste',
                                              tipoEquipe: 'PROPRIA' as const,
                                              meta: item.veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto
                                            }
                                          : item
                                      );
                                      setEquipe(novaEquipe);
                                      await salvarEquipeEmLote(novaEquipe);
                                      setProducaoOperadores((prev) =>
                                        prev.map((p) =>
                                          p.nomeNormalizado === op.nomeNormalizado
                                            ? {
                                                ...p,
                                                frente: 'Cobrança Leste',
                                                tipoEquipe: 'PROPRIA',
                                                meta: p.veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto
                                              }
                                            : p
                                        )
                                      );
                                      showToast(`✅ ${op.nome} fixado na Cobrança Leste!`);
                                    }}
                                    className="text-[11px] bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white px-2 py-0.5 rounded border border-cyan-500/40 transition font-bold"
                                    title="Tornar operador fixo da Cobrança Leste"
                                  >
                                    Fixar Leste
                                  </button>

                                  <button
                                    onClick={async () => {
                                      const novaEquipe = equipe.map((item) =>
                                        item.nomeNormalizado === op.nomeNormalizado
                                          ? {
                                              ...item,
                                              frente: 'Cobrança Alto Tietê',
                                              tipoEquipe: 'PROPRIA' as const,
                                              meta: item.veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto
                                            }
                                          : item
                                      );
                                      setEquipe(novaEquipe);
                                      await salvarEquipeEmLote(novaEquipe);
                                      setProducaoOperadores((prev) =>
                                        prev.map((p) =>
                                          p.nomeNormalizado === op.nomeNormalizado
                                            ? {
                                                ...p,
                                                frente: 'Cobrança Alto Tietê',
                                                tipoEquipe: 'PROPRIA',
                                                meta: p.veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto
                                              }
                                            : p
                                        )
                                      );
                                      showToast(`✅ ${op.nome} fixado na Cobrança Alto Tietê!`);
                                    }}
                                    className="text-[11px] bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-0.5 rounded border border-indigo-500/40 transition font-bold"
                                    title="Tornar operador fixo da Cobrança Alto Tietê"
                                  >
                                    Fixar Alto
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

                          {opsApoio.length === 0 && (
                            <tr>
                              <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                                {totalExecucoesProcessadas === 0
                                  ? 'Aguardando inserção da planilha de execuções (Motor 1).'
                                  : 'Nenhum operador de apoio externo identificado nesta planilha. Todos os colaboradores pertencem à equipe própria.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 4: CARTEIRA LIVRE (FUNDO DA GAVETA) */}
        {/* ========================================================= */}
        {activeTab === 'carteira_livre' && (
          <div className="space-y-6">
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-blue-400 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Carteira Livre (Serviços Regulares)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Estoque de serviços que não possuem exigência de emergência imediata (Cortes normais, Supressões, etc.).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg border border-[#1f293d]">
                  {carteiraLivreFiltrada.length} Ordens Livres
                </span>
                <button
                  onClick={exportarCarteiraLivreExcel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#1f293d] font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  Exportar (.xlsx)
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-3.5 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="🔍 Buscar na carteira livre por OS, PDE, Bairro ou Serviço..."
                value={searchTermLivre}
                onChange={(e) => setSearchTermLivre(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Table */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto max-h-[550px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#161f33] text-white border-b border-[#1f293d] z-10 shadow-sm">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Número OS</th>
                      <th className="py-2.5 px-3 font-bold">PDE</th>
                      <th className="py-2.5 px-3 font-bold">Serviço TSS</th>
                      <th className="py-2.5 px-3 font-bold">Frente</th>
                      <th className="py-2.5 px-3 font-bold">Município / Bairro</th>
                      <th className="py-2.5 px-3 font-bold">Competência</th>
                      <th className="py-2.5 px-3 font-bold">Equipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]/50">
                    {carteiraLivreFiltrada.slice(0, 100).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">{item.os}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-400 whitespace-nowrap pde-cell">
                          <div className="flex items-center gap-1.5">
                            <span>{item.pde}</span>
                            <button
                              onClick={(e) => handleCopiarPDE(item.pde, e)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-blue-500/20 transition"
                              title="Copiar PDE para consulta no sistema Sabesp"
                            >
                              {copiedPde === item.pde ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{item.descricao}</td>
                        <td className="py-2.5 px-3 text-slate-400">{item.frente}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {item.municipio} {item.bairro ? `• ${item.bairro}` : ''}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono">
                          {formatDataAbrev(item.dtCompetencia)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{item.equipe || '-'}</td>
                      </tr>
                    ))}

                    {carteiraLivreFiltrada.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                          Nenhuma ordem encontrada na carteira livre.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 5, 6, 7: PRODUÇÃO & METAS (GERAL E FRENTES) */}
        {/* ========================================================= */}
        {(activeTab === 'producao' || activeTab === 'cobranca_leste' || activeTab === 'cobranca_alto') && (
          <div className="space-y-6">
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-emerald-400 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  {activeTab === 'producao'
                    ? 'Produção, Diagnóstico de Desempenho & Metas'
                    : activeTab === 'cobranca_leste'
                    ? 'Equipe Cobrança Leste – Faturamento & Metas'
                    : 'Equipe Cobrança Alto Tietê – Faturamento & Metas'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Taxa de Sucesso Real calculada com expurgo de Fim do Dia, ranking em lista por colaborador e acompanhamento de cortes para a Sabesp.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {totalExecucoesProcessadas > 0 && (
                  <button
                    onClick={limparCargaExecucoes}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                    title="Apagar dados desta planilha caso tenha subido o arquivo errado"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Apagar Planilha
                  </button>
                )}

                <button
                  onClick={exportarProducaoExcel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#1f293d] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Exportar (.xlsx)
                </button>
              </div>
            </div>

            {/* SELETOR INTEGRADO DE INTERVALO DE DATAS (DIÁRIO / SEMANAL / MENSAL / CUSTOM / COMPARATIVO) */}
            <SeletorIntervaloDatas
              tipoAgregacao={tipoAgregacao}
              onChangeTipo={setTipoAgregacao}
              intervaloCustom={intervaloCustom}
              onChangeIntervalo={setIntervaloCustom}
              datasDisponiveis={datasDisponiveis}
              dataFiltro={dataFiltro}
              onChangeDataFiltro={setDataFiltro}
              semanaFiltro={semanaFiltro}
              onChangeSemanaFiltro={setSemanaFiltro}
              semanasDisponiveis={semanasDisponiveis}
              mesFiltro={mesFiltro}
              onChangeMesFiltro={setMesFiltro}
              mesesDisponiveis={mesesDisponiveis}
              somenteEquipeOficial={somenteEquipeOficial}
              onToggleEquipeOficial={() => setSomenteEquipeOficial(!somenteEquipeOficial)}
              operadoresExcluidosCount={operadoresExcluidos.length}
              onRestaurarOperadores={restaurarOperadoresExcluidos}
            />

            {/* PAINEL EXECUTIVO COMPARATIVO (QUANDO O MODO COMPARATIVO ESTIVER ATIVO) */}
            {tipoAgregacao === 'COMPARATIVO' && (
              <div className="bg-gradient-to-r from-purple-950/40 via-[#0f1523] to-indigo-950/40 border border-purple-500/40 rounded-xl p-4 space-y-3 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      ⚖️ Diagnóstico Comparativo Executivo
                    </span>
                    <span className="text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono">
                      Período A ({intervaloCustom.dataInicio.slice(5)} a {intervaloCustom.dataFim.slice(5)}) vs Período B ({intervaloCustom.dataInicioComp?.slice(5)} a {intervaloCustom.dataFimComp?.slice(5)})
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Acompanhamento de tendência de crescimento vs mês/período anterior
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Card 1: Faturamento Comparativo */}
                  <div className="bg-[#07090e]/80 p-3 rounded-lg border border-[#1f293d]">
                    <span className="text-[11px] text-slate-400 block mb-1">Faturamento Período A</span>
                    <div className="text-lg font-black text-emerald-400 font-mono">
                      R$ {formatMoney(faturadoAtual)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>Base B: R$ {formatMoney(faturadoComparadoBase)}</span>
                    </div>
                  </div>

                  {/* Card 2: Crescimento / Queda Faturamento */}
                  <div className={`p-3 rounded-lg border ${
                    variacaoFaturadoTotal >= 0
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-red-950/30 border-red-500/40'
                  }`}>
                    <span className="text-[11px] text-slate-400 block mb-1">Variação Faturamento</span>
                    <div className={`text-lg font-black font-mono flex items-center gap-1 ${
                      variacaoFaturadoTotal >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {variacaoFaturadoTotal >= 0 ? '↗ +' : '↘ '}
                      {variacaoFaturadoTotal.toFixed(1)}%
                    </div>
                    <span className={`text-[11px] font-bold ${
                      variacaoFaturadoTotal >= 0 ? 'text-emerald-300' : 'text-red-300'
                    }`}>
                      {variacaoFaturadoTotal >= 0 ? '📈 Resultado Positivo (Crescimento)' : '📉 Queda em relação à base'}
                    </span>
                  </div>

                  {/* Card 3: Cortes Comparativos */}
                  <div className="bg-[#07090e]/80 p-3 rounded-lg border border-[#1f293d]">
                    <span className="text-[11px] text-slate-400 block mb-1">Cortes/Supr. Período A</span>
                    <div className="text-lg font-black text-blue-400 font-mono">
                      {cortesAtuais}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      <span>Base B: {cortesComparadosBase} ({variacaoCortesTotal >= 0 ? '+' : ''}{variacaoCortesTotal.toFixed(1)}%)</span>
                    </div>
                  </div>

                  {/* Card 4: Maior Destaque em Crescimento */}
                  <div className="bg-[#07090e]/80 p-3 rounded-lg border border-[#1f293d]">
                    <span className="text-[11px] text-slate-400 block mb-1">Destaque de Evolução</span>
                    <div className="text-sm font-bold text-white truncate">
                      {melhorEvolucaoOperador ? melhorEvolucaoOperador.nome : 'Todos estáveis'}
                    </div>
                    <div className="text-[11px] text-purple-300 font-mono mt-0.5">
                      {melhorEvolucaoOperador?.comparativo?.variacaoFaturadoPerc !== undefined
                        ? `+${melhorEvolucaoOperador.comparativo.variacaoFaturadoPerc.toFixed(0)}% de ganho`
                        : 'Sem histórico anterior'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CARDS DE KPI SUPERIORES EM CSS GRID PROPORCIONAL */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Card 1: Meta Sabesp */}
              <div className="bg-[#0f1523] border border-blue-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[92px]">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Meta Sabesp (Cortes/Supr.)</span>
                  <span className="text-blue-400 font-mono font-bold">{((cortesAtuais / META_SABESP_CORTES) * 100).toFixed(1)}%</span>
                </div>
                <div className="text-xl font-black font-mono text-white mt-1">
                  <span className="text-blue-400">{cortesAtuais}</span>
                  <span className="text-slate-500 text-xs font-normal"> / {META_SABESP_CORTES}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (cortesAtuais / META_SABESP_CORTES) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Restabes / Relig. Unificado */}
              <div className="bg-[#0f1523] border border-teal-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[92px]">
                <div className="flex items-center justify-between text-[11px] text-teal-400 font-bold uppercase tracking-wider">
                  <span>Restabes / Religações</span>
                  <span className="text-[10px] text-teal-300 font-mono font-bold bg-teal-500/10 px-1.5 py-0.5 rounded">Unificado</span>
                </div>
                <div className="text-xl font-black font-mono text-teal-300 mt-1">
                  {restabesReligacoesAtuais} <span className="text-xs text-slate-400 font-normal">executados</span>
                </div>
                <span className="text-[10px] text-slate-500">Métrica 100% consolidada</span>
              </div>

              {/* Card 3: Total Faturado */}
              <div className="bg-[#0f1523] border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[92px]">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Faturamento no Período</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">DE-PARA</span>
                </div>
                <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                  R$ {formatMoney(faturadoAtual)}
                </div>
                <span className="text-[10px] text-emerald-500/80">
                  {execucoesBrutasResumo.totalPositivas} OS positivas realizadas
                </span>
              </div>

              {/* Card 4: Colaboradores Ativos & Média */}
              <div className="bg-[#0f1523] border border-indigo-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[92px]">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Colaboradores na Análise</span>
                  <span className="text-[10px] text-indigo-300 font-mono font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                    {producaoFinal.length} Listados
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-indigo-300 mt-1 flex items-baseline gap-2">
                  <span>{producaoFinal.length}</span>
                  <span className="text-xs text-slate-400 font-normal">
                    {producaoFinal.length > 0 ? `(Média R$ ${formatMoney(faturadoAtual / producaoFinal.length)})` : ''}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {equipe.filter((e) => e.ativo !== false).length} ativos no banco de equipe
                </span>
              </div>
            </div>

            {/* BARRA DE FILTROS RÁPIDOS & ATALHOS DE GESTÃO */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
              {/* Chips de Filtro Rápido */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-bold text-[11px] mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" />
                  Filtros:
                </span>
                {[
                  { id: 'TODOS', label: `Todos (${producaoFiltrada.length})` },
                  { id: 'LESTE', label: '💧 Leste' },
                  { id: 'ALTO', label: '💧 Alto Tietê' },
                  { id: 'MOTOS', label: '🏍️ Motos' },
                  { id: 'CARROS', label: '🚗 Carros' },
                  { id: 'META_BATIDA', label: '🎯 Meta 100%+' },
                  { id: 'NA_TRAVE', label: '⚠️ 80-99%' },
                  { id: 'ABAIXO_META', label: '🔴 <80%' },
                  { id: 'MIGUE', label: '🚨 Alerta Migué' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFiltroRapidoChip(chip.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                      filtroRapidoChip === chip.id
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'bg-[#121826] text-slate-300 hover:bg-[#1a2337] border border-[#1f293d]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Busca + Atalhos da Equipe */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[180px]">
                  <input
                    type="text"
                    placeholder="🔍 Buscar operador..."
                    value={buscaOperadorProducao}
                    onChange={(e) => setBuscaOperadorProducao(e.target.value)}
                    className="w-full bg-[#07090e] border border-[#1f293d] text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-blue-500 transition"
                  />
                  {buscaOperadorProducao && (
                    <button
                      onClick={() => setBuscaOperadorProducao('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {(filtroRapidoChip !== 'TODOS' || buscaOperadorProducao || Object.keys(excelFiltros).length > 0) && (
                  <button
                    type="button"
                    onClick={handleLimparTodosFiltrosExcel}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 transition"
                  >
                    <X className="w-3 h-3" />
                    Limpar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('equipe')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                  title="Ir para a aba Gestão de Equipe para cadastrar novo colaborador, colar lista em lote ou alterar informações"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>👥 Gestão de Equipe</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOperadorParaComparar(producaoFinal[0]?.nomeNormalizado || '');
                    setModalComparadorOpen(true);
                  }}
                  className="bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                  title="Comparar até 3 funcionários lado a lado"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>⚖️ Comparar</span>
                </button>
              </div>
            </div>

            {/* TABELA LISTA COMPLETA DOS COLABORADORES COM COLUNA FIXA E FILTROS EXCEL */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
              <div className="p-3 bg-[#161f33] border-b border-[#1f293d] flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  Lista Completa de Desempenho ({producaoFinal.length} colaboradores exibidos)
                </span>
                <span className="text-slate-400 text-[11px]">
                  📌 Coluna do Operador fixada à esquerda • Clique em <span className="text-cyan-300 font-bold">✏️</span> para editar dados
                </span>
              </div>

                <div className="overflow-x-auto max-h-[550px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#161f33] text-white border-b border-[#1f293d] z-20 shadow-sm">
                      <tr>
                        {/* Coluna Fixa: Operador */}
                        <th className="sticky left-0 bg-[#161f33] z-30 py-2.5 px-3 font-bold border-r border-[#1f293d] shadow-md">
                          <div className="flex items-center justify-between gap-1">
                            <span>Operador</span>
                            <ExcelColumnFilter
                              columnId="operador"
                              columnTitle="Operador"
                              options={opcoesOperadoresExcel}
                              selectedValues={excelFiltros.operador?.selected || []}
                              onChangeSelectedValues={(vals) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  operador: { ...prev.operador, selected: vals, sort: prev.operador?.sort || null }
                                }))
                              }
                              sortDirection={excelFiltros.operador?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  operador: { ...prev.operador, selected: prev.operador?.selected || [], sort: dir }
                                }))
                              }
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-center">Ações Rápidas</th>

                        <th className="py-2.5 px-3 font-bold">
                          <div className="flex items-center justify-between gap-1">
                            <span>Frente</span>
                            <ExcelColumnFilter
                              columnId="frente"
                              columnTitle="Frente"
                              options={opcoesFrentesExcel}
                              selectedValues={excelFiltros.frente?.selected || []}
                              onChangeSelectedValues={(vals) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  frente: { ...prev.frente, selected: vals, sort: prev.frente?.sort || null }
                                }))
                              }
                              sortDirection={excelFiltros.frente?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  frente: { ...prev.frente, selected: prev.frente?.selected || [], sort: dir }
                                }))
                              }
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold">
                          <div className="flex items-center justify-between gap-1">
                            <span>Veículo</span>
                            <ExcelColumnFilter
                              columnId="veiculo"
                              columnTitle="Veículo"
                              options={opcoesVeiculosExcel}
                              selectedValues={excelFiltros.veiculo?.selected || []}
                              onChangeSelectedValues={(vals) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  veiculo: { ...prev.veiculo, selected: vals, sort: prev.veiculo?.sort || null }
                                }))
                              }
                              sortDirection={excelFiltros.veiculo?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  veiculo: { ...prev.veiculo, selected: prev.veiculo?.selected || [], sort: dir }
                                }))
                              }
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold">
                          <div className="flex items-center justify-between gap-1">
                            <span>Equipe</span>
                            <ExcelColumnFilter
                              columnId="tipoEquipe"
                              columnTitle="Tipo de Equipe"
                              options={opcoesTiposEquipeExcel}
                              selectedValues={excelFiltros.tipoEquipe?.selected || []}
                              onChangeSelectedValues={(vals) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  tipoEquipe: { ...prev.tipoEquipe, selected: vals, sort: prev.tipoEquipe?.sort || null }
                                }))
                              }
                              sortDirection={excelFiltros.tipoEquipe?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  tipoEquipe: { ...prev.tipoEquipe, selected: prev.tipoEquipe?.selected || [], sort: dir }
                                }))
                              }
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>Total OS</span>
                            <ExcelColumnFilter
                              columnId="totalOS"
                              columnTitle="Total OS"
                              options={[]}
                              selectedValues={[]}
                              onChangeSelectedValues={() => {}}
                              sortDirection={excelFiltros.totalOS?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  totalOS: { ...prev.totalOS, selected: [], sort: dir }
                                }))
                              }
                              isNumeric={true}
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>Cortes/Supr.</span>
                            <ExcelColumnFilter
                              columnId="cortes"
                              columnTitle="Cortes / Supr."
                              options={[]}
                              selectedValues={[]}
                              onChangeSelectedValues={() => {}}
                              sortDirection={excelFiltros.cortes?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  cortes: { ...prev.cortes, selected: [], sort: dir }
                                }))
                              }
                              isNumeric={true}
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-center text-teal-300">
                          <div className="flex items-center justify-center gap-1">
                            <span>Restabe/Relig.</span>
                            <ExcelColumnFilter
                              columnId="restabes"
                              columnTitle="Restabe / Relig."
                              options={[]}
                              selectedValues={[]}
                              onChangeSelectedValues={() => {}}
                              sortDirection={excelFiltros.restabes?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  restabes: { ...prev.restabes, selected: [], sort: dir }
                                }))
                              }
                              isNumeric={true}
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>POS</span>
                            <ExcelColumnFilter
                              columnId="pos"
                              columnTitle="Negoc. POS"
                              options={[]}
                              selectedValues={[]}
                              onChangeSelectedValues={() => {}}
                              sortDirection={excelFiltros.pos?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  pos: { ...prev.pos, selected: [], sort: dir }
                                }))
                              }
                              isNumeric={true}
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-center">Piso</th>
                        <th className="py-2.5 px-3 font-bold text-center">Positivas</th>
                        <th className="py-2.5 px-3 font-bold text-center">Infrutíferas</th>
                        <th className="py-2.5 px-3 font-bold text-center">Fim do Dia</th>

                        <th className="py-2.5 px-3 font-bold text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span>Sucesso (%)</span>
                            <ExcelColumnFilter
                              columnId="sucesso"
                              columnTitle="Sucesso Real (%)"
                              options={[]}
                              selectedValues={[]}
                              onChangeSelectedValues={() => {}}
                              sortDirection={excelFiltros.sucesso?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  sucesso: { ...prev.sucesso, selected: [], sort: dir }
                                }))
                              }
                              isNumeric={true}
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span>Faturado (R$)</span>
                            <ExcelColumnFilter
                              columnId="faturado"
                              columnTitle="Faturado (R$)"
                              options={[]}
                              selectedValues={[]}
                              onChangeSelectedValues={() => {}}
                              sortDirection={excelFiltros.faturado?.sort || null}
                              onSortChange={(dir) =>
                                setExcelFiltros((prev) => ({
                                  ...prev,
                                  faturado: { ...prev.faturado, selected: [], sort: dir }
                                }))
                              }
                              isNumeric={true}
                            />
                          </div>
                        </th>

                        <th className="py-2.5 px-3 font-bold text-right">Meta (R$)</th>
                        <th className="py-2.5 px-3 font-bold text-center">% Meta</th>
                        <th className="py-2.5 px-3 font-bold text-right">Comissão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/50">
                      {producaoPageItems.map((op) => (
                        <tr key={op.nomeNormalizado} className="hover:bg-slate-800/20 transition">
                          {/* Coluna Fixa: Operador */}
                          <td className="sticky left-0 bg-[#0f1523] z-10 py-2.5 px-3 font-bold text-white whitespace-nowrap border-r border-[#1f293d] shadow-sm">
                            <div className="flex items-center gap-2">
                              <span>👤 {op.nome}</span>
                              <button
                                onClick={() => handleAbrirEditarOperador(op)}
                                className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
                                title="Editar operador"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setDossieOperadorSelecionado({
                                    nome: op.nome,
                                    nomeNormalizado: op.nomeNormalizado,
                                    veiculo: op.veiculo,
                                    frente: op.frente,
                                    tipoEquipe: op.tipoEquipe || 'PROPRIA',
                                    totalOS: op.totalOS,
                                    cortesSupressoes: op.cortesSupressoes,
                                    cortes: op.cortes || 0,
                                    supressoes: op.supressoes || 0,
                                    restabes: op.restabes || 0,
                                    religacoes: op.religacoes || 0,
                                    negociacoesPOS: op.negociacoesPOS || 0,
                                    cortesViraramPOS: op.cortesViraramPOS || 0,
                                    reposicoesPiso: op.reposicoesPiso || 0,
                                    faturasPagas: op.faturasPagas || 0,
                                    positivas: op.positivas,
                                    infrutiferas: op.infrutiferas,
                                    fimDoDiaCount: op.fimDoDiaCount,
                                    faturado: op.faturado,
                                    percSucesso: op.percSucesso,
                                    diasTrabalhados: Object.keys(op.historicoDiario || {}).length || 1,
                                    bairrosMaisAtuados: op.bairrosMaisAtuados || [],
                                    principaisBaixas: op.principaisBaixas || [],
                                    historicoDiario: op.historicoDiario || {},
                                    diagnostico: op.diagnostico || {
                                      padraoSuspeitoMigue: false,
                                      motivoAlerta: 'Produção padrão dentro dos parâmetros operacionais.',
                                      ordensViciadasPerc: 0,
                                      ordensVirgensPerc: 100,
                                      sugestaoAcao: 'Acompanhamento normal de rotina.'
                                    }
                                  });
                                }}
                                className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-600 hover:bg-blue-500 text-white transition"
                                title="Raio-X individual"
                              >
                                🔬 Raio-X
                              </button>

                              <button
                                onClick={() => {
                                  setOperadorParaComparar(op.nomeNormalizado);
                                  setModalComparadorOpen(true);
                                }}
                                className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                title="Comparar"
                              >
                                ⚖️
                              </button>

                              <button
                                onClick={() => removerOperadorDaProducao(op.nomeNormalizado, op.nome)}
                                className="p-1 rounded text-slate-500 hover:text-red-400"
                                title="Ocultar da análise"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{op.frente}</td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{op.veiculo}</td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              op.tipoEquipe === 'APOIO_EXTERNO'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}>
                              {op.tipoEquipe === 'APOIO_EXTERNO' ? 'Apoio' : 'Própria'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-mono font-bold text-center text-white">{op.totalOS}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-blue-400 bg-blue-500/5">{op.cortesSupressoes}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-teal-300 bg-teal-500/5">
                            {(op.restabes || 0) + (op.religacoes || 0)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-purple-300 bg-purple-500/5">{op.negociacoesPOS || 0}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-amber-300 bg-amber-500/5">{op.reposicoesPiso || 0}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-emerald-400">{op.positivas}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-center text-red-400">{op.infrutiferas}</td>
                          <td className="py-2.5 px-3 font-mono text-center text-slate-500">{op.fimDoDiaCount}</td>

                          <td className="py-2.5 px-3 font-mono font-bold text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                              op.percSucesso >= 60
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : op.percSucesso >= 40
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-red-500/20 text-red-400 border border-red-500/40'
                            }`}>
                              {op.percSucesso.toFixed(1)}%
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-400 whitespace-nowrap">
                            R$ {formatMoney(op.faturado)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-slate-400 whitespace-nowrap">
                            R$ {formatMoney(op.meta)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center">
                            <span className={`font-bold ${
                              op.atingimentoMeta >= 100
                                ? 'text-emerald-400'
                                : op.atingimentoMeta >= 70
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }`}>
                              {op.atingimentoMeta.toFixed(0)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-amber-300 whitespace-nowrap">
                            R$ {formatMoney(op.comissao)}
                          </td>
                        </tr>
                      ))}

                      {producaoFinal.length === 0 && (
                        <tr>
                          <td colSpan={18} className="py-12 text-center text-slate-500 text-sm">
                            Nenhum colaborador corresponde aos filtros selecionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-3">
                  <PaginationControls
                    currentPage={producaoPage}
                    totalPages={producaoTotalPages}
                    totalItems={producaoFinal.length}
                    onPageChange={setProducaoPage}
                  />
                </div>
              </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 8: RAIO-X DE INFRUTÍFERAS */}
        {/* ========================================================= */}
        {activeTab === 'raiox_infrutiferas' && (
          <div className="space-y-6">
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-pink-400 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-pink-400" />
                  Raio-X de Visitas Infrutíferas
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Munição para cobrança de rotas e alinhamento com os operadores que possuem alto volume de viagens perdidas.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold bg-pink-500/10 border border-pink-500/30 px-3 py-1.5 rounded-lg">
                  Total de Infrutíferas: {execucoesBrutasResumo.totalInfrutiferas}
                </span>
              </div>
            </div>

            {/* Ranking dos Motivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white mb-2">Distribuição por Causa de Falha</h3>
                {infrutiferasEstatisticas.map((stat) => (
                  <div key={stat.motivo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{stat.motivo}</span>
                      <span className="font-mono text-pink-400 font-bold">
                        {stat.quantidade} ocorrências ({stat.percentual.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full"
                        style={{ width: `${Math.min(100, stat.percentual)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {infrutiferasEstatisticas.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-8">
                    Nenhuma infrutífera computada ainda.
                  </p>
                )}
              </div>

              {/* Análise de Operadores com Mais Infrutíferas */}
              <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Operadores com Mais Infrutíferas</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1f293d] text-slate-400">
                        <th className="py-2">Operador</th>
                        <th className="py-2 text-center">Infrutíferas</th>
                        <th className="py-2 text-center">% Falhas</th>
                        <th className="py-2 text-right">Faturado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/50">
                      {[...producaoOperadores]
                        .sort((a, b) => b.infrutiferas - a.infrutiferas)
                        .slice(0, 8)
                        .map((op) => {
                          const percFalhas = op.totalOS > 0 ? (op.infrutiferas / op.totalOS) * 100 : 0;
                          return (
                            <tr key={op.nomeNormalizado}>
                              <td className="py-2 font-bold text-white">{op.nome}</td>
                              <td className="py-2 text-center font-mono font-bold text-red-400">
                                {op.infrutiferas}
                              </td>
                              <td className="py-2 text-center font-mono">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                    percFalhas > 50
                                      ? 'bg-red-500/20 text-red-300'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {percFalhas.toFixed(0)}%
                                </span>
                              </td>
                              <td className="py-2 text-right font-mono text-emerald-400">
                                R$ {formatMoney(op.faturado)}
                              </td>
                            </tr>
                          );
                        })}
                      {producaoOperadores.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            Sem dados de execução.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 9: GESTÃO E CADASTRO DA EQUIPE */}
        {/* ========================================================= */}
        {activeTab === 'equipe' && (
          <div className="space-y-6">
            {/* Header / Apresentação da Central de Equipe */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Central de Gestão da Equipe & Cadastro de Colaboradores
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cadastre novos operadores, cole listas de WhatsApp em lote, configure frentes, veículos e metas com sincronização automática e instantânea no faturamento.
                </p>
              </div>

              {/* Botões de Ação Rápida */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAbrirNovoOperador}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
                  title="Cadastrar um novo operador com formulário limpo e metas automáticas"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>➕ Novo Colaborador</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalCadastroRapidoLoteOpen(true)}
                  className="bg-[#161f33] hover:bg-[#1f2c47] text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
                  title="Colar lista de nomes direto do WhatsApp ou planilha para cadastrar múltiplos operadores em segundos"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>📋 Colar Lista (Lote WhatsApp)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalAjusteRapidoEquipeOpen(true)}
                  className="bg-[#161f33] hover:bg-[#1f2c47] text-cyan-300 border border-cyan-500/30 font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                  title="Configurar todos os operadores em 1 clique (frente, veículo e meta padrão)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>⚡ Ajuste em Massa</span>
                </button>

                <button
                  onClick={handleBaixarModeloEquipeExcel}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#1f293d] font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                  title="Baixar modelo em Excel para preencher equipe"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  Modelo (.xlsx)
                </button>

                <label
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow"
                  title="Subir planilha Excel com colaboradores, modalidade (moto/carro), frente e metas"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Subir Planilha (.xlsx)
                  <input
                    ref={fileInputEquipeRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleImportarEquipeExcel}
                  />
                </label>

                <button
                  onClick={handleToggleModoEdicao}
                  className={`text-xs font-bold px-3 py-2 rounded-lg border transition ${
                    isModoEdicaoEquipe
                      ? 'bg-red-500 text-white border-red-400'
                      : 'bg-amber-500 text-slate-950 border-amber-400'
                  }`}
                  title="Editar dados diretamente nas células da tabela"
                >
                  {isModoEdicaoEquipe ? 'Cancelar Edição' : '✏️ Edição em Linha'}
                </button>

                {isModoEdicaoEquipe && (
                  <button
                    onClick={handleSalvarEdicaoMassa}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg transition shadow flex items-center gap-1"
                  >
                    💾 Salvar Tudo
                  </button>
                )}
              </div>
            </div>

            {/* CARDS DE ESTATÍSTICAS DA EQUIPE EM CSS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Total Equipe */}
              <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[95px]">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Total Colaboradores</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {equipe.filter((e) => e.ativo !== false).length} Ativos
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {equipe.length}
                </div>
                <div className="text-[11px] text-slate-500">
                  {equipe.filter((e) => e.ativo === false).length} inativos no histórico
                </div>
              </div>

              {/* Card 2: Leste vs Alto Tietê */}
              <div className="bg-[#0f1523] border border-blue-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[95px]">
                <div className="flex items-center justify-between text-[11px] text-blue-400 font-bold uppercase tracking-wider">
                  <span>Frentes de Cobrança</span>
                  <span className="text-[10px] text-blue-300 font-mono font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">Frentes</span>
                </div>
                <div className="text-base font-black font-mono text-white mt-1 flex items-center gap-3">
                  <span className="text-cyan-300">
                    {equipe.filter((e) => e.frente.includes('Leste')).length} <span className="text-xs font-normal text-slate-400">Leste</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-indigo-300">
                    {equipe.filter((e) => e.frente.includes('Alto')).length} <span className="text-xs font-normal text-slate-400">Alto Tietê</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Distribuição geográfica de cobrança
                </div>
              </div>

              {/* Card 3: Motos vs Carros */}
              <div className="bg-[#0f1523] border border-teal-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[95px]">
                <div className="flex items-center justify-between text-[11px] text-teal-400 font-bold uppercase tracking-wider">
                  <span>Veículos / Modais</span>
                  <span className="text-[10px] text-teal-300 font-mono font-bold bg-teal-500/10 px-1.5 py-0.5 rounded">Modais</span>
                </div>
                <div className="text-base font-black font-mono text-white mt-1 flex items-center gap-3">
                  <span className="text-emerald-400">
                    {equipe.filter((e) => e.veiculo === 'Moto').length} 🏍️ <span className="text-xs font-normal text-slate-400">Motos</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-amber-300">
                    {equipe.filter((e) => e.veiculo === 'Carro').length} 🚗 <span className="text-xs font-normal text-slate-400">Carros</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {equipe.filter((e) => e.veiculo !== 'Moto' && e.veiculo !== 'Carro').length} pedestres ou ajudantes
                </div>
              </div>

              {/* Card 4: Própria vs Apoio */}
              <div className="bg-[#0f1523] border border-purple-500/30 rounded-xl p-3.5 flex flex-col justify-between shadow-sm min-h-[95px]">
                <div className="flex items-center justify-between text-[11px] text-purple-400 font-bold uppercase tracking-wider">
                  <span>Vínculo de Equipe</span>
                  <span className="text-[10px] text-purple-300 font-mono font-bold bg-purple-500/10 px-1.5 py-0.5 rounded">Equipe</span>
                </div>
                <div className="text-base font-black font-mono text-white mt-1 flex items-center gap-3">
                  <span className="text-blue-300">
                    {equipe.filter((e) => e.tipoEquipe !== 'APOIO_EXTERNO').length} <span className="text-xs font-normal text-slate-400">Própria</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-purple-300">
                    {equipe.filter((e) => e.tipoEquipe === 'APOIO_EXTERNO').length} <span className="text-xs font-normal text-slate-400">Apoio</span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Custos e metas individualizadas
                </div>
              </div>
            </div>

            {/* BARRA DE FILTROS RÁPIDOS & BUSCA DE EQUIPE */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-bold text-[11px] mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-cyan-400" />
                  Filtrar Base:
                </span>
                {[
                  { id: 'TODOS', label: `Todos (${equipe.length})` },
                  { id: 'LESTE', label: '💧 Leste' },
                  { id: 'ALTO', label: '💧 Alto Tietê' },
                  { id: 'MOTOS', label: '🏍️ Motos' },
                  { id: 'CARROS', label: '🚗 Carros' },
                  { id: 'PROPRIA', label: '🛡️ Própria' },
                  { id: 'APOIO', label: '🤝 Apoio' },
                  { id: 'ATIVOS', label: '🟢 Ativos' },
                  { id: 'INATIVOS', label: '⚪ Inativos' },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFiltroRapidoEquipe(chip.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                      filtroRapidoEquipe === chip.id
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'bg-[#121826] text-slate-300 hover:bg-[#1a2337] border border-[#1f293d]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[220px]">
                  <input
                    type="text"
                    placeholder="🔍 Buscar colaborador por nome..."
                    value={buscaEquipe}
                    onChange={(e) => setBuscaEquipe(e.target.value)}
                    className="w-full bg-[#07090e] border border-[#1f293d] text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-blue-500 transition"
                  />
                  {buscaEquipe && (
                    <button
                      onClick={() => setBuscaEquipe('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {(filtroRapidoEquipe !== 'TODOS' || buscaEquipe) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroRapidoEquipe('TODOS');
                      setBuscaEquipe('');
                    }}
                    className="text-amber-400 hover:text-amber-300 text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 transition"
                  >
                    <X className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* TABELA PRINCIPAL DA EQUIPE */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
              <div className="p-3 bg-[#161f33] border-b border-[#1f293d] flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Base Cadastral da Equipe ({equipe.filter((op) => {
                    if (buscaEquipe && !normalize(op.nome).includes(normalize(buscaEquipe))) return false;
                    if (filtroRapidoEquipe === 'LESTE') return op.frente.includes('Leste');
                    if (filtroRapidoEquipe === 'ALTO') return op.frente.includes('Alto');
                    if (filtroRapidoEquipe === 'MOTOS') return op.veiculo === 'Moto';
                    if (filtroRapidoEquipe === 'CARROS') return op.veiculo === 'Carro';
                    if (filtroRapidoEquipe === 'PROPRIA') return op.tipoEquipe !== 'APOIO_EXTERNO';
                    if (filtroRapidoEquipe === 'APOIO') return op.tipoEquipe === 'APOIO_EXTERNO';
                    if (filtroRapidoEquipe === 'ATIVOS') return op.ativo !== false;
                    if (filtroRapidoEquipe === 'INATIVOS') return op.ativo === false;
                    return true;
                  }).length} exibidos)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Clique em <span className="text-cyan-300 font-bold">✏️</span> para alterar informações ou <span className="text-emerald-400 font-bold">➕ Novo</span> para cadastrar
                </span>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-[#161f33] text-white border-b border-[#1f293d] z-10 shadow-sm">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-center w-20">Status</th>
                      <th className="py-2.5 px-3 font-bold">Colaborador</th>
                      <th className="py-2.5 px-3 font-bold">Frente de Atuação</th>
                      <th className="py-2.5 px-3 font-bold">Veículo / Modalidade</th>
                      <th className="py-2.5 px-3 font-bold">Tipo de Equipe</th>
                      <th className="py-2.5 px-3 font-bold text-right">Meta Padrão (R$)</th>
                      <th className="py-2.5 px-3 font-bold text-center">% Comissão</th>
                      <th className="py-2.5 px-3 font-bold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]/50">
                    {equipe
                      .filter((op) => {
                        if (buscaEquipe && !normalize(op.nome).includes(normalize(buscaEquipe))) return false;
                        if (filtroRapidoEquipe === 'LESTE') return op.frente.includes('Leste');
                        if (filtroRapidoEquipe === 'ALTO') return op.frente.includes('Alto');
                        if (filtroRapidoEquipe === 'MOTOS') return op.veiculo === 'Moto';
                        if (filtroRapidoEquipe === 'CARROS') return op.veiculo === 'Carro';
                        if (filtroRapidoEquipe === 'PROPRIA') return op.tipoEquipe !== 'APOIO_EXTERNO';
                        if (filtroRapidoEquipe === 'APOIO') return op.tipoEquipe === 'APOIO_EXTERNO';
                        if (filtroRapidoEquipe === 'ATIVOS') return op.ativo !== false;
                        if (filtroRapidoEquipe === 'INATIVOS') return op.ativo === false;
                        return true;
                      })
                      .map((op) => {
                        const norm = op.nomeNormalizado;
                        const bufferOp = edicaoEquipeBuffer[norm] || op;

                        return (
                          <tr key={norm} className="hover:bg-slate-800/25 transition">
                            {/* 1. Status com clique para alternar */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleAlternarStatusOperador(norm)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  op.ativo !== false
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                                }`}
                                title="Clique para Ativar / Inativar este colaborador"
                              >
                                {op.ativo !== false ? '🟢 Ativo' : '⚪ Inativo'}
                              </button>
                            </td>

                            {/* 2. Colaborador com Avatar e Botão Editar Rápido */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                  {op.nome.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-bold text-white text-xs">{op.nome}</span>
                                <button
                                  onClick={() => handleAbrirEditarOperador(op)}
                                  className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
                                  title="Editar informações completas deste colaborador"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* 3. Frente */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isModoEdicaoEquipe ? (
                                <select
                                  value={bufferOp.frente}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    setEdicaoEquipeBuffer((prev) => ({
                                      ...prev,
                                      [norm]: { ...prev[norm], frente: val }
                                    }));
                                  }}
                                  className="bg-[#07090e] border border-blue-500 text-white p-1 rounded text-xs outline-none"
                                >
                                  <option value="Cobrança Leste">Cobrança Leste</option>
                                  <option value="Cobrança Alto Tietê">Cobrança Alto Tietê</option>
                                  <option value="Irregularidade">Irregularidade</option>
                                  <option value="Hidrometria e Aferição">Hidrometria</option>
                                </select>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  op.frente.includes('Alto')
                                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                }`}>
                                  {op.frente}
                                </span>
                              )}
                            </td>

                            {/* 4. Veículo */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {isModoEdicaoEquipe ? (
                                <select
                                  value={bufferOp.veiculo}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    setEdicaoEquipeBuffer((prev) => ({
                                      ...prev,
                                      [norm]: {
                                        ...prev[norm],
                                        veiculo: val,
                                        meta:
                                          val === 'Moto'
                                            ? METAS_PADRAO.metaMoto
                                            : val === 'Carro'
                                            ? METAS_PADRAO.metaCarro
                                            : METAS_PADRAO.metaPedestre
                                      }
                                    }));
                                  }}
                                  className="bg-[#07090e] border border-blue-500 text-white p-1 rounded text-xs outline-none"
                                >
                                  <option value="Moto">Moto</option>
                                  <option value="Carro">Carro</option>
                                  <option value="Pedestre">Pedestre</option>
                                  <option value="Ajudante de Carro">Ajudante</option>
                                </select>
                              ) : (
                                <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-[#1f293d]">
                                  {op.veiculo === 'Carro' ? '🚗 Carro' : op.veiculo === 'Moto' ? '🏍️ Moto' : op.veiculo}
                                </span>
                              )}
                            </td>

                            {/* 5. Tipo de Equipe */}
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                op.tipoEquipe === 'APOIO_EXTERNO'
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}>
                                {op.tipoEquipe === 'APOIO_EXTERNO' ? 'Apoio' : 'Própria'}
                              </span>
                            </td>

                            {/* 6. Meta */}
                            <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
                              {isModoEdicaoEquipe ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={bufferOp.meta}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setEdicaoEquipeBuffer((prev) => ({
                                      ...prev,
                                      [norm]: { ...prev[norm], meta: val }
                                    }));
                                  }}
                                  className="w-24 bg-[#07090e] border border-blue-500 text-white p-1 rounded text-xs font-mono text-right outline-none"
                                />
                              ) : (
                                <span className="text-emerald-400 font-bold">R$ {formatMoney(op.meta)}</span>
                              )}
                            </td>

                            {/* 7. Comissão */}
                            <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                              <span className="text-amber-400 font-bold">
                                {(((op as any).percComissao ?? 0.1) * 100).toFixed(0)}%
                              </span>
                            </td>

                            {/* 8. Ações */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleAbrirEditarOperador(op)}
                                  className="px-2 py-1 rounded text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-[#1f293d] transition flex items-center gap-1"
                                  title="Editar informações completas"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>

                                <button
                                  onClick={() => handleExcluirOperador(norm)}
                                  className="px-1.5 py-1 rounded text-[11px] font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title={`Excluir ${op.nome} da equipe`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    {equipe.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                          Nenhum colaborador cadastrado. Clique em <strong className="text-emerald-400">➕ Novo Colaborador</strong> ou <strong className="text-emerald-400">📋 Colar Lista</strong> acima.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO INFERIOR: CADASTRO MANUAL EXPRESSO */}
            <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-[#1f293d]/50 pb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  Cadastro Manual Rápido (Formulário Direto)
                </h3>
                <span className="text-xs text-slate-400">
                  Ou utilize o botão <strong className="text-emerald-400">➕ Novo Colaborador</strong> no topo
                </span>
              </div>

              <form onSubmit={handleCadastrarOperadorManual} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs items-end">
                <div className="lg:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    value={novoOpNome}
                    onChange={(e) => setNovoOpNome(e.target.value)}
                    className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Veículo / Modalidade</label>
                  <select
                    value={novoOpVeiculo}
                    onChange={(e) => {
                      const v = e.target.value as any;
                      setNovoOpVeiculo(v);
                      if (v === 'Moto') setNovoOpMeta(METAS_PADRAO.metaMoto);
                      else if (v === 'Carro') setNovoOpMeta(METAS_PADRAO.metaCarro);
                      else setNovoOpMeta(METAS_PADRAO.metaPedestre);
                    }}
                    className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg outline-none focus:border-blue-500 transition"
                  >
                    <option value="Moto">Moto</option>
                    <option value="Carro">Carro</option>
                    <option value="Pedestre">Pedestre</option>
                    <option value="Ajudante de Carro">Ajudante de Carro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Frente de Atuação</label>
                  <select
                    value={novoOpFrente}
                    onChange={(e) => setNovoOpFrente(e.target.value)}
                    className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg outline-none focus:border-blue-500 transition"
                  >
                    <option value="Cobrança Leste">Cobrança Leste</option>
                    <option value="Cobrança Alto Tietê">Cobrança Alto Tietê</option>
                    <option value="Irregularidade">Irregularidade</option>
                    <option value="Hidrometria e Aferição">Hidrometria e Aferição</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-slate-400 font-semibold mb-1">Meta (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={novoOpMeta}
                      onChange={(e) => setNovoOpMeta(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg outline-none focus:border-blue-500 font-mono transition"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg transition shadow h-[38px] shrink-0"
                    title="Adicionar à equipe"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0b0f19] border-t border-[#1f293d] px-6 py-3 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>
          Torre de Controle Operacional Sabesp • Cobrança Alto & Leste • Enorsul Gestão Integrada
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Memória Ativa: {pdeHistoricoMap.size} PDEs Indexados no Banco Local
        </span>
      </footer>

      {/* Modal Report para Chefia (WhatsApp) */}
      <ModalReportChefia
        isOpen={isReportChefiaOpen}
        onClose={() => setIsReportChefiaOpen(false)}
        urgencias={urgencias}
        retrabalho={retrabalhoFiltrado}
        faturamentoTotal={execucoesBrutasResumo.valorFaturadoTotal}
      />

      {/* Modal Detalhes do Histórico de Visitas do PDE */}
      {itemHistoricoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Histórico de Visitas do PDE: {itemHistoricoModal.pde}</h3>
                    <button
                      onClick={(e) => handleCopiarPDE(itemHistoricoModal.pde, e)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-orange-500/20 transition"
                      title="Copiar PDE"
                    >
                      {copiedPde === itemHistoricoModal.pde ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{itemHistoricoModal.descricao} • {itemHistoricoModal.bairro}</p>
                </div>
              </div>
              <button
                onClick={() => setItemHistoricoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-orange-400 uppercase font-black block">Status do Bloqueio:</span>
                  <span className="text-sm font-bold text-white">
                    {itemHistoricoModal.tipoRetrabalho === 'DUPLICIDADE_CARTEIRA'
                      ? '⚠️ Duplicidade na Carteira de Hoje'
                      : itemHistoricoModal.tipoRetrabalho === 'MULTIVISITAS'
                      ? '🔁 Múltiplas Visitas Recentes'
                      : '🔴 Histórico de Infrutífera Anterior'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Visitas:</span>
                  <span className="text-lg font-black text-orange-300 font-mono">
                    {itemHistoricoModal.visitasAnteriores}x
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Linha do Tempo das Visitas Registradas:</h4>
                <div className="space-y-2.5">
                  {itemHistoricoModal.historicoVisitas && itemHistoricoModal.historicoVisitas.length > 0 ? (
                    itemHistoricoModal.historicoVisitas.map((visita, idx) => (
                      <div
                        key={idx}
                        className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-400">📅 {visita.data}</span>
                            {visita.os && (
                              <span className="text-slate-500 font-mono text-[10px]">OS: {visita.os}</span>
                            )}
                          </div>
                          <p className="font-semibold text-white">{visita.resultado}</p>
                          <p className="text-[11px] text-slate-400">Operador: {visita.operador || 'Equipe Anterior'}</p>
                        </div>
                        <div>
                          {visita.isInfrutifero ? (
                            <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                              Infrutífera
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                              Executada
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3 text-slate-300">
                      <p>
                        <strong>Última Visita Registrada:</strong> {itemHistoricoModal.ultimaData}
                      </p>
                      <p>
                        <strong>Resultado Anterior:</strong> {itemHistoricoModal.motivoFalhaAnterior}
                      </p>
                      <p>
                        <strong>Operador Anterior:</strong> {itemHistoricoModal.operadorAnterior}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#161f33] border-t border-[#1f293d] px-6 py-3 flex justify-end">
              <button
                onClick={() => setItemHistoricoModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVOS OPERADORES DETECTADOS NA PLANILHA DE EXECUÇÕES */}
      {modalNovosOperadoresOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0f1523] border border-blue-500/40 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-950 via-[#161f33] to-[#0f1523] px-6 py-4 border-b border-[#1f293d] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  👥
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Novos Operadores Detectados na Planilha ({novosOperadoresDetectados.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina se pertencem à sua equipe própria (Cobrança Alto / Leste) ou se são operadores de apoio temporário.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Header */}
            <div className="bg-[#121c2e] px-6 py-2.5 border-b border-[#1f293d] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Definição rápida para todos:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    setNovosOperadoresDetectados((prev) =>
                      prev.map((op) => ({
                        ...op,
                        frente: 'Cobrança Leste',
                        tipoEquipe: 'PROPRIA',
                        meta: METAS_PADRAO.metaMoto
                      }))
                    )
                  }
                  className="bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded text-[11px] font-bold transition"
                >
                  Todos Cobrança Leste
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNovosOperadoresDetectados((prev) =>
                      prev.map((op) => ({
                        ...op,
                        frente: 'Cobrança Alto Tietê',
                        tipoEquipe: 'PROPRIA',
                        meta: METAS_PADRAO.metaMoto
                      }))
                    )
                  }
                  className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded text-[11px] font-bold transition"
                >
                  Todos Cobrança Alto
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNovosOperadoresDetectados((prev) =>
                      prev.map((op) => ({
                        ...op,
                        frente: 'Apoio Externo',
                        tipoEquipe: 'APOIO_EXTERNO',
                        meta: 0
                      }))
                    )
                  }
                  className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded text-[11px] font-bold transition"
                >
                  Todos Apoio Temporário
                </button>
              </div>
            </div>

            {/* List of unmapped operators */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
              {novosOperadoresDetectados.map((item, idx) => (
                <div
                  key={item.nomeNormalizado}
                  className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="min-w-[200px]">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <span>👤 {item.nome}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.nomeNormalizado}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    {/* Switch: Equipe Própria vs Apoio */}
                    <div className="flex items-center bg-[#0f1523] border border-[#1f293d] rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setNovosOperadoresDetectados((prev) =>
                            prev.map((o, i) =>
                              i === idx
                                ? {
                                    ...o,
                                    tipoEquipe: 'PROPRIA',
                                    frente: o.frente === 'Apoio Externo' ? 'Cobrança Leste' : o.frente,
                                    meta: o.veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto
                                  }
                                : o
                            )
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                          item.tipoEquipe === 'PROPRIA'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🟢 Equipe Própria
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNovosOperadoresDetectados((prev) =>
                            prev.map((o, i) =>
                              i === idx
                                ? {
                                    ...o,
                                    tipoEquipe: 'APOIO_EXTERNO',
                                    frente: 'Apoio Externo',
                                    meta: 0
                                  }
                                : o
                            )
                          )
                        }
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                          item.tipoEquipe === 'APOIO_EXTERNO'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🤝 Apoio Temporário
                      </button>
                    </div>

                    {item.tipoEquipe === 'PROPRIA' && (
                      <>
                        {/* Frente */}
                        <select
                          value={item.frente}
                          onChange={(e) =>
                            setNovosOperadoresDetectados((prev) =>
                              prev.map((o, i) =>
                                i === idx ? { ...o, frente: e.target.value as any } : o
                              )
                            )
                          }
                          className="bg-[#0f1523] border border-[#1f293d] text-white text-[11px] font-bold px-2.5 py-1 rounded outline-none focus:border-blue-500"
                        >
                          <option value="Cobrança Leste">Cobrança Leste</option>
                          <option value="Cobrança Alto Tietê">Cobrança Alto Tietê</option>
                        </select>

                        {/* Veículo / Modal */}
                        <select
                          value={item.veiculo}
                          onChange={(e) => {
                            const veic = e.target.value as any;
                            const meta = veic === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto;
                            setNovosOperadoresDetectados((prev) =>
                              prev.map((o, i) => (i === idx ? { ...o, veiculo: veic, meta } : o))
                            );
                          }}
                          className="bg-[#0f1523] border border-[#1f293d] text-white text-[11px] px-2.5 py-1 rounded outline-none focus:border-blue-500"
                        >
                          <option value="Moto">Moto</option>
                          <option value="Carro">Carro</option>
                          <option value="Pedestre">Pedestre</option>
                          <option value="Ajudante de Carro">Ajudante</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-[#161f33] border-t border-[#1f293d] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePularCadastroComoApoio}
                className="text-xs text-slate-400 hover:text-white font-semibold transition"
              >
                Tratar todos como Apoio Temporário
              </button>

              <button
                type="button"
                onClick={handleConfirmarNovosOperadores}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Salvar no Banco e Processar Planilha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dossiê / Raio-X Individual do Operador */}
      {dossieOperadorSelecionado && (
        <ModalDossieOperador
          dossie={dossieOperadorSelecionado}
          onClose={() => setDossieOperadorSelecionado(null)}
        />
      )}

      {/* Modal Histórico de Cargas & Auditoria */}
      {modalHistoricoCargasOpen && (
        <ModalHistoricoCargas
          cargas={historicoCargas}
          onClose={() => setModalHistoricoCargasOpen(false)}
          onLimparHistorico={handleLimparHistoricoCargas}
          onDesfazerCarga={(tipo) => {
            if (tipo === 'EXECUCOES') {
              limparCargaExecucoes();
            } else {
              limparCargaPendencias();
            }
          }}
        />
      )}

      {/* Modal Gestão de Usuários & Senhas */}
      {modalGestaoUsuariosOpen && (
        <ModalGestaoUsuarios
          usuarios={usuarios}
          usuarioLogado={usuarioLogado}
          onSalvarUsuario={handleSalvarUsuario}
          onExcluirUsuario={handleExcluirUsuario}
          onClose={() => setModalGestaoUsuariosOpen(false)}
        />
      )}

      {/* Modal Login & Troca de Usuário */}
      {modalLoginOpen && (
        <ModalLogin
          usuarios={usuarios}
          onLoginSucesso={handleLoginSucesso}
          onClose={() => setModalLoginOpen(false)}
          podeFechar={usuarioLogado !== null}
        />
      )}

      {/* Central Executiva de Relatórios (Consolidada) */}
      <ModalCentralRelatorios
        isOpen={modalCentralRelatoriosOpen}
        onClose={() => setModalCentralRelatoriosOpen(false)}
        usuarioLogado={usuarioLogado}
        onAbrirReportChefia={() => setIsReportChefiaOpen(true)}
        onCopiarReportCCO={copiarReportCCO}
        onCopiarJustificativaSabesp={copiarJustificativaSabesp}
        onAbrirAuditoria={() => setModalHistoricoCargasOpen(true)}
        onExportarExcel={exportarProducaoExcel}
        onExportarBackup={handleExportarBackup}
        onRestaurarBackup={handleRestaurarBackup}
        onLimparBanco={handleLimparBanco}
        fileInputBackupRef={fileInputBackupRef}
      />

      {/* Modal de Importação de Arquivos (Motor 1 & Motor 2) */}
      <ModalImportarArquivos
        isOpen={modalImportarArquivosOpen}
        onClose={() => setModalImportarArquivosOpen(false)}
        usuarioLogado={usuarioLogado}
        totalExecucoesProcessadas={totalExecucoesProcessadas}
        totalCarteiraImportada={totalCarteiraImportada}
        duplicidadesCarteiraCount={duplicidadesCarteiraCount}
        modoCarga={modoCarga}
        setModoCarga={setModoCarga}
        fileInputExecucoesRef={fileInputExecucoesRef}
        fileInputPendenciasRef={fileInputPendenciasRef}
        onFileExecucoes={handleFileExecucoes}
        onFilePendencias={handleFilePendencias}
      />

      {/* Modal Comparador de Operadores (Até 3) */}
      <ModalComparadorOperadores
        isOpen={modalComparadorOpen}
        onClose={() => setModalComparadorOpen(false)}
        operadores={producaoFiltrada}
        operadorInicial={operadorParaComparar}
      />

      {/* Modal Tabela Oficial DE -> PARA (Item 3.5 do Edital) */}
      <ModalTabelaDePara
        isOpen={modalTabelaDeParaOpen}
        onClose={() => setModalTabelaDeParaOpen(false)}
      />

      {/* Modal Detalhado de Reposição de Piso */}
      {modalReposicaoPisoOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1f293d] flex items-center justify-between bg-[#162035]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧱</span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Tabela Detalhada de Reposições de Piso ({reposicoesPiso.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Acompanhamento de OS, operador executor, local e controle de reincidência/retrabalho.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalReposicaoPisoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <TabelaReposicaoPiso reposicoes={reposicoesPiso} frenteFiltro={frenteFiltro} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição / Cadastro Individual de Operador */}
      <ModalEditarOperador
        isOpen={modalEditarOperadorOpen}
        isNovo={isNovoOperadorModal}
        operador={operadorParaEditar}
        onClose={() => setModalEditarOperadorOpen(false)}
        onSalvar={handleSalvarOperadorIndividual}
      />

      {/* Modal de Cadastro Rápido de Colaboradores em Lote */}
      <ModalCadastroRapidoOperadores
        isOpen={modalCadastroRapidoLoteOpen}
        onClose={() => setModalCadastroRapidoLoteOpen(false)}
        onCadastrarLote={handleCadastrarOperadoresLote}
      />

      {/* Modal de Ajuste Rápido de Equipe em 1 Clique */}
      <ModalAjusteRapidoEquipe
        isOpen={modalAjusteRapidoEquipeOpen}
        onClose={() => setModalAjusteRapidoEquipeOpen(false)}
        totalOperadores={equipe.length || producaoOperadores.length}
        totalApoioExterno={equipe.filter((e) => e.tipoEquipe === 'APOIO_EXTERNO').length}
        onAplicarAjusteMassa={async (config) => {
          const baseLista = equipe.length > 0 ? equipe : producaoOperadores.map((p) => ({
            nomeNormalizado: p.nomeNormalizado,
            nome: p.nome,
            veiculo: config.veiculo,
            frente: config.frente,
            tipoEquipe: config.tipoEquipe,
            meta: config.meta,
            percComissao: 0.1,
            ativo: true
          }));

          const novos = baseLista.map((op) => ({
            ...op,
            tipoEquipe: config.tipoEquipe,
            frente: config.frente,
            veiculo: config.veiculo,
            meta: config.meta,
            percComissao: (op as any).percComissao ?? 0.1
          }));

          await salvarEquipeEmLote(novos);
          const atualizados = await carregarEquipe();
          setEquipe(atualizados);
          setProducaoOperadores((prev) =>
            prev.map((p) => ({
              ...p,
              frente: config.frente,
              veiculo: config.veiculo,
              tipoEquipe: config.tipoEquipe,
              meta: config.meta
            }))
          );
          setModalAjusteRapidoEquipeOpen(false);
          showToast('✅ Equipe atualizada com sucesso em lote!');
        }}
        onAbrirCadastroIndividual={() => {
          setModalAjusteRapidoEquipeOpen(false);
          handleAbrirNovoOperador();
        }}
        onAbrirImportacaoExcel={() => {
          setModalAjusteRapidoEquipeOpen(false);
          setModalCadastroRapidoLoteOpen(true);
        }}
      />
    </div>
  );
}

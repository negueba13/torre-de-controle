import React from 'react';
import { Calendar, ArrowRightLeft, Clock, RotateCcw, CalendarDays, Layers, Users, Sparkles, Filter } from 'lucide-react';
import { TipoAgregacaoProducao, IntervaloDatasCustom, AgregacaoItem } from '../types';

interface SeletorIntervaloDatasProps {
  tipoAgregacao: TipoAgregacaoProducao;
  onChangeTipo: (tipo: TipoAgregacaoProducao) => void;
  intervaloCustom: IntervaloDatasCustom;
  onChangeIntervalo: (novo: IntervaloDatasCustom) => void;
  datasDisponiveis: string[];
  dataFiltro?: string;
  onChangeDataFiltro?: (dia: string) => void;
  semanaFiltro?: string;
  onChangeSemanaFiltro?: (sem: string) => void;
  semanasDisponiveis?: AgregacaoItem[];
  mesFiltro?: string;
  onChangeMesFiltro?: (mes: string) => void;
  mesesDisponiveis?: AgregacaoItem[];
  somenteEquipeOficial?: boolean;
  onToggleEquipeOficial?: () => void;
  operadoresExcluidosCount?: number;
  onRestaurarOperadores?: () => void;
}

export const SeletorIntervaloDatas: React.FC<SeletorIntervaloDatasProps> = ({
  tipoAgregacao,
  onChangeTipo,
  intervaloCustom,
  onChangeIntervalo,
  datasDisponiveis,
  dataFiltro = 'TODOS',
  onChangeDataFiltro,
  semanaFiltro = 'TODOS',
  onChangeSemanaFiltro,
  semanasDisponiveis = [],
  mesFiltro = 'TODOS',
  onChangeMesFiltro,
  mesesDisponiveis = [],
  somenteEquipeOficial = false,
  onToggleEquipeOficial,
  operadoresExcluidosCount = 0,
  onRestaurarOperadores
}) => {
  // Presets solicitados pela gestão
  const aplicarPreset = (preset: string) => {
    const anoAtual = '2026';
    if (preset === 'CICLO_1_A_30') {
      onChangeTipo('CUSTOM');
      onChangeIntervalo({
        dataInicio: `${anoAtual}-10-01`,
        dataFim: `${anoAtual}-10-30`,
        nomePreset: 'Ciclo 1 ao 30 (Outubro/2026)',
        compararComAnterior: false,
        dataInicioComp: `${anoAtual}-09-01`,
        dataFimComp: `${anoAtual}-09-30`
      });
    } else if (preset === 'COMPARATIVO_JUL_AGO') {
      onChangeTipo('COMPARATIVO');
      onChangeIntervalo({
        dataInicio: `${anoAtual}-08-01`,
        dataFim: `${anoAtual}-08-31`,
        dataInicioComp: `${anoAtual}-07-01`,
        dataFimComp: `${anoAtual}-07-31`,
        nomePreset: 'Comparativo 01/07 vs 01/08',
        compararComAnterior: true
      });
    } else if (preset === 'MES_10') {
      onChangeTipo('CUSTOM');
      onChangeIntervalo({
        dataInicio: `${anoAtual}-10-01`,
        dataFim: `${anoAtual}-10-31`,
        nomePreset: 'Mês 10 (Outubro/2026 - Novo Ciclo)',
        compararComAnterior: false
      });
    } else if (preset === 'MES_09') {
      onChangeTipo('CUSTOM');
      onChangeIntervalo({
        dataInicio: `${anoAtual}-09-01`,
        dataFim: `${anoAtual}-09-30`,
        nomePreset: 'Mês 09 (Setembro/2026 - Fechamento)',
        compararComAnterior: false
      });
    } else if (preset === 'MES_08') {
      onChangeTipo('CUSTOM');
      onChangeIntervalo({
        dataInicio: `${anoAtual}-08-01`,
        dataFim: `${anoAtual}-08-31`,
        nomePreset: 'Mês 08 (Agosto/2026)',
        compararComAnterior: false
      });
    } else if (preset === 'MES_07') {
      onChangeTipo('CUSTOM');
      onChangeIntervalo({
        dataInicio: `${anoAtual}-07-01`,
        dataFim: `${anoAtual}-07-31`,
        nomePreset: 'Mês 07 (Julho/2026)',
        compararComAnterior: false
      });
    }
  };

  // Contagem de dias contidos no intervalo customizado
  const calcularDiasNoIntervalo = (inicioStr?: string, fimStr?: string) => {
    if (!inicioStr || !fimStr) return 0;
    const [yI, mI, dI] = inicioStr.split('-').map(Number);
    const [yF, mF, dF] = fimStr.split('-').map(Number);
    const dIni = new Date(yI, mI - 1, dI);
    const dFim = new Date(yF, mF - 1, dF);

    return datasDisponiveis.filter((dStr) => {
      const [dia, mes, ano] = dStr.split('/').map(Number);
      const dt = new Date(ano || 2026, (mes || 1) - 1, dia || 1);
      return dt >= dIni && dt <= dFim;
    }).length;
  };

  const diasIntervaloA = calcularDiasNoIntervalo(intervaloCustom.dataInicio, intervaloCustom.dataFim);
  const diasIntervaloB = calcularDiasNoIntervalo(intervaloCustom.dataInicioComp, intervaloCustom.dataFimComp);

  return (
    <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-4 space-y-3.5 shadow-lg">
      {/* Linha 1: Título Executivo, Modos de Agregação e Filtros de Equipe */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f293d]/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Filtro Temporal & Agregação de Produção
              {intervaloCustom.nomePreset && (tipoAgregacao === 'CUSTOM' || tipoAgregacao === 'COMPARATIVO') && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {intervaloCustom.nomePreset}
                </span>
              )}
            </h4>
            <span className="text-xs text-slate-400">
              Personalize o período de apuração das metas ou execute comparações diretas entre meses e ciclos.
            </span>
          </div>
        </div>

        {/* Controles de Equipe */}
        <div className="flex items-center flex-wrap gap-2">
          {onToggleEquipeOficial && (
            <button
              onClick={onToggleEquipeOficial}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border flex items-center gap-1.5 shadow-sm ${
                somenteEquipeOficial
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#0f1523] border-[#1f293d] text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              title="Ocultar operadores externos ou terceiros que vieram no arquivo e não pertencem à sua equipe fixa"
            >
              <Users className="w-3.5 h-3.5" />
              {somenteEquipeOficial ? '✓ Somente Minha Equipe' : 'Exibir Toda a Planilha'}
            </button>
          )}

          {operadoresExcluidosCount > 0 && onRestaurarOperadores && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs text-amber-300">
              <span>🚫 {operadoresExcluidosCount} ignorado(s)</span>
              <button
                onClick={onRestaurarOperadores}
                className="text-[10px] bg-amber-500/30 hover:bg-amber-500/50 text-white font-bold px-1.5 py-0.5 rounded transition"
              >
                Restaurar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Linha 2: Seletor de Modo Principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="bg-[#07090e] border border-[#1f293d] p-1 rounded-xl flex items-center flex-wrap gap-1 shadow-inner">
          <button
            onClick={() => onChangeTipo('DIA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tipoAgregacao === 'DIA'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Por Dia (Diário)
          </button>

          <button
            onClick={() => onChangeTipo('SEMANA')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tipoAgregacao === 'SEMANA'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Por Semana (Semanal)
          </button>

          <button
            onClick={() => onChangeTipo('MES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tipoAgregacao === 'MES'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Por Mês (Mensal)
          </button>

          <button
            onClick={() => onChangeTipo('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tipoAgregacao === 'CUSTOM'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-200" />
            📅 Intervalo Custom
          </button>

          <button
            onClick={() => onChangeTipo('COMPARATIVO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              tipoAgregacao === 'COMPARATIVO'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-purple-200" />
            ⚖️ Comparativo Meses
          </button>
        </div>

        {/* Atalhos Rápidos da Gestão */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Atalhos:
          </span>
          <button
            onClick={() => aplicarPreset('CICLO_1_A_30')}
            className="px-2.5 py-1 bg-[#131b2e] hover:bg-[#1c2742] text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            <span>📅 Ciclo 1 ao 30</span>
          </button>
          <button
            onClick={() => aplicarPreset('COMPARATIVO_JUL_AGO')}
            className="px-2.5 py-1 bg-[#1a142e] hover:bg-[#251c42] text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            <span>⚖️ Comparar 01/07 vs 01/08</span>
          </button>
          <button
            onClick={() => aplicarPreset('MES_10')}
            className="px-2 py-1 bg-[#0f1523] hover:bg-[#1a233a] text-slate-300 border border-[#1f293d] rounded-lg text-xs transition"
          >
            Mês 10 (Out)
          </button>
          <button
            onClick={() => aplicarPreset('MES_09')}
            className="px-2 py-1 bg-[#0f1523] hover:bg-[#1a233a] text-slate-300 border border-[#1f293d] rounded-lg text-xs transition"
          >
            Mês 09 (Set)
          </button>
          <button
            onClick={() => aplicarPreset('MES_08')}
            className="px-2 py-1 bg-[#0f1523] hover:bg-[#1a233a] text-slate-300 border border-[#1f293d] rounded-lg text-xs transition"
          >
            Mês 08 (Ago)
          </button>
          <button
            onClick={() => aplicarPreset('MES_07')}
            className="px-2 py-1 bg-[#0f1523] hover:bg-[#1a233a] text-slate-300 border border-[#1f293d] rounded-lg text-xs transition"
          >
            Mês 07 (Jul)
          </button>
        </div>
      </div>

      {/* Linha 3: Sub-controles dependendo do modo ativo */}
      {/* MODO 1: DIÁRIO */}
      {tipoAgregacao === 'DIA' && onChangeDataFiltro && (
        <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-bold">Dia Específico:</span>
            {dataFiltro !== 'TODOS' ? (
              <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded text-xs font-mono">
                {dataFiltro}
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs">
                Todos os Dias da Planilha ({datasDisponiveis.length})
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => onChangeDataFiltro('TODOS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                dataFiltro === 'TODOS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todo o Período
            </button>

            {datasDisponiveis.slice(0, 8).map((dia) => (
              <button
                key={dia}
                onClick={() => onChangeDataFiltro(dia)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition ${
                  dataFiltro === dia
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {dia.slice(0, 5)}
              </button>
            ))}

            {datasDisponiveis.length > 8 && (
              <select
                value={dataFiltro}
                onChange={(e) => onChangeDataFiltro(e.target.value)}
                className="bg-slate-800 border border-[#1f293d] text-white text-xs px-2.5 py-1 rounded-lg outline-none font-mono"
              >
                <option value="TODOS">Outras datas...</option>
                {datasDisponiveis.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* MODO 2: SEMANAL */}
      {tipoAgregacao === 'SEMANA' && onChangeSemanaFiltro && (
        <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-blue-300 font-bold">Semana Selecionada:</span>
            {semanaFiltro !== 'TODOS' ? (
              <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-xs">
                {semanasDisponiveis.find((s) => s.id === semanaFiltro)?.rotulo || semanaFiltro}
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs">
                Todas as Semanas ({semanasDisponiveis.length})
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => onChangeSemanaFiltro('TODOS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                semanaFiltro === 'TODOS'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Todas as Semanas
            </button>

            {semanasDisponiveis.slice(0, 5).map((sem) => (
              <button
                key={sem.id}
                onClick={() => onChangeSemanaFiltro(sem.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                  semanaFiltro === sem.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sem.rotulo}
              </button>
            ))}

            {semanasDisponiveis.length > 5 && (
              <select
                value={semanaFiltro}
                onChange={(e) => onChangeSemanaFiltro(e.target.value)}
                className="bg-slate-800 border border-[#1f293d] text-white text-xs px-2.5 py-1 rounded-lg outline-none"
              >
                <option value="TODOS">Outras semanas...</option>
                {semanasDisponiveis.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.rotulo}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* MODO 3: MENSAL */}
      {tipoAgregacao === 'MES' && onChangeMesFiltro && (
        <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-purple-300 font-bold">Mês Selecionado:</span>
            {mesFiltro !== 'TODOS' ? (
              <span className="bg-purple-600 text-white font-black px-2 py-0.5 rounded text-xs">
                {mesesDisponiveis.find((m) => m.id === mesFiltro)?.rotulo || mesFiltro}
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs">
                Todos os Meses ({mesesDisponiveis.length})
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => onChangeMesFiltro('TODOS')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                mesFiltro === 'TODOS'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Consolidado Mensal
            </button>

            {mesesDisponiveis.map((m) => (
              <button
                key={m.id}
                onClick={() => onChangeMesFiltro(m.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                  mesFiltro === m.id
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m.rotulo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODO 4 & 5: INTERVALO CUSTOM OU COMPARATIVO */}
      {(tipoAgregacao === 'CUSTOM' || tipoAgregacao === 'COMPARATIVO') && (
        <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Período A (Principal) */}
          <div className="space-y-2 bg-[#0b0f19] p-3 rounded-lg border border-[#1f293d]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {tipoAgregacao === 'COMPARATIVO' ? 'Período Atual / Análise (Período A)' : 'Intervalo Personalizado'}
              </span>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                {diasIntervaloA} dia(s) na planilha
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Data Início:</label>
                <input
                  type="date"
                  value={intervaloCustom.dataInicio}
                  onChange={(e) =>
                    onChangeIntervalo({
                      ...intervaloCustom,
                      dataInicio: e.target.value,
                      nomePreset: 'Período Personalizado'
                    })
                  }
                  className="w-full bg-[#121829] border border-[#1f293d] text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-cyan-500 font-mono shadow-inner"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Data Fim:</label>
                <input
                  type="date"
                  value={intervaloCustom.dataFim}
                  onChange={(e) =>
                    onChangeIntervalo({
                      ...intervaloCustom,
                      dataFim: e.target.value,
                      nomePreset: 'Período Personalizado'
                    })
                  }
                  className="w-full bg-[#121829] border border-[#1f293d] text-white text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-cyan-500 font-mono shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Período B (Comparativo) ou Controles de Reset */}
          {tipoAgregacao === 'COMPARATIVO' ? (
            <div className="space-y-2 bg-[#0b0f19] p-3 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Período de Comparação (Período B - Base)
                </span>
                <span className="text-[11px] font-mono text-purple-300 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                  {diasIntervaloB} dia(s) na planilha
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Data Início:</label>
                  <input
                    type="date"
                    value={intervaloCustom.dataInicioComp || '2026-07-01'}
                    onChange={(e) =>
                      onChangeIntervalo({
                        ...intervaloCustom,
                        dataInicioComp: e.target.value,
                        compararComAnterior: true
                      })
                    }
                    className="w-full bg-[#121829] border border-purple-500/40 text-purple-200 text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-purple-400 font-mono shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Data Fim:</label>
                  <input
                    type="date"
                    value={intervaloCustom.dataFimComp || '2026-07-31'}
                    onChange={(e) =>
                      onChangeIntervalo({
                        ...intervaloCustom,
                        dataFimComp: e.target.value,
                        compararComAnterior: true
                      })
                    }
                    className="w-full bg-[#121829] border border-purple-500/40 text-purple-200 text-xs px-2.5 py-1.5 rounded-lg outline-none focus:border-purple-400 font-mono shadow-inner"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-start md:items-end gap-2 p-2">
              <span className="text-xs text-slate-400">
                Você pode selecionar qualquer intervalo (ex: do dia 1º ao dia 30, ou períodos específicos de 15 dias).
              </span>
              <button
                onClick={() => {
                  onChangeTipo('DIA');
                  onChangeIntervalo({
                    dataInicio: '2026-09-01',
                    dataFim: '2026-09-30',
                    compararComAnterior: false
                  });
                }}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 bg-[#0f1523] hover:bg-[#1a2333] border border-[#1f293d] rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Visão Geral Diária</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

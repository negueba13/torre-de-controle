import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { EvolucaoDiariaProducao } from '../types';
import { formatMoney } from '../utils/pdeCleaner';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  dados: EvolucaoDiariaProducao[];
}

export const GraficoEvolucaoDiaria: React.FC<Props> = ({ dados }) => {
  const [metricaVisualizacao, setMetricaVisualizacao] = useState<'AMBOS' | 'FATURAMENTO' | 'ATENDIMENTOS'>('AMBOS');

  if (!dados || dados.length === 0) {
    return (
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <BarChart3 className="w-12 h-12 text-slate-600 mb-3" />
        <h4 className="text-sm font-bold text-slate-300">Aguardando dados de execuções</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Faça a carga do arquivo de execuções no Motor 1 para visualizar o gráfico de evolução diária de faturamento e atendimentos.
        </p>
      </div>
    );
  }

  // Format custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload as EvolucaoDiariaProducao;
      return (
        <div className="bg-[#07090e] border border-[#1f293d] rounded-lg p-3 shadow-2xl text-xs space-y-1.5 min-w-[190px]">
          <div className="font-bold text-white border-b border-[#1f293d] pb-1 flex items-center justify-between">
            <span>📅 {dataItem.dataLabel || label}</span>
            <span className="text-[10px] text-slate-400 font-mono">{dataItem.totalVisitas} visitas</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Faturamento:
            </span>
            <span className="font-mono font-bold text-white">R$ {formatMoney(dataItem.faturado)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-cyan-400 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Concluídos:
            </span>
            <span className="font-mono font-bold text-white">{dataItem.atendimentosConcluidos} OS</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-rose-400 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Infrutíferas:
            </span>
            <span className="font-mono font-bold text-white">{dataItem.infrutiferas} OS</span>
          </div>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-[#1f293d]">
            Taxa de Sucesso:{' '}
            <strong className="text-amber-400">
              {dataItem.totalVisitas > 0
                ? ((dataItem.atendimentosConcluidos / dataItem.totalVisitas) * 100).toFixed(1)
                : 0}
              %
            </strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalFaturadoGeral = dados.reduce((acc, curr) => acc + curr.faturado, 0);
  const totalConcluidosGeral = dados.reduce((acc, curr) => acc + curr.atendimentosConcluidos, 0);

  return (
    <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1f293d] pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Evolução Diária de Faturamento & Atendimentos Concluídos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dados compilados linha a linha pelo Motor 1 a partir das execuções concluídas
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#07090e] border border-[#1f293d] p-1 rounded-lg text-xs">
          <button
            onClick={() => setMetricaVisualizacao('AMBOS')}
            className={`px-2.5 py-1 rounded font-bold transition text-[11px] ${
              metricaVisualizacao === 'AMBOS'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Faturamento & OS
          </button>
          <button
            onClick={() => setMetricaVisualizacao('FATURAMENTO')}
            className={`px-2.5 py-1 rounded font-bold transition text-[11px] ${
              metricaVisualizacao === 'FATURAMENTO'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apenas Faturamento (R$)
          </button>
          <button
            onClick={() => setMetricaVisualizacao('ATENDIMENTOS')}
            className={`px-2.5 py-1 rounded font-bold transition text-[11px] ${
              metricaVisualizacao === 'ATENDIMENTOS'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Apenas Atendimentos
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
        <div className="bg-[#07090e] border border-[#1f293d] px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="text-slate-400">Total Faturado no Período:</span>
          <span className="font-bold text-emerald-400">R$ {formatMoney(totalFaturadoGeral)}</span>
        </div>
        <div className="bg-[#07090e] border border-[#1f293d] px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="text-slate-400">Atendimentos Concluídos com Sucesso:</span>
          <span className="font-bold text-cyan-400">{totalConcluidosGeral.toLocaleString('pt-BR')} OS</span>
        </div>
        <div className="bg-[#07090e] border border-[#1f293d] px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="text-slate-400">Dias Apurados:</span>
          <span className="font-bold text-slate-200">{dados.length} dias</span>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="h-[300px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
            <XAxis
              dataKey="dataLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1f293d' }}
            />
            
            {/* Left Y Axis for Faturamento */}
            {(metricaVisualizacao === 'AMBOS' || metricaVisualizacao === 'FATURAMENTO') && (
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#10b981"
                fontSize={10}
                tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                tickLine={false}
                axisLine={{ stroke: '#1f293d' }}
              />
            )}

            {/* Right Y Axis for Qtd Atendimentos */}
            {(metricaVisualizacao === 'AMBOS' || metricaVisualizacao === 'ATENDIMENTOS') && (
              <YAxis
                yAxisId="right"
                orientation={metricaVisualizacao === 'ATENDIMENTOS' ? 'left' : 'right'}
                stroke="#38bdf8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#1f293d' }}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: '11px' }}
              formatter={(value) => <span className="text-slate-300 font-semibold">{value}</span>}
            />

            {(metricaVisualizacao === 'AMBOS' || metricaVisualizacao === 'FATURAMENTO') && (
              <Bar
                yAxisId="left"
                dataKey="faturado"
                name="Faturamento Realizado (R$)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
            )}

            {(metricaVisualizacao === 'AMBOS' || metricaVisualizacao === 'ATENDIMENTOS') && (
              <Bar
                yAxisId="right"
                dataKey="atendimentosConcluidos"
                name="Atendimentos Concluídos (OS)"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

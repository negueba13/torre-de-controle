import React, { useState, useMemo } from 'react';
import { ReposicaoPisoItem } from '../types';
import {
  Layers,
  Search,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Copy,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatMoney } from '../utils/pdeCleaner';

interface TabelaReposicaoPisoProps {
  reposicoes: ReposicaoPisoItem[];
  frenteFiltro: string;
}

export const TabelaReposicaoPiso: React.FC<TabelaReposicaoPisoProps> = ({
  reposicoes,
  frenteFiltro
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [apenasReincidentes, setApenasReincidentes] = useState(false);

  const filtrados = useMemo(() => {
    return reposicoes.filter((item) => {
      if (frenteFiltro !== 'GLOBAL' && !item.frente.toLowerCase().includes(frenteFiltro.toLowerCase())) {
        return false;
      }
      if (apenasReincidentes && !item.reincidente) {
        return false;
      }
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      return (
        item.os.toLowerCase().includes(term) ||
        item.pde.toLowerCase().includes(term) ||
        item.operador.toLowerCase().includes(term) ||
        item.bairro.toLowerCase().includes(term) ||
        item.municipio.toLowerCase().includes(term)
      );
    });
  }, [reposicoes, frenteFiltro, apenasReincidentes, searchTerm]);

  const faturamentoTotal = useMemo(() => {
    return filtrados.reduce((acc, curr) => acc + (curr.valor || 32.02), 0);
  }, [filtrados]);

  const reincidentesCount = useMemo(() => {
    return filtrados.filter((r) => r.reincidente).length;
  }, [filtrados]);

  const exportarExcel = () => {
    if (filtrados.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const rows = filtrados.map((item) => ({
      'Número OS': item.os,
      'PDE': item.pde,
      'Operador': item.operador,
      'Data Execução': item.data,
      'Frente': item.frente,
      'Município': item.municipio,
      'Bairro': item.bairro,
      'Valor Faturado (R$)': item.valor,
      'Reincidência / Retrabalho': item.reincidente ? 'SIM (Reincidente)' : 'NÃO'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reposicoes_Piso');
    XLSX.writeFile(wb, `Reposicoes_Piso_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const copiarDadosOS = (item: ReposicaoPisoItem) => {
    const txt = `🧱 *AUDITORIA DE REPOSIÇÃO DE PISO*\n• *OS:* ${item.os}\n• *PDE:* ${item.pde}\n• *Executor:* ${item.operador}\n• *Data:* ${item.data}\n• *Local:* ${item.bairro} - ${item.municipio}\n• *Valor:* R$ ${formatMoney(item.valor)}`;
    navigator.clipboard.writeText(txt).then(() => {
      alert(`Dados da OS ${item.os} copiados para o WhatsApp!`);
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Cards */}
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
            <span className="text-xl">🧱</span>
            Reposições de Piso & Asfalto (Auditoria & Rastreabilidade de OS)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Rastreie qual colaborador executou a reposição para responder a reclamações da Sabesp e prevenir retrabalhos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportarExcel}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-[#1f293d] font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Exportar (.xlsx)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-[#0b0f19] border border-amber-500/30 rounded-xl p-4">
          <span className="text-amber-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
            Total de Pisos Executados
          </span>
          <div className="text-2xl font-black text-white font-mono">{filtrados.length}</div>
          <span className="text-[11px] text-slate-400">Serviços concluídos com sucesso</span>
        </div>

        <div className="bg-[#0b0f19] border border-emerald-500/30 rounded-xl p-4">
          <span className="text-emerald-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
            Lucro / Faturamento Total
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            R$ {formatMoney(faturamentoTotal)}
          </div>
          <span className="text-[11px] text-slate-400">Contabilizado no faturamento da empresa</span>
        </div>

        <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-4">
          <span className="text-red-400 font-bold block mb-1 uppercase tracking-wider text-[10px]">
            Reincidências / Possível Retrabalho
          </span>
          <div className="text-2xl font-black text-red-400 font-mono">{reincidentesCount}</div>
          <span className="text-[11px] text-slate-400">PDEs com mais de uma reposição no histórico</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por OS, PDE, operador, bairro ou município..."
              className="w-full bg-slate-900 border border-[#1f293d] text-white pl-9 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setApenasReincidentes(!apenasReincidentes)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition border flex items-center gap-1.5 ${
              apenasReincidentes
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-slate-800 border-[#1f293d] text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {apenasReincidentes ? '✓ Apenas Reincidentes' : 'Todos os Pisos'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="sticky top-0 bg-[#161f33] text-white border-b border-[#1f293d] z-10">
              <tr>
                <th className="py-2.5 px-3 font-bold">Número OS</th>
                <th className="py-2.5 px-3 font-bold">PDE</th>
                <th className="py-2.5 px-3 font-bold">Colaborador Executor</th>
                <th className="py-2.5 px-3 font-bold">Data</th>
                <th className="py-2.5 px-3 font-bold">Local (Bairro / Município)</th>
                <th className="py-2.5 px-3 font-bold">Frente</th>
                <th className="py-2.5 px-3 font-bold text-right">Valor Faturado</th>
                <th className="py-2.5 px-3 font-bold text-center">Status / Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {filtrados.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                    {item.os}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-200 whitespace-nowrap">
                    {item.pde}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                    👤 {item.operador}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {item.data}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="text-slate-300 font-semibold">{item.bairro}</span>
                    <span className="text-slate-500 text-[10px] ml-1">({item.municipio})</span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                    {item.frente}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                    R$ {formatMoney(item.valor)}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      {item.reincidente && (
                        <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] font-black px-1.5 py-0.5 rounded">
                          ⚠️ Reincidente
                        </span>
                      )}
                      <button
                        onClick={() => copiarDadosOS(item)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded transition"
                        title="Copiar dados desta reposição de piso para WhatsApp"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Nenhuma reposição de piso encontrada na planilha atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Search, Download, FileText, CheckCircle2, AlertCircle, Building2, Copy } from 'lucide-react';
import { formatMoney } from '../utils/pdeCleaner';
import { PaginationControls, usePagination } from './Pagination';

export interface FaturaPagaAuditoriaItem {
  id: string;
  os: string;
  pde: string;
  data: string;
  operador: string;
  frente: string;
  municipio: string;
  bairro: string;
  endereco?: string;
  diagnosticoOrigem: 'POS_PIX_EQUIPE' | 'COMPROVANTE_EXTERNO';
  valorFatura?: number;
  resultadoOriginal: string;
}

interface AbaFaturasPagasAuditoriaProps {
  itens: FaturaPagaAuditoriaItem[];
  onFechar?: () => void;
}

export const AbaFaturasPagasAuditoria: React.FC<AbaFaturasPagasAuditoriaProps> = ({ itens }) => {
  const [busca, setBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState<'TODOS' | 'POS_PIX_EQUIPE' | 'COMPROVANTE_EXTERNO'>('TODOS');
  const [copiado, setCopiado] = useState(false);

  const itensFiltrados = useMemo(() => {
    return itens.filter((it) => {
      if (filtroOrigem !== 'TODOS' && it.diagnosticoOrigem !== filtroOrigem) {
        return false;
      }
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        return (
          it.os.toLowerCase().includes(termo) ||
          it.pde.toLowerCase().includes(termo) ||
          it.operador.toLowerCase().includes(termo) ||
          it.bairro.toLowerCase().includes(termo) ||
          it.frente.toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [itens, busca, filtroOrigem]);
  const {
    currentPage,
    totalPages,
    pageItems,
    setCurrentPage
  } = usePagination(itensFiltrados, 50, `${filtroOrigem}|${busca}`);

  const totalPotencial = itensFiltrados.length * 44.28;

  const exportarCSV = () => {
    const cabecalho = 'NUMERO OS;PDE;DATA;OPERADOR;FRENTE;MUNICIPIO;BAIRRO;ORIGEM PAGAMENTO;VALOR EDITAL (R$);STATUS HOMOLOGACAO\n';
    const linhas = itensFiltrados.map((it) => {
      const origemTxt = it.diagnosticoOrigem === 'POS_PIX_EQUIPE' ? 'Recebido pela Equipe (POS/PIX)' : 'Comprovante Externo (Banco/Loterica)';
      return `"${it.os}";"${it.pde}";"${it.data}";"${it.operador}";"${it.frente}";"${it.municipio}";"${it.bairro}";"${origemTxt}";"44,28";"Pendente Validacao Diretoria/Sabesp"`;
    }).join('\n');

    const blob = new Blob(['\ufeff' + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faturas_Pagas_Auditoria_Diretoria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copiarRelatorioChefia = () => {
    let msg = `📋 *RELATÓRIO DE AUDITORIA: FATURAS PAGAS APRESENTADAS*\n`;
    msg += `Total de Ordens Auditadas: ${itensFiltrados.length} OSs\n`;
    msg += `Valor Potencial para Medição Contratual: R$ ${formatMoney(totalPotencial)} (R$ 44,28/OS)\n\n`;
    msg += `*Amostragem para Homologação Diretoria / Sabesp:*\n`;

    itensFiltrados.slice(0, 10).forEach((it, idx) => {
      msg += `${idx + 1}. OS ${it.os} | PDE ${it.pde} | Op: ${it.operador} | ${it.bairro} (${it.data})\n`;
    });

    if (itensFiltrados.length > 10) {
      msg += `... e mais ${itensFiltrados.length - 10} ordens catalogadas no arquivo em anexo.\n`;
    }

    navigator.clipboard.writeText(msg).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    });
  };

  return (
    <div className="space-y-4">
      {/* Banner de Boas-Vindas e Explicação */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#0f1523] to-[#0f1523] border border-amber-500/30 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                AUDITORIA DE MEDIÇÃO
              </span>
              <span className="text-xs text-slate-400">
                Item 3.5 do Edital • Validação Prévia Diretoria / Sabesp
              </span>
            </div>
            <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Painel de Auditoria: Faturas Pagas Apresentadas
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Ordens onde o cliente informou quitação prévia. Segregamos estas visitas para conferência se o pagamento foi processado pela nossa máquina POS/PIX ou se foi pago externamente (banco/lotérica), subsidiando a aprovação junto à Diretoria e fiscalização da Sabesp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copiarRelatorioChefia}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Copy className="w-4 h-4" />
              <span>{copiado ? 'Copiado para WhatsApp!' : 'Copiar Resumo p/ Chefia'}</span>
            </button>

            <button
              onClick={exportarCSV}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Auditoria (.csv)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas de Auditoria */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">OSs com Faturas Pagas</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {itens.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Aguardando homologação formal
          </span>
        </div>

        <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Preço Unitário Edital</span>
            <span className="text-xs text-cyan-400 font-mono font-bold">Item 3.5</span>
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono mt-1">
            R$ 44,28
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Valor por visita comprovada
          </span>
        </div>

        <div className="bg-[#0b0f19] border border-amber-500/30 rounded-xl p-4 bg-amber-950/10">
          <div className="flex items-center justify-between text-xs text-amber-300">
            <span className="font-bold">Potencial a Recuperar</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">
            R$ {formatMoney(totalPotencial)}
          </div>
          <span className="text-[11px] text-amber-400/80 mt-1 block">
            Faturamento condicionado à validação
          </span>
        </div>

        <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold">Status Contratual</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-2 flex items-center gap-1.5">
            Segregado em Auditoria
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Zero risco de glosa prévia
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="🔍 Buscar por OS, PDE, Operador, Bairro ou Frente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#07090e] border border-[#1f293d] text-white text-xs px-3 py-1.5 rounded-lg outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <span className="text-slate-400 font-medium">Origem do Pagamento:</span>
          <button
            onClick={() => setFiltroOrigem('TODOS')}
            className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
              filtroOrigem === 'TODOS'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Todas ({itens.length})
          </button>
          <button
            onClick={() => setFiltroOrigem('POS_PIX_EQUIPE')}
            className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
              filtroOrigem === 'POS_PIX_EQUIPE'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            💳 Recebido Equipe ({itens.filter((i) => i.diagnosticoOrigem === 'POS_PIX_EQUIPE').length})
          </button>
          <button
            onClick={() => setFiltroOrigem('COMPROVANTE_EXTERNO')}
            className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
              filtroOrigem === 'COMPROVANTE_EXTERNO'
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📄 Comprovante Externo ({itens.filter((i) => i.diagnosticoOrigem === 'COMPROVANTE_EXTERNO').length})
          </button>
        </div>
      </div>

      {/* Tabela de OSs com Faturas Pagas */}
      <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0f1523] text-slate-400 border-b border-[#1f293d] z-10">
              <tr>
                <th className="py-2.5 px-3 font-bold">OS</th>
                <th className="py-2.5 px-3 font-bold">PDE</th>
                <th className="py-2.5 px-3 font-bold">Data</th>
                <th className="py-2.5 px-3 font-bold">Operador</th>
                <th className="py-2.5 px-3 font-bold">Local / Bairro</th>
                <th className="py-2.5 px-3 font-bold">Frente</th>
                <th className="py-2.5 px-3 font-bold text-center">Origem Diagnóstico</th>
                <th className="py-2.5 px-3 font-bold text-right">Valor Edital</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {itensFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    Nenhuma ordem de fatura paga localizada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                pageItems.map((it) => (
                  <tr key={it.id} className="hover:bg-[#131b2e] transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                      {it.os}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {it.pde}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {it.data}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                      {it.operador}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {it.bairro} ({it.municipio})
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {it.frente}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {it.diagnosticoOrigem === 'POS_PIX_EQUIPE' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                          Pago no POS/PIX
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                          Comprovante Apresentado
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300 whitespace-nowrap">
                      R$ 44,28
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded inline-flex items-center gap-1">
                        Pendente Diretoria
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={itensFiltrados.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

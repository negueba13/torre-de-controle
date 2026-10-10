import React, { useState, useMemo } from 'react';
import { X, Search, CheckCircle, AlertTriangle, ShieldCheck, Download, CreditCard, DollarSign } from 'lucide-react';
import { TABELA_DEPARA_EDITAL, DeParaItemOficial } from '../utils/dePara';
import { formatMoney } from '../utils/pdeCleaner';

interface ModalTabelaDeParaProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalTabelaDePara: React.FC<ModalTabelaDeParaProps> = ({ isOpen, onClose }) => {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'POS_PIX' | 'CORTES' | 'SUPRESSOES' | 'RELIGACOES' | 'PISOS' | 'HIDROMETRIA' | 'RAMAL'>('TODOS');

  const itensFiltrados = useMemo(() => {
    return TABELA_DEPARA_EDITAL.filter((item) => {
      // Filtro por categoria
      if (filtroTipo === 'POS_PIX') {
        const isPosPix = item.resultado.includes('pos') || item.resultado.includes('pix');
        if (!isPosPix) return false;
      } else if (filtroTipo === 'CORTES') {
        const isCorte = item.resultado.includes('corte') || item.resultado.includes('cortada');
        if (!isCorte) return false;
      } else if (filtroTipo === 'SUPRESSOES') {
        const isSupr = item.resultado.includes('supr');
        if (!isSupr) return false;
      } else if (filtroTipo === 'RELIGACOES') {
        const isRelig = item.resultado.includes('relig') || item.resultado.includes('restab');
        if (!isRelig) return false;
      } else if (filtroTipo === 'PISOS') {
        const isPiso = item.resultado.includes('reposição') || item.resultado.includes('piso') || item.resultado.includes('concreto') || item.resultado.includes('asfalto');
        if (!isPiso) return false;
      } else if (filtroTipo === 'HIDROMETRIA') {
        const isHidro = item.resultado.includes('hidro') || item.resultado.includes('aferid');
        if (!isHidro) return false;
      } else if (filtroTipo === 'RAMAL') {
        if (item.tipo !== 'ramal') return false;
      }

      // Filtro de busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const res = item.resultado.toLowerCase();
        const unif = item.unificado.toLowerCase();
        const edital = item.itemEdital.toLowerCase();
        return res.includes(termo) || unif.includes(termo) || edital.includes(termo);
      }

      return true;
    });
  }, [busca, filtroTipo]);

  const exportarCSV = () => {
    const cabecalho = 'RESULTADO WFM/GEOCALL;TIPO;UNIFICADO (GEO CALL + MANUAL);ITEM DO EDITAL;PREÇO (R$);STATUS MEDIÇÃO\n';
    const linhas = itensFiltrados.map((item) => {
      const precoFmt = item.preco.toFixed(2).replace('.', ',');
      const status = item.requerValidacaoDiretoria ? 'Requer Validação Diretoria/Sabesp' : 'Ativo na Medição';
      return `"${item.resultado}";"${item.tipo || 'Cavalete/Normal'}";"${item.unificado}";"${item.itemEdital}";"${precoFmt}";"${status}"`;
    }).join('\n');

    const blob = new Blob(['\ufeff' + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Tabela_DE_PARA_Edital_3_5_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b0f19] border border-[#1f293d] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1f293d] flex items-center justify-between bg-[#0f1523]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  3.5 Tabela de DE → PARA Contratual
                </h2>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Edital Sabesp / Enorsul
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Base oficial de parametrização de medição, resultados WFM/Geocall, itens do edital e preços unitários.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a2333] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regras Importantes Destacadas */}
        <div className="p-4 bg-[#07090e] border-b border-[#1f293d] grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-start gap-2.5">
            <CreditCard className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-purple-300 block">Regra Oficial POS & PIX (R$ 44,28)</span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Para o serviço ser considerado executado com sucesso e remunerar o colaborador, o resultado deve ser <strong>"Pagamento Efetivado via POS"</strong> ou <strong>"Pagamento Efetivado via PIX"</strong>. Negociações infrutíferas contam como visita infrutífera.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-300 block">Faturas Pagas Apresentadas (Auditoria Prévia)</span>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Exige validação formal da Sabesp e da Diretoria para compor a medição. Mantido em auditoria segregada (R$ 0,00 na medição direta) até homologação pela gerência.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="p-4 border-b border-[#1f293d] bg-[#0b0f19] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por resultado, item do edital ou código unificado..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0f1523] border border-[#1f293d] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <button
              onClick={exportarCSV}
              className="bg-[#1f293d] hover:bg-[#2a3852] text-slate-200 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar Tabela ({itensFiltrados.length})</span>
            </button>
          </div>

          {/* Categoria Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'TODOS', label: `Todos (${TABELA_DEPARA_EDITAL.length})` },
              { id: 'POS_PIX', label: '💳 POS & PIX' },
              { id: 'CORTES', label: '✂️ Cortes' },
              { id: 'SUPRESSOES', label: '🔒 Supressões' },
              { id: 'RELIGACOES', label: '💧 Religações / Restab.' },
              { id: 'PISOS', label: '🧱 Reposição de Piso' },
              { id: 'HIDROMETRIA', label: '⏱️ Hidrometria & Aferição' },
              { id: 'RAMAL', label: '⛓️ Serviços em Ramal' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFiltroTipo(tab.id as typeof filtroTipo)}
                className={`px-2.5 py-1 rounded-lg font-medium transition text-[11px] ${
                  filtroTipo === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-[#0f1523] text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[500px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0f1523] text-slate-400 border-b border-[#1f293d] z-10">
              <tr>
                <th className="py-2.5 px-3 font-bold">Resultado WFM / Geocall</th>
                <th className="py-2.5 px-3 font-bold text-center">Tipo</th>
                <th className="py-2.5 px-3 font-bold">Item do Edital</th>
                <th className="py-2.5 px-3 font-bold">Unificado (Geo Call + Manual)</th>
                <th className="py-2.5 px-3 font-bold text-right">Preço Unitário</th>
                <th className="py-2.5 px-3 font-bold text-center">Status Medição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50">
              {itensFiltrados.map((item, idx) => {
                const ehPosPix = item.resultado.includes('pos') || item.resultado.includes('pix');
                const ehFaturaPaga = item.requerValidacaoDiretoria;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-[#131b2e] transition ${
                      ehPosPix ? 'bg-purple-950/15' : ehFaturaPaga ? 'bg-amber-950/15' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-white capitalize">
                      {item.resultado}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.tipo === 'ramal' ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded">
                          Ramal
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Cavalete
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 capitalize">
                      {item.itemEdital}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {item.unificado}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {ehFaturaPaga ? (
                        <span className="text-amber-400" title="R$ 44,28 após auditoria da Sabesp/Diretoria">
                          R$ 0,00*
                        </span>
                      ) : (
                        <span className={item.preco >= 100 ? 'text-emerald-400' : 'text-cyan-300'}>
                          R$ {formatMoney(item.preco)}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {ehFaturaPaga ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Requer Validação
                        </span>
                      ) : ehPosPix ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Efetivado
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Medição Contratual
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0f1523] border-t border-[#1f293d] flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div>
            Total de serviços cadastrados: <strong className="text-white">{TABELA_DEPARA_EDITAL.length} itens</strong> (Exibindo {itensFiltrados.length})
          </div>
          <div>
            * Faturas pagas apresentadas são mantidas em auditoria sem computar diretamente no faturamento até autorização da Diretoria.
          </div>
        </div>
      </div>
    </div>
  );
};

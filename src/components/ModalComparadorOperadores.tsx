import React, { useState } from 'react';
import { OperadorProducao } from '../types';
import {
  X,
  Users,
  Copy,
  Scissors,
  CreditCard,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Award
} from 'lucide-react';
import { formatMoney } from '../utils/pdeCleaner';

interface ModalComparadorOperadoresProps {
  isOpen: boolean;
  onClose: () => void;
  operadores: OperadorProducao[];
  operadorInicial?: string;
}

export const ModalComparadorOperadores: React.FC<ModalComparadorOperadoresProps> = ({
  isOpen,
  onClose,
  operadores,
  operadorInicial
}) => {
  const [op1Nome, setOp1Nome] = useState<string>(operadorInicial || operadores[0]?.nomeNormalizado || '');
  const [op2Nome, setOp2Nome] = useState<string>(operadores[1]?.nomeNormalizado || '');
  const [op3Nome, setOp3Nome] = useState<string>('');

  React.useEffect(() => {
    if (operadorInicial) {
      setOp1Nome(operadorInicial);
    }
  }, [operadorInicial]);

  if (!isOpen) return null;

  const getOp = (norm: string) => operadores.find((o) => o.nomeNormalizado === norm);

  const selecionados = [getOp(op1Nome), getOp(op2Nome), getOp(op3Nome)].filter(
    (o): o is OperadorProducao => Boolean(o)
  );

  const copiarRelatorioComparativo = () => {
    if (selecionados.length < 2) {
      alert('Selecione pelo menos 2 operadores para comparar.');
      return;
    }

    let texto = `📊 *COMPARATIVO DE DESEMPENHO OPERACIONAL (SABESP / ENORSUL)*\n📅 *Gerado em:* ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    selecionados.forEach((op, idx) => {
      texto += `👤 *#${idx + 1} - ${op.nome}* (${op.veiculo} • ${op.frente})\n`;
      texto += `• Total OS: ${op.totalOS} | Taxa de Sucesso Real: ${op.percSucesso.toFixed(1)}%\n`;
      texto += `• ✂️ Cortes: ${op.cortes || 0} | 🔒 Supressões: ${op.supressoes || 0}\n`;
      texto += `• 💳 Negociações POS: ${op.negociacoesPOS || 0} | 🧱 Pisos: ${op.reposicoesPiso || 0}\n`;
      texto += `• ❌ Infrutíferas: ${op.infrutiferas} (Fim do dia expurgado: ${op.fimDoDiaCount})\n`;
      texto += `• 💰 Faturado: R$ ${formatMoney(op.faturado)} (Meta: ${op.atingimentoMeta.toFixed(1)}%)\n`;
      if (op.diagnostico?.padraoSuspeitoMigue) {
        texto += `• ⚠️ Alerta: Padrão atípico de baixas sem corte.\n`;
      }
      texto += `\n`;
    });

    texto += `💡 *Objetivo:* Alinhamento de rotas, elevação de cortes e suporte em campo.`;

    navigator.clipboard.writeText(texto).then(() => {
      alert('✅ Comparativo copiado para a área de transferência! Cole no WhatsApp.');
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md border border-blue-400/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Comparador Direto de Desempenho (Até 3 Funcionários)
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  ANÁLISE DE FEEDBACK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare produtividade, cortes, negociações POS e baixas lado a lado para reuniões de feedback
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copiarRelatorioComparativo}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar WhatsApp
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selectors */}
        <div className="bg-[#0c101d] px-6 py-3 border-b border-[#1f293d] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Colaborador 1:</label>
            <select
              value={op1Nome}
              onChange={(e) => setOp1Nome(e.target.value)}
              className="w-full bg-slate-900 border border-[#1f293d] text-white px-3 py-1.5 rounded-lg outline-none font-bold"
            >
              {operadores.map((op) => (
                <option key={op.nomeNormalizado} value={op.nomeNormalizado}>
                  {op.nome} ({op.frente})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Colaborador 2:</label>
            <select
              value={op2Nome}
              onChange={(e) => setOp2Nome(e.target.value)}
              className="w-full bg-slate-900 border border-[#1f293d] text-white px-3 py-1.5 rounded-lg outline-none font-bold"
            >
              {operadores.map((op) => (
                <option key={op.nomeNormalizado} value={op.nomeNormalizado}>
                  {op.nome} ({op.frente})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Colaborador 3 (Opcional):</label>
            <select
              value={op3Nome}
              onChange={(e) => setOp3Nome(e.target.value)}
              className="w-full bg-slate-900 border border-[#1f293d] text-white px-3 py-1.5 rounded-lg outline-none"
            >
              <option value="">Nenhum (Comparar apenas 2)</option>
              {operadores.map((op) => (
                <option key={op.nomeNormalizado} value={op.nomeNormalizado}>
                  {op.nome} ({op.frente})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Cards Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          {selecionados.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Selecione pelo menos um colaborador para visualizar o comparativo.
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-${selecionados.length} gap-4`}>
              {selecionados.map((op, idx) => (
                <div
                  key={op.nomeNormalizado}
                  className="bg-[#0b0f19] border border-[#1f293d] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-md"
                >
                  {/* Card Header */}
                  <div className="border-b border-[#1f293d] pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {op.tipoEquipe === 'PROPRIA' ? 'Própria' : 'Apoio Externo'}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white">{op.nome}</h4>
                    <p className="text-[11px] text-slate-400">
                      {op.veiculo} • {op.frente}
                    </p>
                  </div>

                  {/* KPIs */}
                  <div className="space-y-2.5">
                    {/* Taxa de Sucesso Real */}
                    <div className="bg-[#07090e] border border-[#1f293d] rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Taxa Sucesso Real:</span>
                      <span
                        className={`font-mono font-black text-sm ${
                          op.percSucesso >= 60
                            ? 'text-emerald-400'
                            : op.percSucesso >= 40
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        {op.percSucesso.toFixed(1)}%
                      </span>
                    </div>

                    {/* Total de Cortes */}
                    <div className="bg-[#07090e] border border-blue-500/30 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-blue-300 font-bold flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-blue-400" />
                        Cortes Executados:
                      </span>
                      <span className="font-mono font-black text-sm text-blue-400">
                        {op.cortes !== undefined ? op.cortes : op.cortesSupressoes}
                      </span>
                    </div>

                    {/* Supressões */}
                    <div className="bg-[#07090e] border border-blue-500/20 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-blue-300" />
                        Supressões:
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {op.supressoes || 0}
                      </span>
                    </div>

                    {/* Negociações via POS */}
                    <div className="bg-[#07090e] border border-purple-500/30 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-purple-300 font-bold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                        Negociações POS:
                      </span>
                      <span className="font-mono font-black text-sm text-purple-300">
                        {op.negociacoesPOS || 0}
                      </span>
                    </div>

                    {/* Reposições de Piso */}
                    <div className="bg-[#07090e] border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-amber-300 font-bold">Reposição de Piso:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {op.reposicoesPiso || 0}
                      </span>
                    </div>

                    {/* Total de OS & Fim do Dia */}
                    <div className="bg-[#07090e] border border-[#1f293d] rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Total de OS:</span>
                      <span className="font-mono font-bold text-white">
                        {op.totalOS} <span className="text-[10px] text-slate-500 font-normal">({op.fimDoDiaCount} fim de dia)</span>
                      </span>
                    </div>

                    {/* Faturamento */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        Faturamento:
                      </span>
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        R$ {formatMoney(op.faturado)}
                      </span>
                    </div>

                    {/* Atingimento de Meta */}
                    <div className="bg-[#07090e] border border-[#1f293d] rounded-lg p-2.5 flex items-center justify-between">
                      <span className="text-slate-400">Atingimento Meta:</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          op.atingimentoMeta >= 100
                            ? 'text-emerald-400'
                            : op.atingimentoMeta >= 80
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {op.atingimentoMeta.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Locais de Atuação */}
                  {op.bairrosMaisAtuados && op.bairrosMaisAtuados.length > 0 && (
                    <div className="bg-[#07090e] border border-[#1f293d] rounded-lg p-2.5 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        📍 Principais Locais:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {op.bairrosMaisAtuados.slice(0, 3).map((b) => (
                          <span
                            key={b.local}
                            className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono"
                          >
                            {b.local} ({b.quantidade})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Principais Baixas Infrutíferas */}
                  {op.principaisBaixas && op.principaisBaixas.length > 0 && (
                    <div className="bg-[#07090e] border border-[#1f293d] rounded-lg p-2.5 space-y-1">
                      <span className="text-[10px] font-bold text-orange-400 block uppercase">
                        ⚠️ Baixas Mais Comuns:
                      </span>
                      <div className="space-y-1 text-[10px]">
                        {op.principaisBaixas.slice(0, 2).map((bx) => (
                          <div key={bx.motivo} className="flex justify-between text-slate-300">
                            <span className="truncate max-w-[130px]">{bx.motivo}</span>
                            <span className="font-mono text-slate-400">
                              {bx.quantidade} ({bx.percentual.toFixed(0)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Diagnóstico */}
                  <div
                    className={`border rounded-lg p-3 text-[11px] leading-relaxed ${
                      op.diagnostico?.padraoSuspeitoMigue
                        ? 'bg-red-500/10 border-red-500/40 text-red-200'
                        : 'bg-[#07090e] border-[#1f293d] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {op.diagnostico?.padraoSuspeitoMigue ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-red-300">Padrão Suspeito</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-slate-300">Diagnóstico Regular</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-400 text-[10px]">
                      {op.diagnostico?.motivoAlerta || 'Produção normal.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

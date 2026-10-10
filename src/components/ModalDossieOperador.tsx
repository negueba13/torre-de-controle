import React, { useState } from 'react';
import { OperadorDossie } from '../types';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Scissors,
  ShieldCheck,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { formatMoney } from '../utils/pdeCleaner';

interface ModalDossieOperadorProps {
  dossie: OperadorDossie | null;
  onClose: () => void;
}

export const ModalDossieOperador: React.FC<ModalDossieOperadorProps> = ({ dossie, onClose }) => {
  const [abaDossie, setAbaDossie] = useState<'geral' | 'diario' | 'baixas'>('geral');

  if (!dossie) return null;

  const historicoArray = Object.entries(dossie.historicoDiario || {}).map(([chaveData, dados]) => ({
    ...dados,
    data: dados.data || chaveData
  }));

  // Ordena dias cronologicamente
  historicoArray.sort((a, b) => {
    const [dA, mA, yA] = a.data.split('/').map(Number);
    const [dB, mB, yB] = b.data.split('/').map(Number);
    const timeA = new Date(yA || 2026, (mA || 1) - 1, dA || 1).getTime();
    const timeB = new Date(yB || 2026, (mB || 1) - 1, dB || 1).getTime();
    return timeB - timeA; // mais recentes primeiro
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{dossie.nome}</h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                    dossie.tipoEquipe === 'PROPRIA'
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  {dossie.tipoEquipe === 'PROPRIA' ? 'Equipe Própria' : 'Apoio Externo'}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {dossie.veiculo} • {dossie.frente}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Raio-X de produtividade diária, diagnóstico de campo e análise de baixas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const totalRestabRelig = (dossie.restabes || 0) + (dossie.religacoes || 0);
                const msg = `Fala ${dossie.nome}! Aqui é da Supervisão Enorsul/Sabesp.\n\n📊 *Seu Raio-X de Produtividade:*\n• ✂️ Cortes: ${dossie.cortes || 0} | 🔒 Supressões: ${dossie.supressoes || 0}\n• 💧 Restabes / Religações: ${totalRestabRelig}\n• 💳 Negociações POS: ${dossie.negociacoesPOS || 0}\n• 🎯 Taxa de Sucesso Real: ${dossie.percSucesso.toFixed(1)}%\n• 💰 Faturamento: R$ ${formatMoney(dossie.faturado)}\n\nBora manter o foco para batermos as metas contratuais!`;
                navigator.clipboard.writeText(msg).then(() => {
                  alert(`Mensagem para ${dossie.nome} copiada! Cole no WhatsApp.`);
                });
              }}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              title="Copiar mensagem individual de feedback para o WhatsApp"
            >
              <span>📲</span> Feedback WhatsApp
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="bg-[#0c101d] px-6 py-2 border-b border-[#1f293d] flex gap-2 text-xs">
          <button
            onClick={() => setAbaDossie('geral')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              abaDossie === 'geral'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 Visão Geral & Diagnóstico
          </button>
          <button
            onClick={() => setAbaDossie('diario')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              abaDossie === 'diario'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Produção Dia a Dia ({historicoArray.length} dias)
          </button>
          <button
            onClick={() => setAbaDossie('baixas')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              abaDossie === 'baixas'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            Principais Baixas & Motivos ({dossie.principaisBaixas.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {abaDossie === 'geral' && (
            <>
              {/* KPIs de Produção do Operador */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Total de OS Executadas
                  </span>
                  <div className="text-2xl font-black text-white font-mono">{dossie.totalOS}</div>
                  <span className="text-[11px] text-slate-400">
                    {dossie.diasTrabalhados} dias trabalhados
                  </span>
                </div>

                <div className="bg-[#07090e] border border-blue-500/30 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                    Cortes & Supressões
                  </span>
                  <div className="text-2xl font-black text-blue-400 font-mono">
                    {dossie.cortesSupressoes}
                  </div>
                  <span className="text-[11px] text-blue-300/80 font-medium">Contribuem na meta Sabesp</span>
                </div>

                <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Taxa de Sucesso Real
                  </span>
                  <div
                    className={`text-2xl font-black font-mono ${
                      dossie.percSucesso >= 60
                        ? 'text-emerald-400'
                        : dossie.percSucesso >= 40
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {dossie.percSucesso.toFixed(1)}%
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {dossie.positivas} positivas vs {dossie.infrutiferas} falhas
                  </span>
                </div>

                <div className="bg-[#07090e] border border-emerald-500/30 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    Faturamento Gerado
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    R$ {formatMoney(dossie.faturado)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {dossie.fimDoDiaCount} fim de dia expurgados
                  </span>
                </div>
              </div>

              {/* DESMEMBRAMENTO DOS TIPOS DE SERVIÇOS EXECUTADOS */}
              <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡</span> Desmembramento de Serviços Concluídos:
                  </h4>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    Serviços que geram valor para a operação
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                  <div className="bg-[#0c101d] border border-blue-500/30 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-blue-400 block mb-0.5">✂️ Cortes Só</span>
                    <span className="text-lg font-black text-white font-mono">{dossie.cortes || 0}</span>
                  </div>

                  <div className="bg-[#0c101d] border border-blue-500/20 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-slate-300 block mb-0.5">🔒 Supressões</span>
                    <span className="text-lg font-black text-white font-mono">{dossie.supressoes || 0}</span>
                  </div>

                  <div className="bg-[#0c101d] border border-teal-500/30 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-teal-400 block mb-0.5">💧 Restabes / Relig.</span>
                    <span className="text-lg font-black text-teal-300 font-mono">
                      {(dossie.restabes || 0) + (dossie.religacoes || 0)}
                    </span>
                  </div>

                  <div className="bg-[#0c101d] border border-purple-500/40 rounded-lg p-2.5 shadow-sm">
                    <span className="text-[10px] font-bold text-purple-400 block mb-0.5">💳 Negociação POS</span>
                    <span className="text-lg font-black text-purple-300 font-mono">{dossie.negociacoesPOS || 0}</span>
                  </div>

                  <div className="bg-[#0c101d] border border-amber-500/30 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-amber-400 block mb-0.5">🧱 Pisos Repostos</span>
                    <span className="text-lg font-black text-amber-300 font-mono">{dossie.reposicoesPiso || 0}</span>
                  </div>

                  <div className="bg-[#0c101d] border border-slate-700 rounded-lg p-2.5">
                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">🧾 Faturas Pagas</span>
                    <span className="text-lg font-black text-slate-300 font-mono">{dossie.faturasPagas || 0}</span>
                  </div>
                </div>
              </div>

              {/* CARD DE DIAGNÓSTICO: O PROBLEMA É A ORDEM OU O OPERADOR? (ANTI-MIGUÉ) */}
              <div
                className={`border rounded-xl p-4 shadow-sm relative overflow-hidden ${
                  dossie.diagnostico.padraoSuspeitoMigue
                    ? 'bg-red-500/10 border-red-500/40 text-red-200'
                    : 'bg-blue-500/10 border-blue-500/40 text-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      dossie.diagnostico.padraoSuspeitoMigue
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {dossie.diagnostico.padraoSuspeitoMigue ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        {dossie.diagnostico.padraoSuspeitoMigue
                          ? '⚠️ ALERTA OPERACIONAL: PADRÃO ANÔMALO DE BAIXAS SEM CORTE'
                          : '✅ DIAGNÓSTICO OPERACIONAL: PRODUÇÃO CONSISTENTE'}
                      </h4>
                      <span className="text-[10px] font-bold bg-slate-900/60 px-2.5 py-0.5 rounded font-mono">
                        {dossie.diagnostico.ordensViciadasPerc}% Rota Viciada •{' '}
                        {dossie.diagnostico.ordensVirgensPerc}% Ordens Novas
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed mt-1">
                      {dossie.diagnostico.motivoAlerta}
                    </p>

                    <div className="mt-3 bg-[#07090e]/80 border border-[#1f293d] rounded-lg p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <span className="font-bold text-amber-300">💡 Diretriz da Chefia:</span>
                        <span>{dossie.diagnostico.sugestaoAcao}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ANÁLISE GEOGRÁFICA DE ATUAÇÃO (BAIRROS / MUNICÍPIOS) */}
              {dossie.bairrosMaisAtuados && dossie.bairrosMaisAtuados.length > 0 && (
                <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>📍</span> Onde este colaborador mais atuou (Bairros / Regiões):
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {dossie.bairrosMaisAtuados.slice(0, 8).map((b) => (
                      <div
                        key={b.local}
                        className="bg-[#0c101d] border border-[#1f293d] px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs"
                      >
                        <span className="text-slate-300 font-medium">{b.local}</span>
                        <span className="bg-blue-600/30 text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                          {b.quantidade} OS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumo das Maiores Baixas no painel geral */}
              <div className="bg-[#07090e] border border-[#1f293d] rounded-xl p-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-orange-400" />
                  Onde este funcionário mais perde visitas:
                </h4>
                <div className="space-y-2">
                  {dossie.principaisBaixas.slice(0, 4).map((b, i) => (
                    <div key={b.motivo} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          {i + 1}. {b.motivo}
                        </span>
                        <span className="font-mono text-slate-400">
                          <strong className="text-white">{b.quantidade}</strong> baixas ({b.percentual.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-orange-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, b.percentual)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {dossie.principaisBaixas.length === 0 && (
                    <p className="text-slate-500 text-center py-2">
                      Nenhuma baixa infrutífera registrada para este operador!
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {abaDossie === 'diario' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Evolução Diária de Atendimentos
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Acompanhe dia a dia o volume de cortes, faturamento e consistência de visitas
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded">
                  {historicoArray.length} Dias Registrados
                </span>
              </div>

              <div className="border border-[#1f293d] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#161f33] text-white border-b border-[#1f293d]">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">Data</th>
                      <th className="py-2.5 px-3 font-bold text-center">Total OS</th>
                      <th className="py-2.5 px-3 font-bold text-center text-blue-300">
                        Cortes Sabesp
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center text-teal-300">
                        Restabe / Relig.
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center text-emerald-300">
                        Positivas
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center text-orange-300">
                        Infrutíferas
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center text-slate-400">
                        Fim do Dia
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center">Taxa Sucesso</th>
                      <th className="py-2.5 px-3 font-bold text-right text-emerald-400">
                        Faturado (R$)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]/50">
                    {historicoArray.map((dia) => (
                      <tr key={dia.data} className="hover:bg-slate-800/30 transition">
                        <td className="py-2 px-3 font-bold text-white font-mono flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          {dia.data}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-200">
                          {dia.totalOS}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-blue-400">
                          {dia.cortesSupressoes}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-teal-300">
                          {(dia.restabes || 0) + (dia.religacoes || 0)}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-400">
                          {dia.positivas}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-orange-400">
                          {dia.infrutiferas}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-400">
                          {dia.fimDoDiaCount}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              dia.percSucesso >= 60
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : dia.percSucesso >= 40
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {dia.percSucesso.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                          R$ {formatMoney(dia.faturado)}
                        </td>
                      </tr>
                    ))}
                    {historicoArray.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-500">
                          Nenhum histórico diário detalhado disponível.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {abaDossie === 'baixas' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Detalhamento Completo das Ocorrências Infrutíferas
                </h4>
                <p className="text-[11px] text-slate-400">
                  Todas as baixas registradas por este funcionário que não geraram faturamento nem corte
                </p>
              </div>

              <div className="border border-[#1f293d] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#161f33] text-white border-b border-[#1f293d]">
                    <tr>
                      <th className="py-2.5 px-3 font-bold">#</th>
                      <th className="py-2.5 px-3 font-bold">Motivo da Baixa / Ocorrência</th>
                      <th className="py-2.5 px-3 font-bold text-center">Quantidade</th>
                      <th className="py-2.5 px-3 font-bold text-center">% das Falhas</th>
                      <th className="py-2.5 px-3 font-bold">Gravidade Operacional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d]/50">
                    {dossie.principaisBaixas.map((b, i) => {
                      const ehAlerta =
                        b.percentual > 40 &&
                        (b.motivo.includes('FECHADO') || b.motivo.includes('AUSENTE'));
                      return (
                        <tr key={b.motivo} className="hover:bg-slate-800/30 transition">
                          <td className="py-2 px-3 text-slate-500 font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-200">
                            {b.motivo}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-white">
                            {b.quantidade}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-300">
                            {b.percentual.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3">
                            {ehAlerta ? (
                              <span className="bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 rounded">
                                ⚠️ Alto índice (Verificar rota)
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded">
                                Normal de Campo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#161f33] border-t border-[#1f293d] px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Enorsul • Cobrança Alto Tietê & Leste • Auditoria de Produtividade
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

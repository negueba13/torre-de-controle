import React, { useState, useMemo } from 'react';
import { UrgenciaItem, RetrabalhoItem } from '../types';
import { formatDataHora, formatDataHoraVencimento, normalize } from '../utils/pdeCleaner';
import { Copy, Check, X, Send, Layers, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  urgencias: UrgenciaItem[];
  retrabalho: RetrabalhoItem[];
  faturamentoTotal: number;
}

export const ModalReportChefia: React.FC<Props> = ({
  isOpen,
  onClose,
  urgencias,
  retrabalho,
  faturamentoTotal: _faturamentoTotal
}) => {
  const [copiadoTipo, setCopiadoTipo] = useState<'RESUMO_CHEFIA' | 'COMPLETO' | null>(null);
  const [abaVisualizacao, setAbaVisualizacao] = useState<'RESUMO_CHEFIA' | 'COMPLETO'>('RESUMO_CHEFIA');
  const [notaAdicional, setNotaAdicional] = useState('');

  // Restabelecimento vs Piso breakdown
  const statsSeparadas = useMemo(() => {
    const isRestabItem = (u: UrgenciaItem) => {
      const desc = normalize(u.descricao);
      return (
        u.tipoUrgencia === 'RESTABELECIMENTO' ||
        u.tipoUrgencia === 'RELIGACAO' ||
        desc.includes('RESTAB') ||
        desc.includes('RELIG')
      );
    };

    const isPisoItem = (u: UrgenciaItem) => {
      const desc = normalize(u.descricao);
      return (
        u.tipoUrgencia === 'PISO' ||
        desc.includes('PISO') ||
        desc.includes('PASSEIO') ||
        desc.includes('CONCRETO') ||
        desc.includes('REPOR')
      );
    };

    const restabItens = urgencias.filter(isRestabItem);
    const pisoItens = urgencias.filter(isPisoItem);

    return {
      restab: {
        total: restabItens.length,
        vencidas: restabItens.filter((u) => u.statusPrazo === 'VENCIDA'),
        hoje: restabItens.filter((u) => u.statusPrazo === 'CRITICA'),
        amanha: restabItens.filter((u) => u.statusPrazo === 'AMANHA'),
        noPrazo: restabItens.filter((u) => u.statusPrazo === 'NO_PRAZO')
      },
      piso: {
        total: pisoItens.length,
        vencidas: pisoItens.filter((u) => u.statusPrazo === 'VENCIDA'),
        hoje: pisoItens.filter((u) => u.statusPrazo === 'CRITICA'),
        amanha: pisoItens.filter((u) => u.statusPrazo === 'AMANHA'),
        noPrazo: pisoItens.filter((u) => u.statusPrazo === 'NO_PRAZO')
      },
      geral: {
        total: urgencias.length,
        vencidas: urgencias.filter((u) => u.statusPrazo === 'VENCIDA'),
        hoje: urgencias.filter((u) => u.statusPrazo === 'CRITICA'),
        amanha: urgencias.filter((u) => u.statusPrazo === 'AMANHA'),
        noPrazo: urgencias.filter((u) => u.statusPrazo === 'NO_PRAZO')
      }
    };
  }, [urgencias]);

  if (!isOpen) return null;

  const dataHoraAtual = `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  // 1. Resumo Específico para Chefia (Padrão WhatsApp dos Chefes)
  const gerarTextoResumoChefia = () => {
    let msg = `🚨 *RESUMO EXECUTIVO – RESTAB & PISO (SABESP)*\n`;
    msg += `📅 *Posição:* ${dataHoraAtual}\n\n`;

    msg += `💧 *RESTABELECIMENTO / RELIGAÇÃO (${statsSeparadas.restab.total} OS):*\n`;
    msg += `• ⚡ *Vencem Hoje (≤ 24h):* ${statsSeparadas.restab.hoje.length} OS\n`;
    msg += `• 🟡 *Vencem Amanhã (24h a 48h):* ${statsSeparadas.restab.amanha.length} OS\n`;
    if (statsSeparadas.restab.vencidas.length > 0) {
      msg += `• 🔴 *Vencidas (Passivo):* ${statsSeparadas.restab.vencidas.length} OS\n`;
    }
    msg += `• 🟢 *No Prazo:* ${statsSeparadas.restab.noPrazo.length} OS\n\n`;

    msg += `🧱 *REPOSIÇÃO DE PISO / PASSEIO (${statsSeparadas.piso.total} OS):*\n`;
    msg += `• ⚡ *Vencem Hoje (≤ 24h):* ${statsSeparadas.piso.hoje.length} OS\n`;
    msg += `• 🟡 *Vencem Amanhã (24h a 48h):* ${statsSeparadas.piso.amanha.length} OS\n`;
    if (statsSeparadas.piso.vencidas.length > 0) {
      msg += `• 🔴 *Vencidas (Passivo):* ${statsSeparadas.piso.vencidas.length} OS\n`;
    }
    msg += `• 🟢 *No Prazo:* ${statsSeparadas.piso.noPrazo.length} OS\n\n`;

    msg += `🛡️ *RETRABALHO RETIDO:* ${retrabalho.length} Ordens bloqueadas preventivamente (PDEs com falhas anteriores ou repetidos).\n\n`;

    const totalVencemHoje = statsSeparadas.restab.hoje.length + statsSeparadas.piso.hoje.length;
    const totalVencemAmanha = statsSeparadas.restab.amanha.length + statsSeparadas.piso.amanha.length;

    msg += `📊 *TOTAL GERAL URGÊNCIAS: ${urgencias.length} OS*\n`;
    msg += `• ⚡ *Total que Vencem Hoje:* ${totalVencemHoje} OS\n`;
    msg += `• 🟡 *Total que Vencem Amanhã:* ${totalVencemAmanha} OS\n\n`;

    if (notaAdicional.trim()) {
      msg += `📌 *OBSERVAÇÕES DO CCO:*\n${notaAdicional.trim()}\n\n`;
    }

    msg += `🎯 *DIRETRIZ DA CHEFIA:* Prioridade máxima nos Restabelecimentos e Pisos que vencem hoje para blindagem do SLA!`;
    return msg;
  };

  // 2. Relatório Completo com Detalhamento de cada OS
  const gerarTextoCompleto = () => {
    let msg = `🚨 *TORRE DE CONTROLE – URGÊNCIAS SABESP (DETALHADO)*\n`;
    msg += `📅 *Data/Hora:* ${dataHoraAtual}\n\n`;

    msg += `📊 *PANORAMA GERAL (${urgencias.length} OS):*\n`;
    msg += `• 💧 Restabelecimento/Religação: ${statsSeparadas.restab.total} OS (Hoje: ${statsSeparadas.restab.hoje.length} | Amanhã: ${statsSeparadas.restab.amanha.length})\n`;
    msg += `• 🧱 Reposição de Piso: ${statsSeparadas.piso.total} OS (Hoje: ${statsSeparadas.piso.hoje.length} | Amanhã: ${statsSeparadas.piso.amanha.length})\n`;
    msg += `• 🔴 Vencidas: ${statsSeparadas.geral.vencidas.length} OS\n`;
    msg += `• ⚡ Vencem Hoje: ${statsSeparadas.geral.hoje.length} OS\n`;
    msg += `• 🟡 Vencem Amanhã: ${statsSeparadas.geral.amanha.length} OS\n\n`;

    if (statsSeparadas.geral.hoje.length > 0) {
      msg += `⚡ *DETALHAMENTO: VENCEM HOJE (DESPACHO IMEDIATO):*\n`;
      statsSeparadas.geral.hoje.slice(0, 15).forEach((u, i) => {
        const horaVenc = formatDataHoraVencimento(u.vencReal);
        const opAlocado = u.operadorAlocado || u.equipe || 'Não alocado';
        const status = u.statusOS || 'DESPACHADA';
        const local = `${u.municipio || 'Cobrança'}${u.bairro ? ` - ${u.bairro}` : ''}`;
        msg += `${i + 1}. *OS:* ${u.os} | *PDE:* ${u.pde}\n`;
        msg += `   👤 *Com quem está:* ${opAlocado}\n`;
        msg += `   📌 *Status:* ${status}\n`;
        msg += `   📍 *Onde fica:* ${local}\n`;
        msg += `   ⏰ *Vence às:* ${horaVenc}\n`;
        msg += `   🔧 *Serviço:* ${u.descricao}\n\n`;
      });
      if (statsSeparadas.geral.hoje.length > 15) {
        msg += `... e mais ${statsSeparadas.geral.hoje.length - 15} ordens vencendo hoje.\n\n`;
      }
    }

    if (statsSeparadas.geral.amanha.length > 0) {
      msg += `🟡 *PREVISÃO: VENCEM AMANHÃ (PROGRAMAR EQUIPES):*\n`;
      statsSeparadas.geral.amanha.slice(0, 10).forEach((u, i) => {
        const horaVenc = formatDataHoraVencimento(u.vencReal);
        const opAlocado = u.operadorAlocado || u.equipe || 'Não alocado';
        const status = u.statusOS || 'PLANEJÁVEL';
        const local = `${u.municipio || 'Cobrança'}${u.bairro ? ` - ${u.bairro}` : ''}`;
        msg += `• *OS:* ${u.os} | *PDE:* ${u.pde} | 📍 ${local}\n`;
        msg += `  👤 ${opAlocado} | 📌 ${status} | ⏰ *Vence:* ${horaVenc}\n`;
      });
      if (statsSeparadas.geral.amanha.length > 10) {
        msg += `... e mais ${statsSeparadas.geral.amanha.length - 10} ordens programadas para amanhã.\n`;
      }
      msg += `\n`;
    }

    if (notaAdicional.trim()) {
      msg += `📌 *OBSERVAÇÕES DO CCO:*\n${notaAdicional.trim()}\n\n`;
    }

    msg += `📢 *DIRETRIZ DA CHEFIA:* Foco nas urgências que vencem hoje para evitar multas!`;
    return msg;
  };

  const textoResumoChefia = gerarTextoResumoChefia();
  const textoCompleto = gerarTextoCompleto();

  const handleCopiarResumo = () => {
    navigator.clipboard.writeText(textoResumoChefia).then(() => {
      setCopiadoTipo('RESUMO_CHEFIA');
      setTimeout(() => setCopiadoTipo(null), 3000);
    });
  };

  const handleCopiarCompleto = () => {
    navigator.clipboard.writeText(textoCompleto).then(() => {
      setCopiadoTipo('COMPLETO');
      setTimeout(() => setCopiadoTipo(null), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Report de Urgências para Grupo dos Chefes
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  Restab & Piso
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Padrão operacional com separação detalhada de Restabelecimento e Piso (Hoje vs Amanhã)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* SEÇÃO ESPECÍFICA: RESTABELECIMENTO E PISO (HOJE VS AMANHÃ) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco 1: Restabelecimento & Religação */}
            <div className="bg-[#07090e] border border-blue-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3 border-b border-[#1f293d] pb-2">
                <span className="font-bold text-blue-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  💧 Restabelecimento / Religação
                </span>
                <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                  {statsSeparadas.restab.total} OS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block">⚡ Vencem Hoje</span>
                  <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                    {statsSeparadas.restab.hoje.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">≤ 24 horas</span>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-yellow-400 uppercase block">🟡 Vencem Amanhã</span>
                  <div className="text-xl font-black text-yellow-300 font-mono mt-0.5">
                    {statsSeparadas.restab.amanha.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">24h a 48 horas</span>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-red-400 uppercase block">🔴 Vencidas</span>
                  <div className="text-lg font-black text-red-300 font-mono mt-0.5">
                    {statsSeparadas.restab.vencidas.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Passivo Crítico</span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">🟢 No Prazo</span>
                  <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                    {statsSeparadas.restab.noPrazo.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">&gt; 48 horas</span>
                </div>
              </div>
            </div>

            {/* Bloco 2: Reposição de Piso & Concreto */}
            <div className="bg-[#07090e] border border-orange-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3 border-b border-[#1f293d] pb-2">
                <span className="font-bold text-orange-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  🧱 Reposição de Piso / Passeio
                </span>
                <span className="text-xs font-mono font-bold bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                  {statsSeparadas.piso.total} OS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase block">⚡ Vencem Hoje</span>
                  <div className="text-xl font-black text-amber-300 font-mono mt-0.5">
                    {statsSeparadas.piso.hoje.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">≤ 24 horas</span>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-yellow-400 uppercase block">🟡 Vencem Amanhã</span>
                  <div className="text-xl font-black text-yellow-300 font-mono mt-0.5">
                    {statsSeparadas.piso.amanha.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">24h a 48 horas</span>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-red-400 uppercase block">🔴 Vencidas</span>
                  <div className="text-lg font-black text-red-300 font-mono mt-0.5">
                    {statsSeparadas.piso.vencidas.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Passivo Crítico</span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">🟢 No Prazo</span>
                  <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                    {statsSeparadas.piso.noPrazo.length} <span className="text-xs font-normal text-slate-400">OS</span>
                  </div>
                  <span className="text-[10px] text-slate-400">&gt; 48 horas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campo de Observação Opcional */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Adicionar Recado / Observação Operacional da Chefia (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: Equipes Carlos e Marcos no reforço de Restabelecimento; meta 100% de baixa hoje."
              value={notaAdicional}
              onChange={(e) => setNotaAdicional(e.target.value)}
              className="w-full bg-[#07090e] border border-[#1f293d] rounded-lg p-2.5 text-white outline-none focus:border-amber-500 text-xs"
            />
          </div>

          {/* Seletor de Modelo de Mensagem (Abas internas) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#07090e] border border-[#1f293d] p-1 rounded-lg text-xs">
                <button
                  onClick={() => setAbaVisualizacao('RESUMO_CHEFIA')}
                  className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 ${
                    abaVisualizacao === 'RESUMO_CHEFIA'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Resumo Restab & Piso (Padrão Chefes)
                </button>
                <button
                  onClick={() => setAbaVisualizacao('COMPLETO')}
                  className={`px-3 py-1.5 rounded font-bold transition flex items-center gap-1.5 ${
                    abaVisualizacao === 'COMPLETO'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Relatório Detalhado com OSs
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                {abaVisualizacao === 'RESUMO_CHEFIA' ? 'Padrão executivo direto' : 'Com listagem de OSs'}
              </span>
            </div>

            {/* Pré-visualização da Mensagem Formatada */}
            <div className="relative">
              <pre className="bg-[#07090e] border border-[#1f293d] p-4 rounded-xl font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
                {abaVisualizacao === 'RESUMO_CHEFIA' ? textoResumoChefia : textoCompleto}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer com Botões de Ação */}
        <div className="bg-[#161f33] border-t border-[#1f293d] px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {/* Botão de Copiar Relatório Detalhado */}
            <button
              onClick={handleCopiarCompleto}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition border border-[#1f293d] ${
                copiadoTipo === 'COMPLETO'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {copiadoTipo === 'COMPLETO' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Copiado Detalhado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  Copiar Detalhado com OSs
                </>
              )}
            </button>

            {/* Botão Principal: Copiar Resumo Restab & Piso (Padrão Chefes) */}
            <button
              onClick={handleCopiarResumo}
              className={`flex items-center gap-2 text-xs font-black px-5 py-2.5 rounded-xl transition shadow-lg ${
                copiadoTipo === 'RESUMO_CHEFIA'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black'
              }`}
            >
              {copiadoTipo === 'RESUMO_CHEFIA' ? (
                <>
                  <Check className="w-4 h-4" />
                  Resumo Copiado para WhatsApp!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Resumo Restab & Piso (Chefes)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


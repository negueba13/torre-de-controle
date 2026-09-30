import React, { useState } from 'react';
import { UrgenciaItem, Usuario } from '../types';
import { X, ShieldAlert, CheckCircle2, FileText, AlertTriangle, Clock } from 'lucide-react';
import { formatDataHora } from '../utils/pdeCleaner';

interface ModalJustificarVencimentoProps {
  urgencia: UrgenciaItem | null;
  usuarioLogado: Usuario | null;
  onConfirmar: (urgenciaId: string, motivo: string, observacao: string) => void;
  onClose: () => void;
}

const MOTIVOS_SABESP_PADRAO = [
  'Imóvel Fechado / Sem Acesso ao Hidrômetro',
  'Cliente Ausente em Horário Comercial (Necessário Inverter Horário)',
  'Aguardando Vala / Apoio de Caminhão de Desobstrução',
  'Atraso no Despacho da Sabesp / Carga Tardia de Carteira',
  'Pane Veicular / Substituição de Moto em Campo',
  'Divergência Cadastral / Numeração ou Logradouro Não Localizado',
  'Ordem Repetida / Em Tratamento Técnico com a Fiscalização Sabesp',
  'Outro Motivo Operacional'
];

export const ModalJustificarVencimento: React.FC<ModalJustificarVencimentoProps> = ({
  urgencia,
  usuarioLogado,
  onConfirmar,
  onClose
}) => {
  const [motivoSelecionado, setMotivoSelecionado] = useState<string>(MOTIVOS_SABESP_PADRAO[0]);
  const [observacao, setObservacao] = useState<string>('');

  if (!urgencia) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const motivoFinal =
      motivoSelecionado === 'Outro Motivo Operacional' && observacao.trim()
        ? observacao.trim()
        : motivoSelecionado;

    onConfirmar(urgencia.id, motivoFinal, observacao.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0b0f19] border border-red-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="bg-[#16131c] border-b border-[#2d2235] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Justificar Vencimento / Passivo</h3>
                <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  SLA EXPIRADO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Registre a justificativa operacional para mitigar multas contratuais Sabesp
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Card Resumo da Ordem */}
          <div className="bg-[#0f1523] border border-[#1e293b] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Ordem de Serviço (OS):</span>
              <span className="font-mono font-bold text-white text-xs">{urgencia.os}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">PDE Higienizado:</span>
              <span className="font-mono font-bold text-cyan-400 text-xs">{urgencia.pdeFormatado}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Serviço:</span>
              <span className="text-slate-200 font-medium">{urgencia.descricao}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Local:</span>
              <span className="text-slate-300">
                {urgencia.municipio} • {urgencia.bairro}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]">
              <span className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Prazo Fatal Expirado:
              </span>
              <span className="font-mono font-bold text-red-300">
                {formatDataHora(urgencia.vencReal)}
              </span>
            </div>
          </div>

          {/* Seleção do Motivo */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Motivo Operacional da Impossibilidade de Conclusão no Prazo:
            </label>
            <select
              value={motivoSelecionado}
              onChange={(e) => setMotivoSelecionado(e.target.value)}
              className="w-full bg-[#070a12] border border-[#1e293b] focus:border-red-500 rounded-lg px-3 py-2 text-white outline-none transition font-medium"
            >
              {MOTIVOS_SABESP_PADRAO.map((mot) => (
                <option key={mot} value={mot}>
                  {mot}
                </option>
              ))}
            </select>
          </div>

          {/* Observação Adicional */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Observações Técnicas / Plano de Resolução:
            </label>
            <textarea
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Tentativa realizada pela equipe às 11h. Reagendado retorno com apoio para o primeiro turno de amanhã."
              className="w-full bg-[#070a12] border border-[#1e293b] focus:border-red-500 rounded-lg p-3 text-white outline-none transition"
            />
          </div>

          {/* Banner de Impacto */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex items-start gap-2.5 text-[11px] text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Ao registrar a justificativa, esta ordem é <strong>deslocada para a aba de Passivo Justificado</strong>, desarmando o alerta de emergência e documentando a auditoria.
            </span>
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            Supervisor Responsável: <strong className="text-white">{usuarioLogado?.nome || 'Matheus'}</strong> (
            {usuarioLogado?.email || 'Supervisor'})
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar Justificativa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import {
  X,
  FileSpreadsheet,
  Send,
  Copy,
  Download,
  Upload,
  History,
  Trash2,
  FileText,
  ShieldCheck,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Usuario } from '../types';

interface ModalCentralRelatoriosProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioLogado: Usuario | null;
  onAbrirReportChefia: () => void;
  onCopiarReportCCO: () => void;
  onCopiarJustificativaSabesp: () => void;
  onAbrirAuditoria: () => void;
  onExportarExcel: () => void;
  onExportarBackup: () => void;
  onRestaurarBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLimparBanco: () => void;
  fileInputBackupRef: React.RefObject<HTMLInputElement | null>;
}

export const ModalCentralRelatorios: React.FC<ModalCentralRelatoriosProps> = ({
  isOpen,
  onClose,
  usuarioLogado,
  onAbrirReportChefia,
  onCopiarReportCCO,
  onCopiarJustificativaSabesp,
  onAbrirAuditoria,
  onExportarExcel,
  onExportarBackup,
  onRestaurarBackup,
  onLimparBanco,
  fileInputBackupRef
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Futuristic Glow Corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="bg-[#101726] border-b border-[#1e293b] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">
                  Central Executiva de Relatórios & Exportações
                </h3>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  HUB OPERACIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Acesse relatórios de WhatsApp, memorandos Sabesp, auditoria de cargas e downloads
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

        {/* Body Grid of Cards */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          {/* Seção 1: Reportes Oficiais e WhatsApp */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              📲 Reportes Rápidos para WhatsApp
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Report Chefia */}
              <div
                onClick={() => {
                  onAbrirReportChefia();
                  onClose();
                }}
                className="bg-[#0f1523] border border-[#1e293b] hover:border-amber-500/50 rounded-xl p-4 cursor-pointer transition hover:bg-[#141c2e] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Urgências Restab/Piso
                    </span>
                    <Send className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                    Report WhatsApp Chefia
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Gera texto formatado com OS, PDE, município, com quem está a ordem e o horário exato de vencimento (Hoje e Amanhã).
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-amber-300 font-semibold">
                  <span>Abrir visualizador de mensagem</span>
                  <span>→</span>
                </div>
              </div>

              {/* Report CCO */}
              <div
                onClick={() => {
                  onCopiarReportCCO();
                  onClose();
                }}
                className="bg-[#0f1523] border border-[#1e293b] hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer transition hover:bg-[#141c2e] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Operacional CCO
                    </span>
                    <Copy className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                    Report WhatsApp CCO
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Copia com 1 clique o resumo executivo com volume de ordens despachadas, prazos críticos e distribuição da equipe.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                  <span>Copiar para a área de transferência</span>
                  <span>📋</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Sabesp Contratual & Auditoria */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              📑 Documentação Contratual & Rastreabilidade
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Justificativa Sabesp */}
              <div
                onClick={() => {
                  onCopiarJustificativaSabesp();
                  onClose();
                }}
                className="bg-[#0f1523] border border-[#1e293b] hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition hover:bg-[#141c2e] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      Meta 9.220 Cortes
                    </span>
                    <FileSpreadsheet className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                    Justificativa Técnica Sabesp
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Copia o memorando técnico oficial para fiscalização, comprovando contaminação por ordens viciadas e solicitando corte de ramal.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-blue-300 font-semibold">
                  <span>Copiar Memorando Sabesp</span>
                  <span>📋</span>
                </div>
              </div>

              {/* Auditoria de Cargas */}
              <div
                onClick={() => {
                  onAbrirAuditoria();
                  onClose();
                }}
                className="bg-[#0f1523] border border-[#1e293b] hover:border-purple-500/50 rounded-xl p-4 cursor-pointer transition hover:bg-[#141c2e] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Rastreabilidade Total
                    </span>
                    <History className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                    Histórico de Cargas & Auditoria
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Consulte o histórico de quem subiu arquivos, data/hora da última importação, período das planilhas e resumo de dados.
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-purple-300 font-semibold">
                  <span>Abrir tela de auditoria</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Exportação e Gestão de Dados */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              💾 Exportações, Backups & Manutenção
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  onExportarExcel();
                  onClose();
                }}
                className="bg-[#0f1523] border border-[#1e293b] hover:border-emerald-500/40 rounded-xl p-3.5 text-left transition hover:bg-[#141c2e] flex items-center gap-3"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Exportar Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-400">Planilha de produção e metas</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportarBackup();
                  onClose();
                }}
                className="bg-[#0f1523] border border-[#1e293b] hover:border-purple-500/40 rounded-xl p-3.5 text-left transition hover:bg-[#141c2e] flex items-center gap-3"
              >
                <Download className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Backup do Banco (.json)</div>
                  <div className="text-[10px] text-slate-400">Salvar histórico de PDEs e equipe</div>
                </div>
              </button>

              <label className="bg-[#0f1523] border border-[#1e293b] hover:border-blue-500/40 rounded-xl p-3.5 text-left transition hover:bg-[#141c2e] flex items-center gap-3 cursor-pointer">
                <Upload className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">Restaurar Banco</div>
                  <div className="text-[10px] text-slate-400">Carregar backup .json</div>
                </div>
                <input
                  ref={fileInputBackupRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    onRestaurarBackup(e);
                    onClose();
                  }}
                />
              </label>
            </div>
          </div>

          {/* Zona de Perigo / Manutenção (Somente Supervisor) */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-red-300">Zerar Cache Local de PDEs</div>
              <div className="text-[10px] text-slate-400">
                Limpa os registros acumulados no navegador. Apenas o Supervisor tem permissão.
              </div>
            </div>
            <button
              onClick={() => {
                onLimparBanco();
                onClose();
              }}
              className="bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Cache
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#101726] border-t border-[#1e293b] px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Conectado como: <strong className="text-white">{usuarioLogado?.nome || 'Supervisor'}</strong> ({usuarioLogado?.cargo})
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition"
          >
            Fechar Central
          </button>
        </div>
      </div>
    </div>
  );
};

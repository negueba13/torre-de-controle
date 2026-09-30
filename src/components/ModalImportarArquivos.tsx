import React from 'react';
import { X, UploadCloud, DollarSign, Layers, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Usuario } from '../types';

interface ModalImportarArquivosProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioLogado: Usuario | null;
  totalExecucoesProcessadas: number;
  totalCarteiraImportada: number;
  duplicidadesCarteiraCount: number;
  modoCarga: 'INCREMENTAL' | 'SUBSTITUIR';
  setModoCarga: (modo: 'INCREMENTAL' | 'SUBSTITUIR') => void;
  fileInputExecucoesRef: React.RefObject<HTMLInputElement | null>;
  fileInputPendenciasRef: React.RefObject<HTMLInputElement | null>;
  onFileExecucoes: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilePendencias: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ModalImportarArquivos: React.FC<ModalImportarArquivosProps> = ({
  isOpen,
  onClose,
  usuarioLogado,
  totalExecucoesProcessadas,
  totalCarteiraImportada,
  duplicidadesCarteiraCount,
  modoCarga,
  setModoCarga,
  fileInputExecucoesRef,
  fileInputPendenciasRef,
  onFileExecucoes,
  onFilePendencias
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="bg-[#101726] border-b border-[#1e293b] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">
                  Importação de Dados Operacionais
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  MOTORES 1 & 2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha abaixo o tipo de planilha Sabesp que deseja processar
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

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Seletor do Modo de Carga */}
          <div className="bg-[#121929] border border-[#1f293d] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">Estratégia de Processamento:</span>
              <span className="text-[11px] text-slate-400">
                Como deseja que os novos dados se comportem em relação aos já carregados?
              </span>
            </div>

            <div className="bg-[#07090e] border border-[#1f293d] p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setModoCarga('INCREMENTAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  modoCarga === 'INCREMENTAL'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Soma com os dias anteriores, acumulando o mês sem duplicar OS repetida"
              >
                <span>➕</span> Incrementar / Somar Dia a Dia
              </button>
              <button
                type="button"
                onClick={() => setModoCarga('SUBSTITUIR')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  modoCarga === 'SUBSTITUIR'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Substitui a carga anterior pela nova planilha"
              >
                <span>🔄</span> Substituir Carga Atual
              </button>
            </div>
          </div>
          {/* MOTOR 1: EXECUÇÕES */}
          <div
            onClick={() => fileInputExecucoesRef.current?.click()}
            className="border-2 border-dashed border-emerald-500/60 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 rounded-xl p-5 cursor-pointer transition flex items-start gap-4 group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition border border-emerald-500/40 mt-0.5">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded tracking-wide">
                    MOTOR 1
                  </span>
                  <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wider">
                    Planilha de Execuções Concluídas (Produção)
                  </h4>
                </div>
                {totalExecucoesProcessadas > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                    {totalExecucoesProcessadas.toLocaleString('pt-BR')} Linhas Carregadas
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                Importe aqui o relatório de ordens executadas em campo. O sistema higieniza os PDEs, expurga as baixas de &quot;Fim do Dia&quot;, calcula as comissões e alimenta o radar de produtividade.
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-emerald-300 font-semibold">
                <span>Clique aqui para selecionar arquivo (.xlsx, .xls, .csv)</span>
                <span>→</span>
              </div>
            </div>
            <input
              ref={fileInputExecucoesRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                onFileExecucoes(e);
                onClose();
              }}
            />
          </div>

          {/* MOTOR 2: PENDÊNCIAS */}
          <div
            onClick={() => fileInputPendenciasRef.current?.click()}
            className="border-2 border-dashed border-blue-500/60 hover:border-blue-400 bg-blue-500/10 hover:bg-blue-500/15 rounded-xl p-5 cursor-pointer transition flex items-start gap-4 group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/25 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition border border-blue-500/40 mt-0.5">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded tracking-wide">
                    MOTOR 2
                  </span>
                  <h4 className="text-sm font-black text-blue-300 uppercase tracking-wider">
                    Carteira de Pendências (Triagem de Campo)
                  </h4>
                </div>
                {totalCarteiraImportada > 0 && (
                  <span className="text-[10px] font-bold bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                    {totalCarteiraImportada.toLocaleString('pt-BR')} Na Carteira
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                Importe aqui a nova carteira de OS pendentes enviada pela Sabesp. O sistema cruza os PDEs contra a memória histórica, separa as urgências por horário e bloqueia retrabalhos viciados.
              </p>
              {duplicidadesCarteiraCount > 0 && (
                <div className="mt-2 text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{duplicidadesCarteiraCount} PDEs duplicados identificados na última carga.</span>
                </div>
              )}
              <div className="mt-2.5 flex items-center gap-2 text-[11px] text-blue-300 font-semibold">
                <span>Clique aqui para selecionar arquivo (.xlsx, .xls, .csv)</span>
                <span>→</span>
              </div>
            </div>
            <input
              ref={fileInputPendenciasRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                onFilePendencias(e);
                onClose();
              }}
            />
          </div>

          <div className="bg-[#07090e] border border-[#1e293b] rounded-xl p-3.5 text-[11px] text-slate-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Dica de Operação:</strong> Você não precisa subir os arquivos todos os dias do zero; o sistema mantém salvo o último estado processado no banco local.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#101726] border-t border-[#1e293b] px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Enorsul • Sabesp Cobrança Alto & Leste
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

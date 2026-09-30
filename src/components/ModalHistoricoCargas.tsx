import React from 'react';
import { RegistroCarga } from '../types';
import { X, History, FileSpreadsheet, Trash2, Clock, CheckCircle } from 'lucide-react';

interface ModalHistoricoCargasProps {
  cargas: RegistroCarga[];
  onClose: () => void;
  onLimparHistorico: () => void;
  onDesfazerCarga?: (tipo: 'EXECUCOES' | 'PENDENCIAS') => void;
}

export const ModalHistoricoCargas: React.FC<ModalHistoricoCargasProps> = ({
  cargas,
  onClose,
  onLimparHistorico,
  onDesfazerCarga
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Histórico de Cargas & Auditoria do Banco
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rastreabilidade de quem subiu arquivos, data/hora da última importação e resumo do período
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
          {cargas.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-slate-400">Nenhuma carga registrada até o momento.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Ao subir planilhas de Execuções ou Pendências, o registro de auditoria aparecerá aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cargas.map((item, index) => (
                <div
                  key={item.id}
                  className={`bg-[#07090e] border rounded-xl p-4 transition ${
                    index === 0 ? 'border-purple-500/50 shadow-md shadow-purple-500/5' : 'border-[#1f293d]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded tracking-wide ${
                          item.tipo === 'EXECUCOES'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {item.tipo === 'EXECUCOES' ? '⚙️ MOTOR 1: EXECUÇÕES' : '🔍 MOTOR 2: PENDÊNCIAS'}
                      </span>
                      {index === 0 && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                          Última Carga Realizada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.dataHora}</span>
                      </div>
                      {onDesfazerCarga && (
                        <button
                          onClick={() => onDesfazerCarga(item.tipo)}
                          className="text-[10px] bg-red-500/10 hover:bg-red-500/25 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-bold transition flex items-center gap-1"
                          title="Apagar / Zerar os dados desta planilha caso tenha subido errado"
                        >
                          <Trash2 className="w-3 h-3" />
                          Desfazer Carga
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div className="bg-[#0f1523] border border-[#1f293d] rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Responsável pelo Envio
                      </span>
                      <div className="text-white font-bold text-xs mt-0.5">
                        👤 {item.usuarioNome || 'Supervisor'}
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono mt-0.5">
                        {item.usuarioEmail || 'Sem e-mail'}
                      </div>
                    </div>

                    <div className="bg-[#0f1523] border border-[#1f293d] rounded-lg p-2.5">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Volume e Período
                      </span>
                      <div className="text-purple-300 font-bold text-xs mt-0.5">
                        📊 {item.totalLinhas.toLocaleString('pt-BR')} linhas processadas
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5">
                        Período: <strong>{item.periodo || 'Não informado'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 bg-[#0f1523]/80 border border-[#1f293d] rounded-lg px-3 py-2 flex items-center gap-2 text-slate-300 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item.resumo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#161f33] border-t border-[#1f293d] px-6 py-3 flex items-center justify-between">
          {cargas.length > 0 ? (
            <button
              onClick={onLimparHistorico}
              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Auditoria
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">Audit trail ativo</span>
          )}

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

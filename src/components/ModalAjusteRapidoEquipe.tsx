import React, { useState } from 'react';
import { X, Users, Check, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { METAS_PADRAO } from '../types';

interface ModalAjusteRapidoEquipeProps {
  isOpen: boolean;
  onClose: () => void;
  totalOperadores: number;
  totalApoioExterno: number;
  onAplicarAjusteMassa: (config: {
    tipoEquipe: 'PROPRIA' | 'APOIO_EXTERNO';
    frente: 'Cobrança Leste' | 'Cobrança Alto Tietê';
    veiculo: 'Moto' | 'Carro';
    meta: number;
  }) => void;
  onAbrirCadastroIndividual: () => void;
  onAbrirImportacaoExcel: () => void;
}

export const ModalAjusteRapidoEquipe: React.FC<ModalAjusteRapidoEquipeProps> = ({
  isOpen,
  onClose,
  totalOperadores,
  totalApoioExterno,
  onAplicarAjusteMassa,
  onAbrirCadastroIndividual,
  onAbrirImportacaoExcel
}) => {
  if (!isOpen) return null;

  const [frenteSelecionada, setFrenteSelecionada] = useState<'Cobrança Leste' | 'Cobrança Alto Tietê'>('Cobrança Leste');
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<'Moto' | 'Carro'>('Moto');
  const [metaSelecionada, setMetaSelecionada] = useState<number>(METAS_PADRAO.metaMoto);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ⚡ Gestão Rápida da Equipe em Massa
              </h3>
              <p className="text-xs text-slate-400">
                Configure todos os operadores da planilha em 1 clique sem retrabalho manual
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status alert */}
        <div className="p-6 space-y-5 text-xs">
          {totalApoioExterno > 0 && (
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block mb-0.5">
                  {totalApoioExterno} colaboradores vieram como "Apoio Externo"
                </span>
                <span className="text-slate-300">
                  Como ainda não foram cadastrados no seu banco local, o sistema os marcou preventivamente como Apoio Externo. Use o botão abaixo para torná-los <strong>Equipe Própria</strong> instantaneamente!
                </span>
              </div>
            </div>
          )}

          {/* Super Fast 1-Click Buttons */}
          <div className="space-y-3">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
              1. Ações Rápidas em 1 Clique (Todos os {totalOperadores} Operadores):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  onAplicarAjusteMassa({
                    tipoEquipe: 'PROPRIA',
                    frente: 'Cobrança Leste',
                    veiculo: 'Moto',
                    meta: METAS_PADRAO.metaMoto
                  });
                  onClose();
                }}
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-xl p-3.5 text-left transition group shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white group-hover:text-blue-300 flex items-center gap-1.5">
                    <span>💧</span> Cobrança Leste
                  </span>
                  <ArrowRight className="w-4 h-4 text-blue-400 transition transform group-hover:translate-x-1" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Definir todos como <strong>Equipe Própria (Leste)</strong> com moto e meta R$ 10.000.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  onAplicarAjusteMassa({
                    tipoEquipe: 'PROPRIA',
                    frente: 'Cobrança Alto Tietê',
                    veiculo: 'Moto',
                    meta: METAS_PADRAO.metaMoto
                  });
                  onClose();
                }}
                className="bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-xl p-3.5 text-left transition group shadow-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white group-hover:text-cyan-300 flex items-center gap-1.5">
                    <span>💧</span> Cobrança Alto Tietê
                  </span>
                  <ArrowRight className="w-4 h-4 text-cyan-400 transition transform group-hover:translate-x-1" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Definir todos como <strong>Equipe Própria (Alto Tietê)</strong> com moto e meta R$ 10.000.
                </p>
              </button>
            </div>
          </div>

          {/* Custom Batch Setting */}
          <div className="bg-[#090d16] border border-[#1f293d] rounded-xl p-4 space-y-3">
            <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider block">
              2. Ou Personalize os Parâmetros em Massa:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Frente:</label>
                <select
                  value={frenteSelecionada}
                  onChange={(e) => setFrenteSelecionada(e.target.value as any)}
                  className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg font-bold"
                >
                  <option value="Cobrança Leste">💧 Cobrança Leste</option>
                  <option value="Cobrança Alto Tietê">💧 Cobrança Alto Tietê</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Veículo:</label>
                <select
                  value={veiculoSelecionado}
                  onChange={(e) => {
                    const v = e.target.value as any;
                    setVeiculoSelecionado(v);
                    setMetaSelecionada(v === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto);
                  }}
                  className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg font-bold"
                >
                  <option value="Moto">🏍️ Moto</option>
                  <option value="Carro">🚗 Carro</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Meta Padrão (R$):</label>
                <input
                  type="number"
                  value={metaSelecionada}
                  onChange={(e) => setMetaSelecionada(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#07090e] border border-[#1f293d] text-emerald-400 p-2 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onAplicarAjusteMassa({
                  tipoEquipe: 'PROPRIA',
                  frente: frenteSelecionada,
                  veiculo: veiculoSelecionado,
                  meta: metaSelecionada
                });
                onClose();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition shadow flex items-center justify-center gap-2 mt-2"
            >
              <Check className="w-4 h-4" />
              Aplicar a Todos os Colaboradores Atuais
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#1f293d]">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAbrirCadastroIndividual();
              }}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5"
            >
              <span>➕</span> Cadastrar Colaborador Individualmente
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onAbrirImportacaoExcel();
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5"
            >
              <span>📂</span> Subir Planilha de Equipe (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, ArrowRightLeft, Shield, Check, Users } from 'lucide-react';
import { Operador } from '../types';

interface ModalTrocaEquipeProps {
  isOpen: boolean;
  onClose: () => void;
  operador: Operador | null;
  onConfirmarTroca: (operador: Operador, novaFrente: string, novoVeiculo?: string) => Promise<void>;
}

const FRENTES = [
  {
    nome: 'Cobrança Leste',
    descricao: 'Execuções de corte, supressão e religações na Zona Leste',
    cor: 'border-blue-500/40 bg-blue-500/10 text-blue-400'
  },
  {
    nome: 'Cobrança Alto Tietê',
    descricao: 'Mogi das Cruzes, Suzano, Itaquaquecetuba, Poá e região',
    cor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
  },
  {
    nome: 'Irregularidade',
    descricao: 'Fraudes, by-pass, adulteração de hidrômetro e indícios',
    cor: 'border-amber-500/40 bg-amber-500/10 text-amber-400'
  },
  {
    nome: 'Hidrometria e Aferição',
    descricao: 'Aferições em campo, trocas preventivas e corretivas de HD',
    cor: 'border-purple-500/40 bg-purple-500/10 text-purple-400'
  }
];

export const ModalTrocaEquipe: React.FC<ModalTrocaEquipeProps> = ({
  isOpen,
  onClose,
  operador,
  onConfirmarTroca
}) => {
  const [frenteSelecionada, setFrenteSelecionada] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (operador) {
      setFrenteSelecionada(operador.frente || 'Cobrança Leste');
    }
  }, [operador, isOpen]);

  if (!isOpen || !operador) return null;

  const handleSalvar = async () => {
    if (!frenteSelecionada) return;
    try {
      setIsSubmitting(true);
      await onConfirmarTroca(operador, frenteSelecionada);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Transferência de Equipe</h2>
              <p className="text-xs text-slate-400">Troca rápida de frente operacional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Operador Card */}
          <div className="bg-[#07090e] border border-[#1f293d] p-4 rounded-xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-blue-400 font-bold flex items-center justify-center text-sm">
              {operador.nome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{operador.nome}</h3>
              <p className="text-slate-400 text-xs">
                {operador.funcao || 'Operador'} • {operador.veiculo}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400">Equipe Atual:</span>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {operador.frente}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Selecione a Nova Frente / Equipe:
            </label>

            <div className="space-y-2">
              {FRENTES.map((f) => {
                const isSelected = frenteSelecionada === f.nome;
                const isAtual = operador.frente === f.nome;

                return (
                  <div
                    key={f.nome}
                    onClick={() => setFrenteSelecionada(f.nome)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[#1f293d] bg-[#07090e] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{f.nome}</span>
                        {isAtual && (
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{f.descricao}</p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1f293d] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              disabled={isSubmitting || frenteSelecionada === operador.frente}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-40"
            >
              <Users className="w-4 h-4" />
              {isSubmitting ? 'Transferindo...' : 'Confirmar Transferência'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

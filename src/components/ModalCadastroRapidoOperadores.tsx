import React, { useState } from 'react';
import { X, UserPlus, ClipboardList, CheckCircle2, Shield, Truck, Sparkles } from 'lucide-react';
import { OperadorEquipe, METAS_PADRAO } from '../types';
import { normalize } from '../utils/pdeCleaner';

interface ModalCadastroRapidoOperadoresProps {
  isOpen: boolean;
  onClose: () => void;
  onCadastrarLote: (novosOperadores: OperadorEquipe[]) => void;
}

export const ModalCadastroRapidoOperadores: React.FC<ModalCadastroRapidoOperadoresProps> = ({
  isOpen,
  onClose,
  onCadastrarLote
}) => {
  const [textoNomes, setTextoNomes] = useState('');
  const [frentePadrao, setFrentePadrao] = useState('Cobrança Leste');
  const [veiculoPadrao, setVeiculoPadrao] = useState<'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro'>('Moto');
  const [tipoEquipePadrao, setTipoEquipePadrao] = useState<'PROPRIA' | 'APOIO_EXTERNO'>('PROPRIA');

  if (!isOpen) return null;

  const linhasNomes = textoNomes
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2);

  const handleCadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (linhasNomes.length === 0) return;

    const novos: OperadorEquipe[] = linhasNomes.map((nome) => {
      const meta =
        tipoEquipePadrao === 'APOIO_EXTERNO'
          ? 0
          : veiculoPadrao === 'Carro'
          ? METAS_PADRAO.metaCarro
          : METAS_PADRAO.metaMoto;

      return {
        nome,
        nomeNormalizado: normalize(nome),
        frente: frentePadrao,
        veiculo: veiculoPadrao,
        tipoEquipe: tipoEquipePadrao,
        meta,
        percComissao: METAS_PADRAO.percComissaoPadrao,
        ativo: true
      };
    });

    onCadastrarLote(novos);
    setTextoNomes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                📋 Cadastro Rápido de Colaboradores em Lote
              </h3>
              <p className="text-xs text-slate-400">
                Cole a lista de nomes do WhatsApp ou planilha para cadastrar todos em 1 clique
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

        {/* Form Body */}
        <form onSubmit={handleCadastrar} className="p-6 space-y-4 text-xs">
          {/* Default configurations */}
          <div className="bg-[#090d16] p-4 rounded-xl border border-[#1f293d] space-y-3">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Configuração Padrão para os Nomes Abaixo:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-400" />
                  Tipo de Equipe
                </label>
                <select
                  value={tipoEquipePadrao}
                  onChange={(e) => setTipoEquipePadrao(e.target.value as any)}
                  className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg outline-none focus:border-blue-500 font-bold text-xs"
                >
                  <option value="PROPRIA">👤 Equipe Própria</option>
                  <option value="APOIO_EXTERNO">🤝 Apoio Externo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <span>🏢</span>
                  Frente
                </label>
                <select
                  value={frentePadrao}
                  onChange={(e) => setFrentePadrao(e.target.value)}
                  className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg outline-none focus:border-blue-500 font-bold text-xs"
                >
                  <option value="Cobrança Leste">💧 Cobrança Leste</option>
                  <option value="Cobrança Alto Tietê">💧 Cobrança Alto Tietê</option>
                  <option value="Apoio Externo">🤝 Apoio Externo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-400" />
                  Veículo
                </label>
                <select
                  value={veiculoPadrao}
                  onChange={(e) => setVeiculoPadrao(e.target.value as any)}
                  className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2 rounded-lg outline-none focus:border-blue-500 font-bold text-xs"
                >
                  <option value="Moto">🏍️ Moto (Meta R$ 10k)</option>
                  <option value="Carro">🚗 Carro (Meta R$ 13k)</option>
                  <option value="Pedestre">🚶 Pedestre</option>
                  <option value="Ajudante de Carro">👥 Ajudante</option>
                </select>
              </div>
            </div>
          </div>

          {/* Textarea for pasting names */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                Cole os Nomes dos Operadores (um por linha):
              </label>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                {linhasNomes.length} colaborador(es) detectado(s)
              </span>
            </div>
            <textarea
              rows={6}
              value={textoNomes}
              onChange={(e) => setTextoNomes(e.target.value)}
              placeholder={`Exemplo:\nCarlos Eduardo da Silva\nMarcos Vinicius Pereira\nRodrigo Santos Souza\nFabiano Alves`}
              className="w-full bg-[#07090e] border border-[#1f293d] text-white p-3 rounded-xl outline-none focus:border-emerald-500 font-mono text-xs leading-relaxed"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Dica: Copie a lista diretamente do grupo de WhatsApp da equipe ou da primeira coluna do Excel e cole aqui.
            </p>
          </div>

          {/* Preview tags */}
          {linhasNomes.length > 0 && (
            <div className="bg-[#0b0f19] p-3 rounded-xl border border-[#1f293d] max-h-32 overflow-y-auto">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1.5">
                Prévia dos nomes a serem cadastrados:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {linhasNomes.map((n, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold"
                  >
                    👤 {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-[#1f293d] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={linhasNomes.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cadastrar {linhasNomes.length} Colaboradores
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

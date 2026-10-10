import React, { useState, useEffect } from 'react';
import { X, UserCheck, DollarSign, Shield, Truck, Sparkles, UserPlus } from 'lucide-react';
import { OperadorEquipe, METAS_PADRAO } from '../types';
import { normalize } from '../utils/pdeCleaner';

interface ModalEditarOperadorProps {
  operador: {
    nome: string;
    nomeNormalizado: string;
    veiculo: string;
    frente: string;
    tipoEquipe?: 'PROPRIA' | 'APOIO_EXTERNO';
    meta?: number;
    percComissao?: number;
    ativo?: boolean;
  } | null;
  isOpen: boolean;
  isNovo?: boolean;
  onClose: () => void;
  onSalvar: (dadosAtualizados: OperadorEquipe) => void;
}

export const ModalEditarOperador: React.FC<ModalEditarOperadorProps> = ({
  operador,
  isOpen,
  isNovo = false,
  onClose,
  onSalvar
}) => {
  const [nome, setNome] = useState('');
  const [tipoEquipe, setTipoEquipe] = useState<'PROPRIA' | 'APOIO_EXTERNO'>('PROPRIA');
  const [frente, setFrente] = useState('Cobrança Leste');
  const [veiculo, setVeiculo] = useState<'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro'>('Moto');
  const [meta, setMeta] = useState<number>(METAS_PADRAO.metaMoto);
  const [percComissao, setPercComissao] = useState<number>(METAS_PADRAO.percComissaoPadrao);
  const [ativo, setAtivo] = useState<boolean>(true);

  useEffect(() => {
    if (operador) {
      setNome(operador.nome || '');
      setTipoEquipe(operador.tipoEquipe || 'PROPRIA');
      setFrente(operador.frente || 'Cobrança Leste');
      setVeiculo((operador.veiculo as any) || 'Moto');
      setMeta(
        operador.meta !== undefined && operador.meta > 0
          ? operador.meta
          : operador.veiculo === 'Carro'
          ? METAS_PADRAO.metaCarro
          : METAS_PADRAO.metaMoto
      );
      setPercComissao(operador.percComissao || METAS_PADRAO.percComissaoPadrao);
      setAtivo(operador.ativo !== false);
    } else {
      setNome('');
      setTipoEquipe('PROPRIA');
      setFrente('Cobrança Leste');
      setVeiculo('Moto');
      setMeta(METAS_PADRAO.metaMoto);
      setPercComissao(METAS_PADRAO.percComissaoPadrao);
      setAtivo(true);
    }
  }, [operador, isOpen, isNovo]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onSalvar({
      nome: nome.trim(),
      nomeNormalizado: operador ? operador.nomeNormalizado : normalize(nome.trim()),
      frente,
      veiculo,
      meta,
      percComissao,
      tipoEquipe,
      ativo
    });
    onClose();
  };

  const aplicarPredefinicao = (tipo: 'propria_leste' | 'propria_alto' | 'apoio') => {
    if (tipo === 'propria_leste') {
      setTipoEquipe('PROPRIA');
      setFrente('Cobrança Leste');
      setMeta(veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto);
    } else if (tipo === 'propria_alto') {
      setTipoEquipe('PROPRIA');
      setFrente('Cobrança Alto Tietê');
      setMeta(veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto);
    } else {
      setTipoEquipe('APOIO_EXTERNO');
      setFrente('Apoio Externo');
      setMeta(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isNovo || !operador
                ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
            }`}>
              {isNovo || !operador ? <UserPlus className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isNovo || !operador ? '➕ Cadastrar Novo Colaborador' : '✏️ Editar Colaborador'}
              </h3>
              <p className="text-xs text-slate-400">
                {isNovo || !operador
                  ? 'Adicione um novo operador à equipe fixa da base operacional'
                  : 'Ajuste frente, modalidade de equipe e metas contratuais'}
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

        {/* Quick presets */}
        <div className="bg-[#090d16] px-6 py-2.5 border-b border-[#1f293d] flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Atalhos:
          </span>
          <button
            type="button"
            onClick={() => aplicarPredefinicao('propria_leste')}
            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2 py-1 rounded transition whitespace-nowrap font-bold"
          >
            💧 Equipe Própria (Leste)
          </button>
          <button
            type="button"
            onClick={() => aplicarPredefinicao('propria_alto')}
            className="bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded transition whitespace-nowrap font-bold"
          >
            💧 Equipe Própria (Alto Tietê)
          </button>
          <button
            type="button"
            onClick={() => aplicarPredefinicao('apoio')}
            className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-2 py-1 rounded transition whitespace-nowrap font-bold"
          >
            🤝 Apoio Externo
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Nome do Operador</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-lg outline-none focus:border-blue-500 font-bold text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Tipo de Equipe
              </label>
              <select
                value={tipoEquipe}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setTipoEquipe(val);
                  if (val === 'APOIO_EXTERNO') setMeta(0);
                  else if (meta === 0) setMeta(veiculo === 'Carro' ? METAS_PADRAO.metaCarro : METAS_PADRAO.metaMoto);
                }}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-lg outline-none focus:border-blue-500 font-bold"
              >
                <option value="PROPRIA">👤 Equipe Própria (Fixa)</option>
                <option value="APOIO_EXTERNO">🤝 Apoio Externo (Outras Frentes)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <span>🏢</span>
                Frente Operacional
              </label>
              <select
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-lg outline-none focus:border-blue-500 font-bold"
              >
                <option value="Cobrança Leste">💧 Cobrança Leste (São Paulo)</option>
                <option value="Cobrança Alto Tietê">💧 Cobrança Alto Tietê (Mogi/Suzano/Poá)</option>
                <option value="Apoio Externo">🤝 Apoio Externo</option>
                <option value="Irregularidade">🔎 Irregularidade</option>
                <option value="Hidrometria e Aferição">🔧 Hidrometria e Aferição</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                Veículo / Modalidade
              </label>
              <select
                value={veiculo}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setVeiculo(val);
                  if (tipoEquipe === 'PROPRIA') {
                    if (val === 'Moto') setMeta(METAS_PADRAO.metaMoto);
                    else if (val === 'Carro') setMeta(METAS_PADRAO.metaCarro);
                    else setMeta(METAS_PADRAO.metaPedestre);
                  }
                }}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-lg outline-none focus:border-blue-500 font-bold"
              >
                <option value="Moto">🏍️ Moto</option>
                <option value="Carro">🚗 Carro</option>
                <option value="Pedestre">🚶 Pedestre</option>
                <option value="Ajudante de Carro">👥 Ajudante de Carro</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Meta Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={meta}
                onChange={(e) => setMeta(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-emerald-400 p-2.5 rounded-lg outline-none focus:border-emerald-500 font-mono font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Padrão Sabesp: Moto R$ 10.000 | Carro R$ 13.000 | Apoio R$ 0
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Comissão s/ Excesso (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={percComissao}
                onChange={(e) => setPercComissao(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-amber-300 p-2.5 rounded-lg outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span>Colaborador Ativo na Base</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#1f293d] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg flex items-center gap-2"
            >
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Car, Shield, Check, Save } from 'lucide-react';
import { Operador } from '../types';
import { normalize } from '../utils/pdeCleaner';

interface ModalColaboradorProps {
  isOpen: boolean;
  onClose: () => void;
  operadorParaEditar?: Operador | null;
  onSalvar: (op: Operador, oldNomeNormalizado?: string) => Promise<void>;
  metasPadrao: {
    metaMoto: number;
    metaCarro: number;
    metaPedestre: number;
    percComissaoPadrao: number;
  };
}

const FUNCOES_SUGESTOES = [
  'Oficial de Corte / Cobrança',
  'Oficial de Supressão',
  'Encarregado de Equipe',
  'Técnico de Hidrometria',
  'Fiscal de Irregularidades',
  'Motorista',
  'Ajudante de Carro',
  'Operador Geral de Campo'
];

const FRENTES_DISPONIVEIS = [
  'Cobrança Leste',
  'Cobrança Alto Tietê',
  'Irregularidade',
  'Hidrometria e Aferição'
];

export const ModalColaborador: React.FC<ModalColaboradorProps> = ({
  isOpen,
  onClose,
  operadorParaEditar,
  onSalvar,
  metasPadrao
}) => {
  const [nome, setNome] = useState('');
  const [veiculo, setVeiculo] = useState<'Moto' | 'Carro' | 'Pedestre' | 'Ajudante de Carro' | string>('Moto');
  const [frente, setFrente] = useState('Cobrança Leste');
  const [funcao, setFuncao] = useState('Oficial de Corte / Cobrança');
  const [equipeNumero, setEquipeNumero] = useState('');
  const [meta, setMeta] = useState<number>(metasPadrao.metaMoto);
  const [percComissao, setPercComissao] = useState<number>(metasPadrao.percComissaoPadrao);
  const [ativo, setAtivo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erro, setErro] = useState('');

  const isEditing = Boolean(operadorParaEditar);

  useEffect(() => {
    if (operadorParaEditar) {
      setNome(operadorParaEditar.nome || '');
      setVeiculo(operadorParaEditar.veiculo || 'Moto');
      setFrente(operadorParaEditar.frente || 'Cobrança Leste');
      setFuncao(operadorParaEditar.funcao || 'Oficial de Corte / Cobrança');
      setEquipeNumero(operadorParaEditar.equipeNumero || '');
      setMeta(typeof operadorParaEditar.meta === 'number' ? operadorParaEditar.meta : metasPadrao.metaMoto);
      setPercComissao(typeof operadorParaEditar.percComissao === 'number' ? operadorParaEditar.percComissao : metasPadrao.percComissaoPadrao);
      setAtivo(operadorParaEditar.ativo !== false);
    } else {
      setNome('');
      setVeiculo('Moto');
      setFrente('Cobrança Leste');
      setFuncao('Oficial de Corte / Cobrança');
      setEquipeNumero('');
      setMeta(metasPadrao.metaMoto);
      setPercComissao(metasPadrao.percComissaoPadrao);
      setAtivo(true);
    }
    setErro('');
  }, [operadorParaEditar, isOpen, metasPadrao]);

  if (!isOpen) return null;

  const handleVeiculoChange = (newVeic: string) => {
    setVeiculo(newVeic);
    if (!isEditing) {
      if (newVeic === 'Moto') setMeta(metasPadrao.metaMoto);
      else if (newVeic === 'Carro') setMeta(metasPadrao.metaCarro);
      else setMeta(metasPadrao.metaPedestre);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro('Por favor, informe o nome completo do colaborador.');
      return;
    }

    const norm = normalize(nomeLimpo);
    const novoOp: Operador = {
      nome: nomeLimpo,
      nomeNormalizado: norm,
      veiculo,
      frente,
      funcao: funcao.trim() || 'Operador de Campo',
      equipeNumero: equipeNumero.trim() || undefined,
      meta: Number(meta) || 0,
      percComissao: Number(percComissao) || 0,
      ativo
    };

    try {
      setIsSubmitting(true);
      setErro('');
      await onSalvar(novoOp, operadorParaEditar ? operadorParaEditar.nomeNormalizado : undefined);
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setErro('Erro ao salvar colaborador: ' + (error.message || 'Falha no banco local'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {isEditing ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Atualize nome, função, frente ou modalidade da equipe'
                  : 'Preencha os dados operacionais para salvar no banco local'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {erro && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 font-semibold">
              {erro}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              Nome Completo do Colaborador *
            </label>
            <input
              type="text"
              placeholder="Ex: Carlos Eduardo de Oliveira"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-xl outline-none focus:border-blue-500 font-medium text-xs transition"
              autoFocus
            />
            {isEditing && operadorParaEditar?.nome !== nome && (
              <p className="text-[11px] text-amber-400 mt-1 font-medium">
                ⚠️ O nome será atualizado no banco local sem perder seu histórico.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Função / Cargo */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Função / Cargo
              </label>
              <input
                type="text"
                list="lista-funcoes"
                placeholder="Ex: Oficial de Corte / Cobrança"
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs transition"
              />
              <datalist id="lista-funcoes">
                {FUNCOES_SUGESTOES.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>

            {/* Número ou Código da Equipe */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Equipe / Identificador (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Equipe 104, Viatura 12"
                value={equipeNumero}
                onChange={(e) => setEquipeNumero(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Frente de Atuação / Equipe */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Frente Operacional / Equipe *
              </label>
              <select
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs transition"
              >
                {FRENTES_DISPONIVEIS.map((fr) => (
                  <option key={fr} value={fr}>
                    {fr}
                  </option>
                ))}
              </select>
            </div>

            {/* Modalidade / Veículo */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                Modalidade de Transporte *
              </label>
              <select
                value={veiculo}
                onChange={(e) => handleVeiculoChange(e.target.value)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs transition"
              >
                <option value="Moto">🏍️ Moto</option>
                <option value="Carro">🚗 Carro</option>
                <option value="Pedestre">🚶 Pedestre</option>
                <option value="Ajudante de Carro">🤝 Ajudante de Carro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meta Financeira Padrão */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Meta Financeira Diária (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={meta}
                onChange={(e) => setMeta(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-emerald-400 font-mono font-bold p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs transition"
              />
            </div>

            {/* Comissão */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">
                Comissão s/ Excesso (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={percComissao}
                onChange={(e) => setPercComissao(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#07090e] border border-[#1f293d] text-white font-mono p-2.5 rounded-xl outline-none focus:border-blue-500 text-xs transition"
              />
            </div>
          </div>

          {/* Status Ativo / Inativo */}
          <div className="pt-2 border-t border-[#1f293d] flex items-center justify-between">
            <div>
              <span className="text-white font-bold block">Status do Colaborador</span>
              <span className="text-[11px] text-slate-400">
                {ativo ? 'Colaborador operacionalmente ativo' : 'Colaborador inativo (afastado ou desligado)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition flex items-center gap-1.5 ${
                ativo
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border-red-500/40'
              }`}
            >
              {ativo ? <Check className="w-3.5 h-3.5" /> : null}
              {ativo ? 'Ativo na Equipe' : 'Inativo'}
            </button>
          </div>

          {/* Footer Buttons */}
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
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

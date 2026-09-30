import React, { useState } from 'react';
import { Usuario } from '../types';
import { X, UserPlus, Users, Trash2, KeyRound, Shield, Check, Mail, Lock } from 'lucide-react';

interface ModalGestaoUsuariosProps {
  usuarios: Usuario[];
  usuarioLogado: Usuario | null;
  onSalvarUsuario: (u: Usuario) => void;
  onExcluirUsuario: (id: string) => void;
  onClose: () => void;
}

export const ModalGestaoUsuarios: React.FC<ModalGestaoUsuariosProps> = ({
  usuarios,
  usuarioLogado,
  onSalvarUsuario,
  onExcluirUsuario,
  onClose
}) => {
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('123456');
  const [novoCargo, setNovoCargo] = useState<'SUPERVISOR' | 'CCO' | 'OPERADOR'>('OPERADOR');
  const [novaFrente, setNovaFrente] = useState('Cobrança Leste');
  const [formAberto, setFormAberto] = useState(false);

  const handleCriarUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoEmail.trim()) return;

    const novo: Usuario = {
      id: `user-${Date.now()}`,
      nome: novoNome.trim(),
      email: novoEmail.trim().toLowerCase(),
      senha: novaSenha.trim() || '123456',
      cargo: novoCargo,
      frente: novaFrente,
      ativo: true,
      criadoEm: new Date().toLocaleDateString('pt-BR')
    };

    onSalvarUsuario(novo);
    setNovoNome('');
    setNovoEmail('');
    setNovaSenha('123456');
    setFormAberto(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-[#1f293d] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#161f33] border-b border-[#1f293d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Gestão de Usuários & Controle de Acesso
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cadastre os e-mails e senhas de quem pode operar o painel para evitar alterações indevidas
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
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-xs">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-semibold">
              Usuários Autorizados no Painel ({usuarios.length})
            </span>
            <button
              onClick={() => setFormAberto(!formAberto)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              {formAberto ? 'Fechar Formulário' : 'Novo Usuário'}
            </button>
          </div>

          {/* Form Novo Usuário */}
          {formAberto && (
            <form
              onSubmit={handleCriarUsuario}
              className="bg-[#07090e] border border-blue-500/40 rounded-xl p-4 space-y-3 animate-fade-in"
            >
              <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Cadastrar Novo Colaborador no Painel
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full bg-[#0f1523] border border-[#1f293d] rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">E-mail de Login</label>
                  <input
                    type="email"
                    required
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="carlos@sabesp.com.br"
                    className="w-full bg-[#0f1523] border border-[#1f293d] rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Senha de Acesso / PIN</label>
                  <input
                    type="text"
                    required
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Senha de 6 dígitos"
                    className="w-full bg-[#0f1523] border border-[#1f293d] rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nível de Permissão (Cargo)</label>
                  <select
                    value={novoCargo}
                    onChange={(e) => setNovoCargo(e.target.value as 'SUPERVISOR' | 'CCO' | 'OPERADOR')}
                    className="w-full bg-[#0f1523] border border-[#1f293d] rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-500"
                  >
                    <option value="OPERADOR">Operador (Apenas Consulta)</option>
                    <option value="CCO">CCO (Visualizar e Copiar Reports)</option>
                    <option value="SUPERVISOR">Supervisor (Acesso Total & Cargas)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormAberto(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Usuário
                </button>
              </div>
            </form>
          )}

          {/* Lista de Usuários */}
          <div className="border border-[#1f293d] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#161f33] text-white border-b border-[#1f293d]">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Colaborador</th>
                  <th className="py-2.5 px-3 font-bold">E-mail</th>
                  <th className="py-2.5 px-3 font-bold">Cargo / Perfil</th>
                  <th className="py-2.5 px-3 font-bold">Senha Registrada</th>
                  <th className="py-2.5 px-3 font-bold text-center">Status</th>
                  <th className="py-2.5 px-3 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]/50">
                {usuarios.map((u) => {
                  const ehMaster = u.email === 'matheusf566@gmail.com';
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/20 transition">
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        👤 {u.nome}
                        {ehMaster && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black">
                            MASTER
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{u.email}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.cargo === 'SUPERVISOR'
                              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                              : u.cargo === 'CCO'
                              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.cargo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {u.senha ? '••••••' : 'Padrão (123456)'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.ativo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {u.ativo ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!ehMaster && (
                          <button
                            onClick={() => onExcluirUsuario(u.id)}
                            className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded transition"
                            title="Remover acesso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#161f33] border-t border-[#1f293d] px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Logado como: <strong className="text-white">{usuarioLogado?.nome || 'Supervisor'}</strong> (
            {usuarioLogado?.email})
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};

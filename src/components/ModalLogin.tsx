import React, { useState } from 'react';
import { Usuario } from '../types';
import { Lock, Mail, KeyRound, ShieldAlert, CheckCircle2, User } from 'lucide-react';

interface ModalLoginProps {
  usuarios: Usuario[];
  onLoginSucesso: (usuario: Usuario) => void;
  onClose?: () => void;
  podeFechar?: boolean;
}

export const ModalLogin: React.FC<ModalLoginProps> = ({
  usuarios,
  onLoginSucesso,
  onClose,
  podeFechar = false
}) => {
  const [email, setEmail] = useState('matheusf566@gmail.com');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const emailLimpo = email.trim().toLowerCase();
    const senhaLimpa = senha.trim();

    // Encontra usuário cadastrado
    const userFound = usuarios.find((u) => u.email.toLowerCase() === emailLimpo);

    if (!userFound) {
      // Se for o supervisor master padrão e ainda não houver banco
      if (emailLimpo === 'matheusf566@gmail.com') {
        const masterUser: Usuario = {
          id: 'user-master-matheus',
          email: 'matheusf566@gmail.com',
          nome: 'Matheus (Supervisor Master)',
          cargo: 'SUPERVISOR',
          frente: 'Cobrança Geral',
          ativo: true,
          criadoEm: new Date().toLocaleDateString('pt-BR')
        };
        onLoginSucesso(masterUser);
        return;
      }
      setErro('E-mail não autorizado no painel. Contate o Supervisor.');
      return;
    }

    if (!userFound.ativo) {
      setErro('Este usuário foi desativado pelo Supervisor.');
      return;
    }

    // Se o usuário tem senha cadastrada, valida
    if (userFound.senha && userFound.senha !== senhaLimpa) {
      setErro('Senha incorreta para este e-mail.');
      return;
    }

    onLoginSucesso(userFound);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f1523] border border-blue-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3 border border-blue-400/30">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-white">Torre de Controle Operacional</h2>
          <p className="text-xs text-slate-400 mt-1">
            Cobrança Alto Tietê & Leste • Controle de Acesso Restrito
          </p>
        </div>

        {erro && (
          <div className="mb-4 bg-red-500/15 border border-red-500/40 text-red-300 rounded-lg p-3 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              E-mail do Colaborador / Supervisor
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@sabesp.com.br"
                className="w-full bg-[#07090e] border border-[#1f293d] focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 font-semibold">Senha / PIN de Acesso</label>
              <span className="text-[10px] text-slate-500">Padrão inicial: 123456</span>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full bg-[#07090e] border border-[#1f293d] focus:border-blue-500 rounded-lg pl-9 pr-3 py-2 text-white outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 mt-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Autenticar e Entrar no Painel
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#1f293d] text-center text-[11px] text-slate-400">
          <span>Usuário Supervisor Padrão: </span>
          <strong className="text-blue-300">matheusf566@gmail.com</strong>
          <p className="text-[10px] text-slate-500 mt-1">
            Cada operador ou membro de CCO deve usar seu próprio e-mail para rastreabilidade de cargas.
          </p>
        </div>

        {podeFechar && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg text-xs transition"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};

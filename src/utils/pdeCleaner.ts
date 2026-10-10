import { PALAVRAS_INFRUTIFERAS, TABELA_DEPARA, TABELA_DEPARA_EDITAL, FERIADOS_SP, SERVICOS_COBRANCA, isServicoCobranca } from './dePara';
import { AgregacaoItem, HistoricoPDE } from '../types';

export { SERVICOS_COBRANCA, isServicoCobranca, TABELA_DEPARA_EDITAL };

/**
 * 🧹 HIGIENIZADOR MATEMÁTICO DE PDES
 * Remove espaços invisíveis, quebras de linha, pontos, traços e letras,
 * transformando qualquer entrada em um código numérico padronizado de 10 dígitos.
 */
export function cleanPDE(val: unknown): string {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  if (!str) return '';

  // Remove casas decimais .0 ou .00 provenientes de exportações numéricas do Excel
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2 && (parts[1] === '0' || parts[1] === '00' || parts[1] === '')) {
      str = parts[0];
    }
  }

  // Remove qualquer caractere que não seja dígito (0-9)
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  // Se tiver até 10 dígitos, faz o padStart para exatamente 10 caracteres
  if (digits.length <= 10) {
    return digits.padStart(10, '0');
  }

  // Se ultrapassar 10 dígitos, retorna os dígitos limpos
  return digits;
}

/**
 * Normaliza textos removendo acentos e convertendo para maiúsculo
 */
export function normalize(str: unknown): string {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Determina se um resultado é infrutífero
 * REGRA SABESP/ENORSUL:
 * - O resultado da negociação da TSS negociação via POS / PIX tem que ser pagamento efetivado via POS ou PIX.
 * - Negociação infrutífera conta como visita infrutífera.
 * - Para ser o serviço realmente executado para contabilizar para o colaborador, o resultado tem que ser pagamento efetivado via POS ou PIX.
 */
export function isInfrutifero(resultado: string, descricao: string = ''): boolean {
  const norm = normalize(resultado);
  if (!norm) return false;
  // Se for fim do dia ou baixa interna, não é considerado visita infrutífera ao imóvel
  if (isFimDoDiaOuBaixaInterna(resultado)) return false;

  // 1. Termo explícito de negociação infrutífera ou sem acordo (inclusive PIX)
  if (
    norm.includes('NEGOCIACAO INFRUTIFERA') ||
    norm.includes('NEGOCIACAO SEM ACORDO') ||
    norm.includes('NEGOCIACAO SEM SUCESSO') ||
    norm.includes('NEGOCIACAO NAO ACEITA') ||
    norm.includes('NEGOCIACAO RECUSADA') ||
    norm.includes('RECUSOU NEGOCIAR') ||
    norm.includes('SEM ACORDO NEGOCIACAO') ||
    norm.includes('PIX INFRUTIFER') ||
    norm.includes('PIX RECUSAD') ||
    norm.includes('PIX NAO ACEIT') ||
    norm.includes('PIX SEM SUCESSO')
  ) {
    return true;
  }

  // 2. Se a TSS for Negociação via POS / PIX:
  // Para ser serviço realmente executado e contabilizar para o colaborador,
  // o resultado TEM QUE SER pagamento efetivado via POS ou PIX.
  // Qualquer outro resultado nessa TSS conta como visita infrutífera!
  if (isTSSNegociacaoPOS(descricao)) {
    if (!isNegociacaoPOSEfetivada(resultado, descricao)) {
      return true;
    }
  }

  // 3. Se o próprio resultado indicar qualquer negociação ou menção a POS ou PIX (exceto reposição de piso),
  // e NÃO for pagamento efetivado via POS ou PIX, conta como visita infrutífera!
  const citaPOSouPIX = (norm.includes('POS') && !norm.includes('REPOSIC') && !norm.includes('REPOR')) || norm.includes('PIX');
  if ((norm.includes('NEGOCIAC') || citaPOSouPIX) && !isNegociacaoPOSEfetivada(resultado, descricao)) {
    return true;
  }

  // 4. Demais palavras-chave clássicas de infrutíferas (morador ausente, fechado, recusa, faturas pagas, etc.)
  return PALAVRAS_INFRUTIFERAS.some((k) => norm.includes(normalize(k)));
}

/**
 * Identifica se a TSS ou Descrição de Serviço é Negociação de Débitos via POS ou PIX
 */
export function isTSSNegociacaoPOS(descricao: string): boolean {
  if (!descricao) return false;
  const norm = normalize(descricao);
  // Não confundir com Reposição de Piso
  if (norm.includes('REPOSIC') || norm.includes('REPOR')) return false;
  return (
    norm.includes('NEGOCIAC') ||
    norm.includes('VIA POS') ||
    norm.includes('NO POS') ||
    norm.includes('VIA PIX') ||
    norm.includes('NO PIX') ||
    (norm.includes('DEBITO') && (norm.includes('POS') || norm.includes('PIX'))) ||
    (/\bPOS\b/.test(norm)) ||
    (/\bPIX\b/.test(norm))
  );
}

/**
 * Identifica se a ocorrência é "Fim do Dia" ou Baixa Interna administrativa (NÃO é visita)
 */
export function isFimDoDiaOuBaixaInterna(resultado: string): boolean {
  const norm = normalize(resultado);
  if (!norm) return false;
  return (
    norm.includes('FIM DO DIA') ||
    norm.includes('FIM DE DIA') ||
    norm.includes('FINAL DO DIA') ||
    norm.includes('FINAL DE DIA') ||
    norm.includes('FIM DE JORNADA') ||
    norm.includes('FIM DA JORNADA') ||
    norm.includes('FINAL DE JORNADA') ||
    norm.includes('TERMINO DO DIA') ||
    norm.includes('TERMINO DE JORNADA') ||
    norm.includes('FIM TURNO') ||
    norm.includes('FIM DO TURNO') ||
    norm.includes('FIM DE TURNO') ||
    norm.includes('FINAL DE TURNO') ||
    norm.includes('ENCERRAMENTO DE TURNO') ||
    norm.includes('ENCERRAMENTO DO DIA') ||
    norm.includes('BAIXA INTERNA') ||
    norm.includes('FECHAMENTO DE DIA') ||
    norm.includes('RETORNO DE ROTA') ||
    norm.includes('RETORNO ROTA') ||
    norm.includes('SEM VISITA')
  );
}

/**
 * Identifica se a ordem de serviço é um Corte ou Supressão
 */
export function isCorteOuSupressao(descricaoOuResultado: string): boolean {
  const norm = normalize(descricaoOuResultado);
  if (!norm) return false;
  return (
    norm.includes('CORTE') ||
    norm.includes('CORTAR') ||
    norm.includes('CORTADA') ||
    norm.includes('SUPRESS') ||
    norm.includes('SUPRIM')
  );
}

/**
 * Identifica se é estritamente um Corte executado
 */
export function isCorteEfetivo(resultado: string): boolean {
  const norm = normalize(resultado);
  if (!norm) return false;
  if (norm.includes('POS') || norm.includes('NEGOCIAC') || norm.includes('INFRUTIFER')) return false;
  return norm.includes('CORTADA') || norm.includes('CORTE') || norm.includes('CORTAR') || norm.includes('CORRIGIDO CORTE');
}

/**
 * Identifica se é estritamente uma Supressão executada
 */
export function isSupressaoEfetiva(resultado: string): boolean {
  const norm = normalize(resultado);
  if (!norm) return false;
  if (norm.includes('POS') || norm.includes('NEGOCIAC') || norm.includes('INFRUTIFER')) return false;
  return norm.includes('SUPRIMIDA') || norm.includes('SUPRESSAO') || norm.includes('SUPRIMIR') || norm.includes('CORRIGIDA SUPRESSAO');
}

/**
 * Identifica se é estritamente um Restabelecimento executado
 */
export function isRestabelecimentoEfetivo(resultado: string, descricao: string = ''): boolean {
  const normRes = normalize(resultado);
  const normDesc = normalize(descricao);
  if (!normRes && !normDesc) return false;
  if (
    normRes.includes('INFRUTIFER') ||
    normRes.includes('RECUS') ||
    normRes.includes('AUSENT') ||
    normRes.includes('FECHAD') ||
    normRes.includes('POS') ||
    normRes.includes('PIX') ||
    normRes.includes('CORTE') ||
    normRes.includes('CORTADA') ||
    normRes.includes('SUPRIM')
  ) {
    return false;
  }

  const temTermoRestab = normRes.includes('RESTAB') || normDesc.includes('RESTAB');
  if (!temTermoRestab) return false;

  return (
    normRes.includes('RESTABELEC') ||
    normRes.includes('RESTAB') ||
    normRes.includes('EXECUTADO EM CONFORMIDADE') ||
    normRes.includes('CONFORME') ||
    normRes.includes('REGULARIZAD')
  );
}

/**
 * Identifica se é estritamente uma Religação executada
 */
export function isReligacaoEfetiva(resultado: string, descricao: string = ''): boolean {
  const normRes = normalize(resultado);
  const normDesc = normalize(descricao);
  if (!normRes && !normDesc) return false;
  if (
    normRes.includes('INFRUTIFER') ||
    normRes.includes('RECUS') ||
    normRes.includes('AUSENT') ||
    normRes.includes('FECHAD') ||
    normRes.includes('POS') ||
    normRes.includes('PIX') ||
    normRes.includes('CORTE') ||
    normRes.includes('CORTADA') ||
    normRes.includes('SUPRIM')
  ) {
    return false;
  }

  const temTermoRelig = normRes.includes('RELIG') || normDesc.includes('RELIG');
  if (!temTermoRelig) return false;

  return (
    normRes.includes('RELIGAC') ||
    normRes.includes('RELIGADA') ||
    normRes.includes('RELIG') ||
    normRes.includes('EXECUTADO EM CONFORMIDADE') ||
    normRes.includes('CONFORME') ||
    normRes.includes('REGULARIZAD')
  );
}

/**
 * RESTABELECIMENTO E RELIGAÇÃO É UM SÓ (OPERACIONAL SABESP/ENORSUL):
 * Identifica se a ordem executada foi Restabelecimento ou Religação de Água
 */
export function isRestabelecimentoOuReligacao(resultado: string, descricao: string = ''): boolean {
  return isRestabelecimentoEfetivo(resultado, descricao) || isReligacaoEfetiva(resultado, descricao);
}

/**
 * REGRA OFICIAL DE PDE VICIADO (SABESP / ENORSUL):
 * Um imóvel é considerado PDE Viciado quando:
 * 1. Teve MAIS DE 3 VISITAS REAIS (> 3, ou seja, 4 ou mais);
 * 2. Teve MAIS DE 1 ORDEM DE SERVIÇO (OS) DISTINTA gerada pela Sabesp (> 1);
 * 3. 100% das baixas de 'Fim do Dia' ou baixas internas são expurgadas!
 */
export function isPDEViciado(item: HistoricoPDE): boolean {
  if (!item) return false;
  const visitas = Array.isArray(item.historicoDetalhado) ? item.historicoDetalhado : [];
  
  // Expurga 100% de 'Fim do Dia' ou baixas administrativas
  const visitasReais = visitas.filter((v) => !v.isFimDoDia && !isFimDoDiaOuBaixaInterna(v.resultado));
  const totalVisitasReais = visitasReais.length > 0 ? visitasReais.length : (item.totalVisitas || 0);

  // Mapeia todas as OSs distintas
  const osSet = new Set<string>();
  if (item.os && item.os.trim()) osSet.add(item.os.trim());
  visitasReais.forEach((v) => {
    if (v.os && v.os.trim()) osSet.add(v.os.trim());
  });

  return totalVisitasReais > 3 && osSet.size > 1;
}

/**
 * Converte qualquer string de data brasileira (DD/MM/YYYY) ou ISO (YYYY-MM-DD) para Date confiável
 */
export function parseDateString(str: string): Date | null {
  if (!str) return null;
  const s = str.trim();
  if (s.includes('/')) {
    const parts = s.split(' ')[0].split('/');
    if (parts.length === 3) {
      const dia = parseInt(parts[0], 10);
      const mes = parseInt(parts[1], 10) - 1;
      let ano = parseInt(parts[2], 10);
      if (ano < 100) ano += 2000;
      const d = new Date(ano, mes, dia);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  if (s.includes('-')) {
    const parts = s.split('T')[0].split('-');
    if (parts.length === 3) {
      const ano = parseInt(parts[0], 10);
      const mes = parseInt(parts[1], 10) - 1;
      const dia = parseInt(parts[2], 10);
      const d = new Date(ano, mes, dia);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/**
 * Identifica se a negociação via POS ou PIX foi REALMENTE EXECUTADA com pagamento efetivado.
 * REGRA SABESP/ENORSUL: Para ser o serviço realmente executado e contabilizar para o colaborador,
 * o resultado TEM QUE SER "PAGAMENTO EFETIVADO VIA POS" ou "PAGAMENTO EFETIVADO VIA PIX".
 * Qualquer negociação sem pagamento ou infrutífera conta como visita infrutífera!
 */
export function isNegociacaoPOSEfetivada(resultado: string, descricao: string = ''): boolean {
  const normRes = normalize(resultado);
  if (!normRes) return false;

  // Se tiver termo infrutífero, recusa, insucesso ou impedimento, NUNCA é pagamento efetivado
  if (
    normRes.includes('INFRUTIFER') ||
    normRes.includes('RECUS') ||
    normRes.includes('NAO ACEIT') ||
    normRes.includes('NAO PERMIT') ||
    normRes.includes('SEM ACORDO') ||
    normRes.includes('SEM SUCESSO') ||
    normRes.includes('INSUCESSO') ||
    normRes.includes('NAO QUITAD') ||
    normRes.includes('NAO PAGO') ||
    normRes.includes('NAO EFETIVAD') ||
    normRes.includes('NAO EFETUAD') ||
    normRes.includes('CANCELAD') ||
    normRes.includes('IMPED') ||
    normRes.includes('FECHAD') ||
    normRes.includes('AUSENT')
  ) {
    return false;
  }

  // 1. Pagamento Efetivado via PIX
  const ehPixEfetivado =
    normRes.includes('VIA PIX') ||
    normRes.includes('NO PIX') ||
    normRes.includes('PGTO PIX') ||
    normRes.includes('PAGAMENTO PIX') ||
    normRes.includes('PAGTO VIA PIX') ||
    normRes.includes('PAGAMENTO VIA PIX') ||
    normRes.includes('CLIENTE EFETUOU PGTO VIA PIX') ||
    normRes.includes('PAGAMENTO EFETIVADO VIA PIX') ||
    normRes.includes('PAGAMENTO EFETUADO VIA PIX') ||
    normRes.includes('PAGO VIA PIX') ||
    normRes.includes('RECEBIDO VIA PIX') ||
    normRes.includes('QUITADO VIA PIX') ||
    (normRes.includes('PIX') && (normRes.includes('EFETIV') || normRes.includes('EFETU') || normRes.includes('PAGO') || normRes.includes('QUIT') || normRes.includes('RECEB')));

  if (ehPixEfetivado) return true;

  // 2. Pagamento Efetivado via POS
  return (
    normRes.includes('PAGAMENTO EFETIVADO VIA POS') ||
    normRes.includes('PAGAMENTO EFETIVADO NO POS') ||
    normRes.includes('PAGAMENTO EFETIVADO') ||
    normRes.includes('PAGAMENTO EFETUADO VIA POS') ||
    normRes.includes('PAGAMENTO EFETUADO NO POS') ||
    normRes.includes('PAGAMENTO EFETUADO') ||
    normRes.includes('CLIENTE EFETUOU PGTO VIA POS') ||
    normRes.includes('PAGTO EFETIVADO VIA POS') ||
    normRes.includes('PAGTO EFETIVADO NO POS') ||
    normRes.includes('PAGTO EFETIVADO') ||
    normRes.includes('PAGTO EFETUADO VIA POS') ||
    normRes.includes('PAGTO EFETUADO NO POS') ||
    normRes.includes('PAGTO EFETUADO') ||
    normRes.includes('EFETIVADO VIA POS') ||
    normRes.includes('EFETUADO VIA POS') ||
    normRes.includes('PAGAMENTO REALIZADO VIA POS') ||
    normRes.includes('PAGAMENTO REALIZADO') ||
    normRes.includes('PAGO VIA POS') ||
    normRes.includes('RECEBIDO VIA POS') ||
    normRes.includes('QUITADO VIA POS') ||
    normRes.includes('QUITACAO VIA POS') ||
    normRes.includes('RECEBIMENTO VIA POS') ||
    normRes.includes('POS/PIX') ||
    (normRes.includes('EFETIVAD') && normRes.includes('POS')) ||
    (normRes.includes('EFETUAD') && normRes.includes('POS')) ||
    (normRes.includes('PAGO') && normRes.includes('POS')) ||
    (normRes.includes('QUITAD') && normRes.includes('POS')) ||
    (normRes.includes('RECEBID') && normRes.includes('POS')) ||
    (normRes.includes('PAGAMENTO') && normRes.includes('POS'))
  );
}

/**
 * Mantém retrocompatibilidade: aponta estritamente para a regra de pagamento efetivado
 */
export function isNegociacaoPOS(resultado: string, descricao: string = ''): boolean {
  return isNegociacaoPOSEfetivada(resultado, descricao);
}

/**
 * Identifica se é Reposição de Piso / Asfalto / Passeio / Concreto
 */
export function isReposicaoPiso(resultado: string, descricao: string = ''): boolean {
  const normRes = normalize(resultado);
  const normDesc = normalize(descricao);
  return (
    normRes.includes('REPOSIC') ||
    normRes.includes('REPOR') ||
    normRes.includes('PISO') ||
    normDesc.includes('REPOR BLOQUETE') ||
    normDesc.includes('REPOR CONCRETO') ||
    normDesc.includes('REPOR PASSEIO') ||
    normDesc.includes('REPOR PISO') ||
    normDesc.includes('REPOSICAO')
  );
}

/**
 * Identifica se o cliente apresentou faturas pagas no ato da visita
 */
export function isFaturaPagaApresentada(resultado: string): boolean {
  const norm = normalize(resultado);
  return (
    norm.includes('FATURAS PAGAS') ||
    norm.includes('FATURA PAGA') ||
    norm.includes('APRESENTOU COMPROVANTE') ||
    norm.includes('APRESENTOU FATURA')
  );
}

/**
 * Formata data e hora do vencimento de forma humanizada para WhatsApp
 * Exemplo: "Hoje às 16:30" ou "29/09 às 14:00"
 */
export function formatDataHoraVencimento(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return '-';
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const horaMin = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const ehHoje = d.toDateString() === hoje.toDateString();
  const ehAmanha = d.toDateString() === amanha.toDateString();

  if (ehHoje) {
    return `Hoje às ${horaMin}`;
  }
  if (ehAmanha) {
    return `Amanhã às ${horaMin}`;
  }
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes} às ${horaMin}`;
}

/**
 * Determina o motivo padronizado da falha infrutífera
 */
export function categorizarMotivoInfrutifero(resultado: string, descricao: string = ''): string {
  const norm = normalize(resultado);
  if (
    norm.includes('NEGOCIAC') ||
    norm.includes('SEM ACORDO') ||
    norm.includes('NAO ACEIT') ||
    norm.includes('SEM SUCESSO') ||
    (isTSSNegociacaoPOS(descricao) && !isNegociacaoPOSEfetivada(resultado, descricao)) ||
    ((norm.includes('POS') && !norm.includes('REPOSIC')) && !isNegociacaoPOSEfetivada(resultado, descricao))
  ) {
    return 'Negociação Infrutífera';
  }
  if (norm.includes('AUSENTE')) return 'Morador Ausente';
  if (norm.includes('FECHADO') || norm.includes('TRANCADO')) return 'Imóvel Fechado';
  if (norm.includes('PERMITIU') || norm.includes('RECUS')) return 'Não Permitiu / Recusado';
  if (norm.includes('IMPEDIMENTO') || norm.includes('OBSTACULO') || norm.includes('CAO')) return 'Impedimento no Local';
  if (norm.includes('NADA CONSTA')) return 'Nada Consta';
  if (norm.includes('FATURAS PAGAS')) return 'Faturas Pagas';
  if (norm.includes('NAO LOCALIZADO') || norm.includes('ACESSO')) return 'Não Localizado / Difícil Acesso';
  if (norm.includes('CANCELAD')) return 'Cancelado / Outros';
  return resultado.trim() || 'Infrutífera Geral';
}

/**
 * Calcula o valor financeiro do serviço segundo o DE-PARA Oficial do Edital 3.5
 * REGRAS SABESP / ENORSUL:
 * - O resultado da negociação da TSS negociação via POS / PIX tem que ser pagamento efetivado via POS ou PIX (R$ 44,28).
 * - Negociação infrutífera conta como visita infrutífera (valor zero).
 * - Apresentação de faturas pagas exige validação da Sabesp e da Diretoria para medição (R$ 0 na medição direta).
 */
export function calcularValorServico(resultado: string, descricao: string = ''): number {
  const norm = normalize(resultado);
  if (!norm) return 0;

  // Se for infrutífero, valor é zero
  if (isInfrutifero(resultado, descricao)) return 0;

  // Cliente apresentou faturas pagas: conforme regra contratual do Edital 3.5,
  // exige validação formal da Sabesp e da Diretoria para compor a medição. Fica segregado em auditoria!
  if (norm.includes('FATURAS PAGAS') || norm.includes('FATURA PAGA') || norm.includes('APRESENTOU COMPROVANTE')) {
    return 0;
  }

  // Se for TSS Negociação via POS / PIX, SÓ remunera se for pagamento efetivado via POS ou PIX
  if (isTSSNegociacaoPOS(descricao) && !isNegociacaoPOSEfetivada(resultado, descricao)) {
    return 0;
  }

  // Se o resultado citar POS, PIX ou NEGOCIAÇÃO, SÓ gera valor financeiro se for pagamento efetivado!
  const citaPOSouPIX = (norm.includes('POS') && !norm.includes('REPOSIC') && !norm.includes('REPOR')) || norm.includes('PIX');
  if ((norm.includes('NEGOCIAC') || citaPOSouPIX) && !isNegociacaoPOSEfetivada(resultado, descricao)) {
    return 0;
  }

  // Se for pagamento efetivado via POS ou PIX, remunera exatamente R$ 44,28
  if (isNegociacaoPOSEfetivada(resultado, descricao)) {
    return 44.28;
  }

  const ehRamal = norm.includes('RAMAL');

  // 1. Busca por correspondência exata na TABELA_DEPARA_EDITAL
  for (const item of TABELA_DEPARA_EDITAL) {
    const itemNorm = normalize(item.resultado);
    if (norm === itemNorm) {
      if (item.requerValidacaoDiretoria) return 0;
      if (ehRamal && item.tipo === 'ramal') return item.preco;
      if (!ehRamal && item.tipo !== 'ramal') return item.preco;
    }
  }

  // 2. Busca por contenção na TABELA_DEPARA_EDITAL
  for (const item of TABELA_DEPARA_EDITAL) {
    const itemNorm = normalize(item.resultado);
    if (norm.includes(itemNorm)) {
      if (item.requerValidacaoDiretoria) return 0;
      if (ehRamal && item.tipo === 'ramal') return item.preco;
      if (!ehRamal && item.tipo !== 'ramal') return item.preco;
    }
  }

  // 3. Fallback na TABELA_DEPARA padrão
  for (const item of TABELA_DEPARA) {
    if (norm.includes(normalize(item.res))) {
      if ((item.res === 'POS' || item.res === 'PIX') && !isNegociacaoPOSEfetivada(resultado, descricao)) {
        continue;
      }
      if (item.ambiguo && ehRamal && item.precoRamal) {
        return item.precoRamal;
      }
      return item.preco;
    }
  }
  return 0;
}

/**
 * Inferência da Frente Operacional (SABESP / ENORSUL):
 * - Município São Paulo: Cobrança Leste
 * - A única exceção que mesmo em análise regional pertence à Cobrança Leste é o Itaim Paulista
 * - Tudo que for diferente de São Paulo (ex: Suzano, Poá, Mogi das Cruzes, Ferraz, Itaquaquecetuba, etc.) é Cobrança Alto Tietê
 */
export function inferirFrente(descricao: string, municipio = '', bairro = ''): string {
  const m = normalize(municipio);
  const b = normalize(bairro);
  const d = normalize(descricao);

  // A ÚNICA EXCEÇÃO: Itaim Paulista pertence à Cobrança Leste
  if (m.includes('ITAIM') || b.includes('ITAIM') || d.includes('ITAIM')) {
    return 'Cobrança Leste';
  }

  // Município São Paulo -> Cobrança Leste
  if (m.includes('SAO PAULO') || m === 'SP' || m.includes('S.PAULO') || m.includes('CAPITAL')) {
    return 'Cobrança Leste';
  }

  // Tudo que for município diferente de São Paulo (Suzano, Poá, Mogi, Ferraz, Itaquá, etc.) -> Cobrança Alto Tietê
  if (m && !m.includes('SAO PAULO')) {
    return 'Cobrança Alto Tietê';
  }

  // Caso município não tenha vindo preenchido, verificar se a descrição ou bairro remete ao Alto Tietê
  if (
    d.includes('ALTO') || d.includes('TIETE') || d.includes('MOGI') || d.includes('SUZANO') ||
    d.includes('POA') || d.includes('ITAQUA') || d.includes('FERRAZ') || d.includes('ARUJA') ||
    b.includes('MOGI') || b.includes('SUZANO') || b.includes('POA') || b.includes('ITAQUA') || b.includes('FERRAZ')
  ) {
    return 'Cobrança Alto Tietê';
  }

  return 'Cobrança Leste';
}

/**
 * Converte datas do Excel (número de dias desde 1900 ou strings DD/MM/YYYY) para objeto Date
 */
export function parseExcelDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;

  if (typeof val === 'number') {
    // Excel serial date format
    return new Date(Math.round((val - 25569) * 86400 * 1000));
  }

  const str = String(val).trim();
  if (!str) return new Date();

  // Formato brasileiro DD/MM/YYYY HH:mm ou DD/MM/YYYY
  if (str.includes('/')) {
    const parts = str.split(' ');
    const dp = parts[0].split('/');
    if (dp.length === 3) {
      const dia = parseInt(dp[0], 10);
      const mes = parseInt(dp[1], 10) - 1;
      let ano = parseInt(dp[2], 10);
      if (ano < 100) ano += 2000;

      let hora = 8;
      let minuto = 0;
      if (parts[1]) {
        const tp = parts[1].split(':');
        hora = parseInt(tp[0] || '8', 10);
        minuto = parseInt(tp[1] || '0', 10);
      }
      const d = new Date(ano, mes, dia, hora, minuto);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Adiciona dias úteis pulando finais de semana e feriados
 */
export function adicionarDiasUteis(dataBase: Date, diasUteis: number): Date {
  const result = new Date(dataBase.getTime());
  let diasAdicionados = 0;

  while (diasAdicionados < diasUteis) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    const isoDate = result.toISOString().split('T')[0];

    // 0 = Domingo, 6 = Sábado
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !FERIADOS_SP.includes(isoDate)) {
      diasAdicionados++;
    }
  }
  return result;
}

/**
 * ⏱️ CALCULADORA DE SLA (PRAZO FATAL)
 * Regras Oficiais:
 * - Urgência sem custo / corte indevido: +6 horas (0.25 dias)
 * - Religação / Restabelecimento: +2 dias corridos/úteis
 * - Reposição de Piso / Concreto / Passeio: +3 dias
 */
export function calcularPrazoFatal(
  descricao: string,
  dtCompetencia: Date
): {
  vencReal: Date;
  tipoUrgencia: 'RESTABELECIMENTO' | 'RELIGACAO' | 'PISO' | 'OUTRO_CRITICO';
  isUrgencia: boolean;
  isCobranca?: boolean;
} {
  const norm = normalize(descricao);
  const base = new Date(dtCompetencia.getTime());
  const cobranca = isServicoCobranca(descricao);

  // 1. Restabelecimentos e Religações
  const isRestab = norm.includes('RESTAB') || norm.includes('RELIG');
  const isPiso = norm.includes('PISO') || norm.includes('PASSEIO') || norm.includes('CONCRETO') || norm.includes('REPOR');
  const isVistoria = norm.includes('VISTORIA');
  const isCorte = norm.includes('CORTE') || norm.includes('CORTAR') || norm.includes('SUPRESS') || norm.includes('SUPRIM');

  if (norm.includes('URGENCIA SEM CUSTO') || norm.includes('CORTE INDEVIDO') || norm.includes('SUPRESSAO INDEVIDA')) {
    const v = new Date(base.getTime());
    v.setHours(v.getHours() + 6);
    return { vencReal: v, tipoUrgencia: 'RESTABELECIMENTO', isUrgencia: true, isCobranca: true };
  }

  if (isRestab) {
    const v = new Date(base.getTime());
    v.setDate(v.getDate() + 2);
    const tipo = norm.includes('RELIG') ? 'RELIGACAO' : 'RESTABELECIMENTO';
    return { vencReal: v, tipoUrgencia: tipo, isUrgencia: true, isCobranca: true };
  }

  if (isPiso) {
    const v = new Date(base.getTime());
    v.setDate(v.getDate() + 3); // 3 dias oficiais conforme especificação
    return { vencReal: v, tipoUrgencia: 'PISO', isUrgencia: true, isCobranca: true };
  }

  // Vistoria de Cobrança (SLA de 5 dias úteis)
  if (isVistoria && cobranca) {
    const v = adicionarDiasUteis(base, 5);
    return { vencReal: v, tipoUrgencia: 'OUTRO_CRITICO', isUrgencia: false, isCobranca: true };
  }

  // Corte ou Supressão regular (SLA de 10 dias úteis)
  if (isCorte) {
    const v = adicionarDiasUteis(base, 10);
    return { vencReal: v, tipoUrgencia: 'OUTRO_CRITICO', isUrgencia: false, isCobranca: true };
  }

  // Carteira regular
  const v = adicionarDiasUteis(base, 15);
  return { vencReal: v, tipoUrgencia: 'OUTRO_CRITICO', isUrgencia: false, isCobranca: cobranca };
}

/**
 * Formata valores monetários em BRL (R$ 1.234,56)
 */
export function formatMoney(val: number): string {
  return (val || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata data no formato DD/MM/YYYY HH:mm
 */
export function formatDataHora(d: Date): string {
  if (!d || isNaN(d.getTime())) return '-';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
}

/**
 * Formata data abreviada DD/MM/YYYY
 */
export function formatDataAbrev(d: Date): string {
  if (!d || isNaN(d.getTime())) return '-';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Converte string DD/MM/AAAA para objeto Date
 */
export function parseDataBrasileira(dataStr: string): Date | null {
  if (!dataStr || typeof dataStr !== 'string') return null;
  const parts = dataStr.trim().split('/');
  if (parts.length !== 3) return null;
  const dia = parseInt(parts[0], 10);
  const mes = parseInt(parts[1], 10) - 1;
  const ano = parseInt(parts[2], 10);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  const d = new Date(ano, mes, dia, 12, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Agrupa lista de datas DD/MM/AAAA em blocos semanais (Segunda a Domingo)
 */
export function agruparDatasPorSemana(datas: string[]): AgregacaoItem[] {
  const mapaSemanas = new Map<string, { rotulo: string; datas: Set<string>; inicioMs: number }>();

  datas.forEach((dataStr) => {
    const d = parseDataBrasileira(dataStr);
    if (!d) return;

    // Calcular Segunda-feira da semana
    const dayOfWeek = d.getDay(); // 0 Dom, 1 Seg, ..., 6 Sab
    const diffToSeg = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const seg = new Date(d);
    seg.setDate(d.getDate() + diffToSeg);
    seg.setHours(0, 0, 0, 0);

    const dom = new Date(seg);
    dom.setDate(seg.getDate() + 6);
    dom.setHours(23, 59, 59, 999);

    const chave = `SEM-${seg.getFullYear()}-${String(seg.getMonth() + 1).padStart(2, '0')}-${String(seg.getDate()).padStart(2, '0')}`;
    const rotulo = `Semana ${String(seg.getDate()).padStart(2, '0')}/${String(seg.getMonth() + 1).padStart(2, '0')} a ${String(dom.getDate()).padStart(2, '0')}/${String(dom.getMonth() + 1).padStart(2, '0')}`;

    if (!mapaSemanas.has(chave)) {
      mapaSemanas.set(chave, { rotulo, datas: new Set(), inicioMs: seg.getTime() });
    }
    mapaSemanas.get(chave)!.datas.add(dataStr);
  });

  return Array.from(mapaSemanas.entries())
    .map(([id, val]) => ({
      id,
      rotulo: val.rotulo,
      datasContidas: Array.from(val.datas).sort((a, b) => {
        const da = parseDataBrasileira(a)?.getTime() || 0;
        const db = parseDataBrasileira(b)?.getTime() || 0;
        return da - db;
      }),
      inicioMs: val.inicioMs
    }))
    .sort((a, b) => b.inicioMs - a.inicioMs)
    .map(({ id, rotulo, datasContidas }) => ({ id, rotulo, datasContidas }));
}

/**
 * Agrupa lista de datas DD/MM/AAAA por mês
 */
export function agruparDatasPorMes(datas: string[]): AgregacaoItem[] {
  const mapaMeses = new Map<string, { rotulo: string; datas: Set<string>; ano: number; mes: number }>();

  datas.forEach((dataStr) => {
    const d = parseDataBrasileira(dataStr);
    if (!d) return;
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const chave = `MES-${ano}-${String(mes + 1).padStart(2, '0')}`;
    const rotulo = `${NOMES_MESES[mes]}/${ano}`;

    if (!mapaMeses.has(chave)) {
      mapaMeses.set(chave, { rotulo, datas: new Set(), ano, mes });
    }
    mapaMeses.get(chave)!.datas.add(dataStr);
  });

  return Array.from(mapaMeses.entries())
    .map(([id, val]) => ({
      id,
      rotulo: val.rotulo,
      datasContidas: Array.from(val.datas).sort((a, b) => {
        const da = parseDataBrasileira(a)?.getTime() || 0;
        const db = parseDataBrasileira(b)?.getTime() || 0;
        return da - db;
      }),
      ordem: val.ano * 100 + val.mes
    }))
    .sort((a, b) => b.ordem - a.ordem)
    .map(({ id, rotulo, datasContidas }) => ({ id, rotulo, datasContidas }));
}

/**
 * Formata o tempo restante para o cronômetro do SLA
 */
export function formatTempoRestante(vencimento: Date, now: Date = new Date()): {
  texto: string;
  horasRestantes: number;
  status: 'VENCIDA' | 'CRITICA' | 'AMANHA' | 'NO_PRAZO';
} {
  const diffMs = vencimento.getTime() - now.getTime();
  const horasRestantes = diffMs / (1000 * 60 * 60);

  // Comparação por Data do Calendário Civil (conforme regra de operação Sabesp)
  const dHoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dVenc = new Date(vencimento.getFullYear(), vencimento.getMonth(), vencimento.getDate());
  const diffDiasCivis = Math.round((dVenc.getTime() - dHoje.getTime()) / (1000 * 60 * 60 * 24));

  let status: 'VENCIDA' | 'CRITICA' | 'AMANHA' | 'NO_PRAZO' = 'NO_PRAZO';

  if (diffDiasCivis < 0) {
    status = 'VENCIDA'; // Passivo anterior
  } else if (diffDiasCivis === 0) {
    status = 'CRITICA'; // Vence Hoje (dia civil atual, ex: 28)
  } else if (diffDiasCivis === 1 || diffDiasCivis === 2) {
    status = 'AMANHA'; // Vence nos próximos 2 dias civis seguintes (ex: 29 e 30)
  } else {
    status = 'NO_PRAZO'; // Vence após os 2 dias estipulados (D+3 em diante)
  }

  if (diffMs < 0) {
    const absMs = Math.abs(diffMs);
    const dias = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const horas = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

    let str = 'Vencido há ';
    if (dias > 0) str += `${dias}d `;
    str += `${horas}h ${minutos}m`;

    return { texto: str, horasRestantes, status };
  }

  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let str = 'Faltam ';
  if (dias > 0) str += `${dias}d `;
  str += `${horas}h ${minutos}m`;

  return { texto: str, horasRestantes, status };
}

/**
 * Validador inteligente para arquivos inseridos no Motor 1 (Execuções)
 */
export function validarArquivoExecucao(colunas: string[]): { valido: boolean; motivo?: string } {
  const colunasNorm = colunas.map(normalize);
  const temResultado = colunasNorm.some(
    (c) => c.includes('RESULTADO') || c.includes('OCORRENCIA') || c.includes('STATUS') || c.includes('EXECUCAO')
  );

  // Se o arquivo tiver colunas típicas exclusivas de carteira (sem nenhum resultado)
  const parecePendencia =
    colunasNorm.some((c) => c.includes('TSS PENDENTE') || c.includes('DATA INSERCAO')) && !temResultado;

  if (parecePendencia) {
    return {
      valido: false,
      motivo:
        'Este arquivo parece ser uma Carteira de Pendências (não possui coluna de Resultado/Ocorrência). O Motor 1 aceita APENAS o Relatório de Execuções Concluídas!'
    };
  }

  return { valido: true };
}

/**
 * Validador inteligente para arquivos inseridos no Motor 2 (Pendências)
 */
export function validarArquivoPendencia(colunas: string[]): { valido: boolean; motivo?: string } {
  const colunasNorm = colunas.map(normalize);

  // Se o arquivo tiver colunas com resultado de execução (ex: "FIM EXECUCAO", "RESULTADO")
  const temResultado = colunasNorm.some((c) => c === 'RESULTADO' || c.includes('RESULTADO DA VISITA'));

  if (temResultado) {
    return {
      valido: false,
      motivo:
        'Este arquivo parece ser um Relatório de Execuções (possui coluna de Resultado). O Motor 2 aceita APENAS a Carteira de Pendências atualizada para triagem!'
    };
  }

  return { valido: true };
}

/**
 * Extrai valor flexível buscando em várias possíveis colunas do Excel
 */
export function getValFromRow(row: Record<string, unknown>, candidateKeys: string[]): unknown {
  if (!row) return '';
  for (const k of candidateKeys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }

  // Tenta busca case-insensitive
  const rowKeys = Object.keys(row);
  for (const cand of candidateKeys) {
    const candNorm = normalize(cand);
    const foundKey = rowKeys.find((rk) => normalize(rk) === candNorm || normalize(rk).includes(candNorm));
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return row[foundKey];
    }
  }
  return '';
}

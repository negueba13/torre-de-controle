export interface DeParaRegra {
  res: string;
  preco: number;
  precoRamal?: number;
  ambiguo?: boolean;
}

export const TABELA_DEPARA: DeParaRegra[] = [
  { res: 'ABERTO BOLETIM DE OCORRENCIA BO', preco: 395.75 },
  { res: 'AFERIDO HIDROMETRO', preco: 209.85 },
  { res: 'IRREGULARIDADE PROCEDENTE', preco: 115.0 },
  { res: 'ANOMALIA NA MEDICAO', preco: 115.0 },
  { res: 'TROCA DE HIDROMETRO', preco: 65.81 },
  { res: 'RELIGACAO', preco: 47.72, ambiguo: true, precoRamal: 143.42 },
  { res: 'RESTABELEC', preco: 47.72, ambiguo: true, precoRamal: 143.42 },
  { res: 'EXECUTADO EM CONFORMIDADE', preco: 47.72, ambiguo: true, precoRamal: 143.42 },
  { res: 'CORTADA', preco: 29.52, ambiguo: true, precoRamal: 120.62 },
  { res: 'SUPRIMIDA', preco: 29.52, ambiguo: true, precoRamal: 120.62 },
  { res: 'CORRIGIDA SUPRESSAO', preco: 29.52, ambiguo: true, precoRamal: 120.62 },
  { res: 'REPOSICAO', preco: 32.02 },
  { res: 'CORRIGIDO CORTE', preco: 10.75, ambiguo: true, precoRamal: 120.62 },
  { res: 'POS', preco: 44.28 },
  { res: 'ENTREGUE COMUNICADO', preco: 4.85 },
  { res: 'VERIFICADA PERDAS', preco: 15.02 },
  { res: 'IRREGULARIDADE NAO DETECTADA', preco: 33.97 },
  { res: 'CONFIRMADO INDICIO', preco: 14.78 },
  { res: 'NAO CONFIRMADO INDICIO DE ANORMALIDADE', preco: 14.78 },
  // Visitas infrutíferas sem remuneração direta
  { res: 'FATURAS PAGAS', preco: 0.0 }
];

/**
 * Lista oficial de Serviços Exclusivos da Frente de Cobrança Sabesp
 */
export const SERVICOS_COBRANCA: string[] = [
  'CORRIGIR CORTE',
  'CORRIGIR SUPRESSAO',
  'CORRIGIR SUPRESSÃO',
  'CORTAR LIGACAO DE AGUA POR DEBITO',
  'CORTAR LIGAÇÃO DE ÁGUA POR DEBITO',
  'CORTAR LIGACAO POR DEBITO',
  'CORTAR LIGAÇÃO POR DEBITO',
  'NEGOCIACAO DE DEBITOS VIA POS',
  'NEGOCIAÇÃO DE DÉBITOS VIA POS',
  'NEGOCIACAO POS',
  'NEGOCIAÇÃO POS',
  'RELIGAR AGUA DEB',
  'RELIGAR ÁGUA DEB',
  'RELIGAR AGUA POR SUPRESSAO INDEVIDA',
  'RELIGAR ÁGUA POR SUPRESSÃO INDEVIDA',
  'REPOR BLOQUETE COB',
  'REPOR CONCRETO COB',
  'REPOR PASSEIO ADJACENTE CIMENTADO COB',
  'REPOR PASSEIO ADJACENTE ESPECIAL COB',
  'REPOR PASSEIO OPOSTO CIMENTADO COB',
  'REPOR PASSEIO OPOSTO ESPECIAL COB',
  'REPOR PISO INTERNO CIMENTADO COB',
  'REPOR PISO INTERNO ESPECIAL COB',
  'RESTABELECER LIGACAO',
  'RESTABELECER LIGAÇÃO',
  'RESTABELECER LIGACAO POR CORTE INDEVIDO',
  'RESTABELECER LIGAÇÃO POR CORTE INDEVIDO',
  'RESTABELECER LIGACAO URGENCIA',
  'RESTABELECER LIGAÇÃO URGENCIA',
  'RESTABELECER LIGACAO URGENCIA SEM CUSTO',
  'RESTABELECER LIGAÇÃO URGENCIA SEM CUSTO',
  'SUPRIMIR LIGACAO DE AGUA POR DEBITO',
  'SUPRIMIR LIGAÇÃO DE ÁGUA POR DEBITO',
  'SUPRIMIR LIGACAO POR DEBITO',
  'SUPRIMIR LIGAÇÃO POR DEBITO',
  'VISTORIA DA RELIGACAO DA COBRANCA',
  'VISTORIA DA RELIGAÇÃO DA COBRANÇA',
  'VISTORIA DO CORTE DA COBRANCA',
  'VISTORIA DO CORTE DA COBRANÇA',
  'VISTORIA DO RESTABELECIMENTO DA COBRANCA',
  'VISTORIA DO RESTABELECIMENTO DA COBRANÇA',
  'VISTORIA DO SUPRESSAO DA COBRANCA',
  'VISTORIA DO SUPRESSÃO DA COBRANÇA',
  'VISTORIA DA SUPRESSAO DA COBRANCA',
  'VISTORIA DA SUPRESSÃO DA COBRANÇA'
];

/**
 * Identifica se uma descrição de serviço ou TSS pertence à Cobrança
 */
export function isServicoCobranca(descricao: string): boolean {
  if (!descricao) return false;
  const norm = descricao
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

  // Verifica na lista exata ou por correspondência direta
  const matchExato = SERVICOS_COBRANCA.some((s) => {
    const sNorm = s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();
    return norm.includes(sNorm) || sNorm.includes(norm);
  });

  if (matchExato) return true;

  // Palavras-chave nucleares da frente de cobrança
  if (norm.includes('CORTE') || norm.includes('CORTAR') || norm.includes('CORTADA')) return true;
  if (norm.includes('SUPRESSAO') || norm.includes('SUPRIMIR') || norm.includes('SUPRIMIDA')) return true;
  if (norm.includes('POS') || norm.includes('NEGOCIACAO')) return true;
  if (norm.includes('RESTAB') || norm.includes('RELIG')) return true;
  if (norm.includes('COB') || norm.includes('COBRANCA')) return true;

  return false;
}

export const PALAVRAS_INFRUTIFERAS = [
  'AUSENTE',
  'MORADOR AUSENTE',
  'NAO PERMITIU',
  'NAO ATENDIDO',
  'IMPEDIMENTO',
  'FECHADO',
  'IMOVEL FECHADO',
  'PORTAO TRANCADO',
  'NADA CONSTA',
  'FATURAS PAGAS',
  'NAO LOCALIZADO',
  'DIFICIL ACESSO',
  'CANCELAD',
  'CLIENTE RECUSOU',
  'RECUSADO',
  'CAO BRAVO',
  'OBSTACULO'
];

export const FERIADOS_SP: string[] = [
  '2026-01-01',
  '2026-01-25', // Aniversário SP
  '2026-02-17', // Carnaval
  '2026-04-03', // Paixão de Cristo
  '2026-04-21', // Tiradentes
  '2026-05-01', // Trabalho
  '2026-06-04', // Corpus Christi
  '2026-07-09', // Revolução Constitucionalista
  '2026-09-07', // Independência
  '2026-10-12', // Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-11-20', // Consciência Negra
  '2026-12-25'  // Natal
];

export const METAS_PADRAO = {
  metaMoto: 12739.31,
  metaCarro: 20550.49,
  metaPedestre: 6883.45,
  metaAjudante: 6883.45,
  percComissaoPadrao: 10
};

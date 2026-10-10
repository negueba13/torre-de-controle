export interface DeParaRegra {
  res: string;
  preco: number;
  precoRamal?: number;
  ambiguo?: boolean;
}

export interface DeParaItemOficial {
  resultado: string;
  tipo?: string;
  unificado: string;
  itemEdital: string;
  preco: number;
  requerValidacaoDiretoria?: boolean;
  observacao?: string;
}

/**
 * 3.5 TABELA OFICIAL DE DE → PARA DO EDITAL CONTRATUAL SABESP / ENORSUL
 * Parametrização integral com todos os serviços, unificados, itens do edital e preços oficiais
 */
export const TABELA_DEPARA_EDITAL: DeParaItemOficial[] = [
  {
    resultado: 'aberto boletim de ocorrência (bo)',
    tipo: '',
    unificado: 'aberto boletim de ocorrência (bo)-',
    itemEdital: 'abertura de b.o.',
    preco: 395.75
  },
  {
    resultado: 'corrigido corte',
    tipo: '',
    unificado: 'corrigido corte-',
    itemEdital: 'adc corte em verificação lig clandestina',
    preco: 10.75
  },
  {
    resultado: 'corrigido corte',
    tipo: 'ramal',
    unificado: 'corrigido corte-ramal',
    itemEdital: 'supr ramal ag s/rep sf',
    preco: 120.62
  },
  {
    resultado: 'suprimida ligação de agua irreg',
    tipo: 'ramal',
    unificado: 'suprimida ligação de agua irreg-ramal',
    itemEdital: 'adic supr ramal ag s/ rep sf',
    preco: 73.46
  },
  {
    resultado: 'cortada ligação de agua por debito',
    tipo: '',
    unificado: 'cortada ligação de agua por debito-',
    itemEdital: 'supr cv',
    preco: 29.52
  },
  {
    resultado: 'cortada ligação de agua por debito',
    tipo: 'ramal',
    unificado: 'cortada ligação de agua por debito-ramal',
    itemEdital: 'supr ramal ag s/rep sf',
    preco: 120.62
  },
  {
    resultado: 'aferido hidrometro no local',
    tipo: '',
    unificado: 'aferido hidrometro no local-',
    itemEdital: 'aferição hidrômetro in loco (até 5m³/h)',
    preco: 209.85
  },
  {
    resultado: 'entregue comunicado',
    tipo: '',
    unificado: 'entregue comunicado-',
    itemEdital: 'entrega de aviso ou notificacao',
    preco: 4.85
  },
  {
    resultado: 'irregularidade procedente c/ident suj pf',
    tipo: '',
    unificado: 'irregularidade procedente c/ident suj pf-',
    itemEdital: 'inspeção detec irreg com sucesso',
    preco: 115.00
  },
  {
    resultado: 'irregularidade procedente s/ident sujeit',
    tipo: '',
    unificado: 'irregularidade procedente s/ident sujeit-',
    itemEdital: 'inspeção detec irreg com sucesso',
    preco: 115.00
  },
  {
    resultado: 'anomalia na medição procedente',
    tipo: '',
    unificado: 'anomalia na medição procedente-',
    itemEdital: 'inspeção detec irreg com sucesso',
    preco: 115.00
  },
  {
    resultado: 'confirmado uso de fonte alternativa',
    tipo: '',
    unificado: 'confirmado uso de fonte alternativa-',
    itemEdital: 'inspeção detec irreg com sucesso',
    preco: 115.00
  },
  {
    resultado: 'irregularidade não detectada',
    tipo: '',
    unificado: 'irregularidade não detectada-',
    itemEdital: 'inspeção detec irreg sem sucesso',
    preco: 33.97
  },
  {
    resultado: 'reposição de concreto irreg',
    tipo: '',
    unificado: 'reposição de concreto irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pá cimentado',
    tipo: '',
    unificado: 'reposição de pá cimentado-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pa cimentado irreg',
    tipo: '',
    unificado: 'reposição de pa cimentado irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de paralelo irreg',
    tipo: '',
    unificado: 'reposição de paralelo irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pi cimentado irreg',
    tipo: '',
    unificado: 'reposição de pi cimentado irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pó cimentado irreg',
    tipo: '',
    unificado: 'reposição de pó cimentado irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pa especial irreg',
    tipo: '',
    unificado: 'reposição de pa especial irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 33.02
  },
  {
    resultado: 'reposição de po cimentado irreg',
    tipo: '',
    unificado: 'reposição de po cimentado irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'não confirmado indício de anormalidade',
    tipo: '',
    unificado: 'não confirmado indício de anormalidade-',
    itemEdital: 'pre-inspeção caracteriz de consumo irreg',
    preco: 14.78
  },
  {
    resultado: 'confirmado indício de anormalidade',
    tipo: '',
    unificado: 'confirmado indício de anormalidade-',
    itemEdital: 'pre-inspeção caracteriz de consumo irreg',
    preco: 14.78
  },
  {
    resultado: 'preservado local diurno',
    tipo: '',
    unificado: 'preservado local diurno-',
    itemEdital: 'preservacao do local - diurno',
    preco: 54.85
  },
  {
    resultado: 'preservado local diurno e noturno',
    tipo: '',
    unificado: 'preservado local diurno e noturno-',
    itemEdital: 'preservacao do local - noturno',
    preco: 72.20
  },
  {
    resultado: 'religação de agua deb',
    tipo: '',
    unificado: 'religação de agua deb-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'religação de agua deb',
    tipo: 'ramal',
    unificado: 'religação de agua deb-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'religação de agua por supressão indevida',
    tipo: '',
    unificado: 'religação de agua por supressão indevida-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'religação de agua por supressão indevida',
    tipo: 'ramal',
    unificado: 'religação de agua por supressão indevida-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'religação de agua impedimento de leitura',
    tipo: '',
    unificado: 'religação de agua impedimento de leitura-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'religação de agua impedimento de leitura',
    tipo: 'ramal',
    unificado: 'religação de agua impedimento de leitura-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'restabelecida lig agua por corte indev',
    tipo: '',
    unificado: 'restabelecida lig agua por corte indev-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'restabelecida lig agua por corte indev',
    tipo: 'ramal',
    unificado: 'restabelecida lig agua por corte indev-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'religação de água irreg',
    tipo: '',
    unificado: 'religação de água irreg-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'religação de água irreg',
    tipo: 'ramal',
    unificado: 'religação de água irreg-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'executado em conformidade',
    tipo: '',
    unificado: 'executado em conformidade-',
    itemEdital: 'relig cv ag / supr cv',
    preco: 47.72
  },
  {
    resultado: 'executado em conformidade',
    tipo: 'ramal',
    unificado: 'executado em conformidade-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'restabelecida ligação de agua',
    tipo: '',
    unificado: 'restabelecida ligação de agua-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'restabelecida ligação de agua',
    tipo: 'ramal',
    unificado: 'restabelecida ligação de agua-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'corrigida supressão',
    tipo: '',
    unificado: 'corrigida supressão-',
    itemEdital: 'supr cv',
    preco: 29.52
  },
  {
    resultado: 'corrigida supressão',
    tipo: 'ramal',
    unificado: 'corrigida supressão-ramal',
    itemEdital: 'supr ramal ag s/rep sf',
    preco: 120.62
  },
  {
    resultado: 'ressuprimida lig de água pde livre irre',
    tipo: '',
    unificado: 'ressuprimida lig de água pde livre irre-',
    itemEdital: 'supr cv',
    preco: 29.52
  },
  {
    resultado: 'ressuprimida lig de água pde livre irre',
    tipo: 'ramal',
    unificado: 'ressuprimida lig de água pde livre irre-ramal',
    itemEdital: 'supr ramal ag s/rep sf',
    preco: 120.62
  },
  {
    resultado: 'suprimida lig agua impedimento leitura',
    tipo: '',
    unificado: 'suprimida lig agua impedimento leitura-',
    itemEdital: 'supr cv',
    preco: 29.52
  },
  {
    resultado: 'suprimida lig agua impedimento leitura',
    tipo: 'ramal',
    unificado: 'suprimida lig agua impedimento leitura-ramal',
    itemEdital: 'supr ramal ag s/rep sf',
    preco: 120.62
  },
  {
    resultado: 'suprimida ligação de agua irreg',
    tipo: '',
    unificado: 'suprimida ligação de agua irreg-',
    itemEdital: 'supr cv',
    preco: 29.52
  },
  {
    resultado: 'suprimida ligação de agua por debito',
    tipo: '',
    unificado: 'suprimida ligação de agua por debito-',
    itemEdital: 'supr cv',
    preco: 29.52
  },
  {
    resultado: 'suprimida ligação de agua por debito',
    tipo: 'ramal',
    unificado: 'suprimida ligação de agua por debito-ramal',
    itemEdital: 'supr ramal ag s/rep sf',
    preco: 120.62
  },
  {
    resultado: 'troca de hidro prev para eletronico',
    tipo: '',
    unificado: 'troca de hidro prev para eletronico-',
    itemEdital: 'thd ate 10m3/h prev',
    preco: 58.13
  },
  {
    resultado: 'troca de hidrometro preventiva',
    tipo: '',
    unificado: 'troca de hidrometro preventiva-',
    itemEdital: 'thd ate 10m3/h prev',
    preco: 58.13
  },
  {
    resultado: 'troca de hidrometro irreg',
    tipo: '',
    unificado: 'troca de hidrometro irreg-',
    itemEdital: 'thd ate 10m3/h corr',
    preco: 65.81
  },
  {
    resultado: 'troca de hidrometro embaçado md',
    tipo: '',
    unificado: 'troca de hidrometro embaçado md-',
    itemEdital: 'thd ate 10m3/h corr',
    preco: 65.81
  },
  {
    resultado: 'troca de hidrometro quebrado md',
    tipo: '',
    unificado: 'troca de hidrometro quebrado md-',
    itemEdital: 'thd ate 10m3/h corr',
    preco: 65.81
  },
  {
    resultado: 'religação de agua deb urgencia',
    tipo: '',
    unificado: 'religação de agua deb urgencia-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'reposição de pa cimentado cob',
    tipo: '',
    unificado: 'reposição de pa cimentado cob-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pa especial',
    tipo: '',
    unificado: 'reposição de pa especial-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'religação de agua deb com serviços adic',
    tipo: '',
    unificado: 'religação de agua deb com serviços adic-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'reposição de pa cimentado',
    tipo: '',
    unificado: 'reposição de pa cimentado-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de po cimentado',
    tipo: '',
    unificado: 'reposição de po cimentado-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pa especial cob',
    tipo: '',
    unificado: 'reposição de pa especial cob-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de asfalto irreg',
    tipo: '',
    unificado: 'reposição de asfalto irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'restabelecida lig agua urgencia s/custo',
    tipo: '',
    unificado: 'restabelecida lig agua urgencia s/custo-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'restabelecida lig agua urgencia s/custo',
    tipo: 'ramal',
    unificado: 'restabelecida lig agua urgencia s/custo-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'reposição de po cimentado cob',
    tipo: '',
    unificado: 'reposição de po cimentado cob-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'reposição de pi especial irreg',
    tipo: '',
    unificado: 'reposição de pi especial irreg-',
    itemEdital: 'lrp cim supr religacao de ligacao',
    preco: 32.02
  },
  {
    resultado: 'religação de agua deb urgencia sem custo',
    tipo: '',
    unificado: 'religação de agua deb urgencia sem custo-',
    itemEdital: 'relig cv ag',
    preco: 47.72
  },
  {
    resultado: 'religação de agua deb urgencia sem custo',
    tipo: 'ramal',
    unificado: 'religação de agua deb urgencia sem custo-ramal',
    itemEdital: 'relig ramal ag s/ rep',
    preco: 143.42
  },
  {
    resultado: 'verificada perdas leitura',
    tipo: '',
    unificado: 'verificada perdas leitura-',
    itemEdital: 'verif. coleta dados comerc c/sucesso',
    preco: 15.02
  },
  {
    resultado: 'verificada perdas lig água',
    tipo: '',
    unificado: 'verificada perdas lig água-',
    itemEdital: 'verif. coleta dados comerc c/sucesso',
    preco: 15.02
  },
  {
    resultado: 'verificada perdas lig esgoto',
    tipo: '',
    unificado: 'verificada perdas lig esgoto-',
    itemEdital: 'verif. coleta dados comerc c/sucesso',
    preco: 15.02
  },
  {
    resultado: 'cliente efetuou pgto via pos',
    tipo: '',
    unificado: 'cliente efetuou pgto via pos-',
    itemEdital: 'visita produtiva c/efet de pagto - pos',
    preco: 44.28
  },
  {
    resultado: 'pagamento efetivado via pos',
    tipo: '',
    unificado: 'pagamento efetivado via pos-',
    itemEdital: 'visita produtiva c/efet de pagto - pos',
    preco: 44.28
  },
  {
    resultado: 'cliente efetuou pgto via pix',
    tipo: '',
    unificado: 'cliente efetuou pgto via pix-',
    itemEdital: 'visita produtiva c/efet de pagto - pos/pix',
    preco: 44.28,
    observacao: 'Regra PIX homologada Sabesp/Enorsul'
  },
  {
    resultado: 'pagamento efetivado via pix',
    tipo: '',
    unificado: 'pagamento efetivado via pix-',
    itemEdital: 'visita produtiva c/efet de pagto - pos/pix',
    preco: 44.28,
    observacao: 'Regra PIX homologada Sabesp/Enorsul'
  },
  {
    resultado: 'cliente apresentou as faturas pagas',
    tipo: '',
    unificado: 'cliente apresentou as faturas pagas-',
    itemEdital: 'cliente apresentou as faturas pagas',
    preco: 0.00,
    requerValidacaoDiretoria: true,
    observacao: 'Exige validação formal da Sabesp e da Diretoria para medição; mantido em auditoria segregada'
  }
];

export const TABELA_DEPARA: DeParaRegra[] = [
  { res: 'ABERTO BOLETIM DE OCORRENCIA BO', preco: 395.75 },
  { res: 'AFERIDO HIDROMETRO', preco: 209.85 },
  { res: 'IRREGULARIDADE PROCEDENTE', preco: 115.0 },
  { res: 'ANOMALIA NA MEDICAO', preco: 115.0 },
  { res: 'CONFIRMADO USO DE FONTE ALTERNATIVA', preco: 115.0 },
  { res: 'TROCA DE HIDRO PREV PARA ELETRONICO', preco: 58.13 },
  { res: 'TROCA DE HIDROMETRO PREVENTIVA', preco: 58.13 },
  { res: 'TROCA DE HIDROMETRO', preco: 65.81 },
  { res: 'PRESERVADO LOCAL DIURNO E NOTURNO', preco: 72.20 },
  { res: 'PRESERVADO LOCAL DIURNO', preco: 54.85 },
  { res: 'RELIGACAO', preco: 47.72, ambiguo: true, precoRamal: 143.42 },
  { res: 'RESTABELEC', preco: 47.72, ambiguo: true, precoRamal: 143.42 },
  { res: 'EXECUTADO EM CONFORMIDADE', preco: 47.72, ambiguo: true, precoRamal: 143.42 },
  { res: 'CORTADA', preco: 29.52, ambiguo: true, precoRamal: 120.62 },
  { res: 'SUPRIMIDA LIGACAO DE AGUA IRREG', preco: 29.52, ambiguo: true, precoRamal: 73.46 },
  { res: 'SUPRIMIDA', preco: 29.52, ambiguo: true, precoRamal: 120.62 },
  { res: 'CORRIGIDA SUPRESSAO', preco: 29.52, ambiguo: true, precoRamal: 120.62 },
  { res: 'REPOSICAO DE PA ESPECIAL IRREG', preco: 33.02 },
  { res: 'REPOSICAO', preco: 32.02 },
  { res: 'CORRIGIDO CORTE', preco: 10.75, ambiguo: true, precoRamal: 120.62 },
  { res: 'POS', preco: 44.28 },
  { res: 'PIX', preco: 44.28 },
  { res: 'ENTREGUE COMUNICADO', preco: 4.85 },
  { res: 'VERIFICADA PERDAS', preco: 15.02 },
  { res: 'IRREGULARIDADE NAO DETECTADA', preco: 33.97 },
  { res: 'CONFIRMADO INDICIO', preco: 14.78 },
  { res: 'NAO CONFIRMADO INDICIO DE ANORMALIDADE', preco: 14.78 },
  // Visitas com faturas pagas apresentadas: requerem validação diretoria/Sabesp
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
  'NEGOCIACAO INFRUTIFERA',
  'NEGOCIAÇÃO INFRUTÍFERA',
  'INFRUTIFERA',
  'INFRUTIFERO',
  'INFRUTIFER',
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

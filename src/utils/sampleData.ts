import { Operador } from '../types';

export const EQUIPE_DEMO: Operador[] = [
  {
    nome: 'Joãozinho Silva',
    nomeNormalizado: 'JOAOZINHO SILVA',
    veiculo: 'Moto',
    frente: 'Cobrança Leste',
    meta: 12739.31,
    percComissao: 10,
    ativo: true
  },
  {
    nome: 'Pedrinho Santos',
    nomeNormalizado: 'PEDRINHO SANTOS',
    veiculo: 'Moto',
    frente: 'Cobrança Leste',
    meta: 12739.31,
    percComissao: 10,
    ativo: true
  },
  {
    nome: 'Carlos Oliveira',
    nomeNormalizado: 'CARLOS OLIVEIRA',
    veiculo: 'Carro',
    frente: 'Cobrança Alto Tietê',
    meta: 20550.49,
    percComissao: 10,
    ativo: true
  },
  {
    nome: 'Marcos Almeida',
    nomeNormalizado: 'MARCOS ALMEIDA',
    veiculo: 'Moto',
    frente: 'Cobrança Alto Tietê',
    meta: 12739.31,
    percComissao: 10,
    ativo: true
  },
  {
    nome: 'Renato Souza',
    nomeNormalizado: 'RENATO SOUZA',
    veiculo: 'Pedestre',
    frente: 'Cobrança Leste',
    meta: 6883.45,
    percComissao: 10,
    ativo: true
  }
];

export const EXECUCOES_DEMO = [
  {
    'Número OS': 'OS-90001',
    'PDE': '0000000010',
    'Descrição TSS': 'CORTE DE LIGAÇÃO DE ÁGUA',
    'Resultado': 'CORTADA LIGAÇÃO DE ÁGUA',
    'Equipe': 'Joãozinho Silva',
    'Data': '23/09/2026',
    'Data de Competência': '22/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Itaquera'
  },
  {
    'Número OS': 'OS-90002',
    'PDE': '0000000020',
    'Descrição TSS': 'CORTE DE LIGAÇÃO DE ÁGUA',
    'Resultado': 'MORADOR AUSENTE',
    'Equipe': 'Pedrinho Santos',
    'Data': '24/09/2026',
    'Data de Competência': '23/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'São Mateus'
  },
  {
    'Número OS': 'OS-90003',
    'PDE': ' 0000000020 ', // Com espaço invisível - 2ª visita!
    'Descrição TSS': 'CORTE DE LIGAÇÃO DE ÁGUA',
    'Resultado': 'IMÓVEL FECHADO',
    'Equipe': 'Pedrinho Santos',
    'Data': '25/09/2026',
    'Data de Competência': '24/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'São Mateus'
  },
  {
    'Número OS': 'OS-90004',
    'PDE': '1234567', // Menos de 10 dígitos para testar padStart
    'Descrição TSS': 'RELIGAR ÁGUA',
    'Resultado': 'RELIGACAO',
    'Equipe': 'Joãozinho Silva',
    'Data': '25/09/2026',
    'Data de Competência': '24/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Guaianases'
  },
  {
    'Número OS': 'OS-90005',
    'PDE': '0000000050',
    'Descrição TSS': 'CORTE DE LIGAÇÃO DE ÁGUA',
    'Resultado': 'NAO PERMITIU',
    'Equipe': 'Pedrinho Santos',
    'Data': '26/09/2026',
    'Data de Competência': '25/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Itaquera'
  },
  {
    'Número OS': 'OS-90005B',
    'PDE': '0000000050', // 2ª visita ao mesmo PDE!
    'Descrição TSS': 'CORTE DE LIGAÇÃO DE ÁGUA',
    'Resultado': 'MORADOR AUSENTE',
    'Equipe': 'Joãozinho Silva',
    'Data': '27/09/2026',
    'Data de Competência': '26/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Itaquera'
  },
  {
    'Número OS': 'OS-90006',
    'PDE': '0000000060',
    'Descrição TSS': 'CORTE DE LIGAÇÃO DE ÁGUA',
    'Resultado': 'CORTADA',
    'Equipe': 'Carlos Oliveira',
    'Data': '26/09/2026',
    'Data de Competência': '25/09/2026',
    'Município': 'Mogi das Cruzes',
    'Bairro': 'Centro'
  },
  {
    'Número OS': 'OS-90007',
    'PDE': '0000000070',
    'Descrição TSS': 'RESTABELECER LIGAÇÃO',
    'Resultado': 'RESTABELEC RAMAL',
    'Equipe': 'Carlos Oliveira',
    'Data': '27/09/2026',
    'Data de Competência': '26/09/2026',
    'Município': 'Suzano',
    'Bairro': 'Vila Amorim'
  },
  {
    'Número OS': 'OS-90008',
    'PDE': '0000000080',
    'Descrição TSS': 'CORTE DE LIGAÇÃO',
    'Resultado': 'MORADOR AUSENTE',
    'Equipe': 'Marcos Almeida',
    'Data': '27/09/2026',
    'Data de Competência': '26/09/2026',
    'Município': 'Itaquaquecetuba',
    'Bairro': 'Manoel Feio'
  },
  {
    'Número OS': 'OS-90009',
    'PDE': '0000000150',
    'Descrição TSS': 'RELIGAR ÁGUA',
    'Resultado': 'RELIGACAO',
    'Equipe': 'Renato Souza',
    'Data': '27/09/2026',
    'Data de Competência': '26/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Penha'
  },
  {
    'Número OS': 'OS-90010',
    'PDE': '0000000160',
    'Descrição TSS': 'REPOSIÇÃO DE PISO',
    'Resultado': 'REPOSICAO',
    'Equipe': 'Carlos Oliveira',
    'Data': '27/09/2026',
    'Data de Competência': '25/09/2026',
    'Município': 'Mogi das Cruzes',
    'Bairro': 'Braz Cubas'
  }
];

export const PENDENCIAS_DEMO = [
  {
    'Número OS': 'OS-10001',
    'PDE': '0000000010', // PDE com corte executado anteriormente
    'Descrição TSS': 'SUPRIMIR LIGAÇÃO DE ÁGUA',
    'Data de Competência': '26/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Itaquera',
    'Equipe': 'Joãozinho Silva'
  },
  {
    'Número OS': 'OS-10002',
    'PDE': '0000000030', // Limpo, serviço urgente de piso
    'Descrição TSS': 'REPOR PASSEIO ADJACENTE',
    'Data de Competência': '24/09/2026', // Vence em 3 dias -> 27/09 (HOJE!)
    'Município': 'São Paulo - Leste',
    'Bairro': 'São Mateus',
    'Equipe': 'Joãozinho Silva'
  },
  {
    'Número OS': 'OS-10003',
    'PDE': ' 0000000020 ', // Teve 2 falhas na execução -> Bloqueio Anti-Retrabalho!
    'Descrição TSS': 'RELIGAR ÁGUA DEB',
    'Data de Competência': '26/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'São Mateus',
    'Equipe': 'Pedrinho Santos'
  },
  {
    'Número OS': 'OS-10003B',
    'PDE': '0000000050', // Teve 2 falhas na execução (Nao permitiu + Ausente) -> Bloqueio Retrabalho!
    'Descrição TSS': 'CORTAR ÁGUA CAVALETE',
    'Data de Competência': '27/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Itaquera',
    'Equipe': 'Pedrinho Santos'
  },
  {
    'Número OS': 'OS-10004',
    'PDE': '0000000040', // Urgência Restabelecimento / Religação - Vence Hoje!
    'Descrição TSS': 'RELIGAR ÁGUA DEB',
    'Data de Competência': '25/09/2026', // 2 dias -> 27/09 (HOJE!)
    'Município': 'Mogi das Cruzes',
    'Bairro': 'Jundiapeba',
    'Equipe': 'Carlos Oliveira'
  },
  {
    'Número OS': 'OS-10005',
    'PDE': '0000000040', // Duplicidade na própria carteira! (Sabesp mandou 2x hoje)
    'Descrição TSS': 'RELIGAR ÁGUA DEB',
    'Data de Competência': '25/09/2026',
    'Município': 'Mogi das Cruzes',
    'Bairro': 'Jundiapeba',
    'Equipe': 'Carlos Oliveira'
  },
  {
    'Número OS': 'OS-10006',
    'PDE': '0000000090',
    'Descrição TSS': 'RESTABELECER LIGAÇÃO URGENCIA SEM CUSTO', // Prazo fatal 6 horas (HOJE!)
    'Data de Competência': '27/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'Penha',
    'Equipe': 'Renato Souza'
  },
  {
    'Número OS': 'OS-10007',
    'PDE': '0000000120', // Urgência Religação - VENCE AMANHÃ! (Competência 26/09 + 2 dias = 28/09)
    'Descrição TSS': 'RELIGAR ÁGUA DEB',
    'Data de Competência': '26/09/2026',
    'Município': 'São Paulo - Leste',
    'Bairro': 'São Miguel Paulista',
    'Equipe': 'Joãozinho Silva'
  },
  {
    'Número OS': 'OS-10008',
    'PDE': '0000000130', // Urgência Piso - VENCE AMANHÃ! (Competência 25/09 + 3 dias = 28/09)
    'Descrição TSS': 'REPOSIÇÃO DE PISO CONCRETO',
    'Data de Competência': '25/09/2026',
    'Município': 'Mogi das Cruzes',
    'Bairro': 'Vila Oliveira',
    'Equipe': 'Marcos Almeida'
  },
  {
    'Número OS': 'OS-10009',
    'PDE': '0000000140', // Urgência VENCIDA (Passivo Crítico)
    'Descrição TSS': 'RESTABELECER LIGAÇÃO',
    'Data de Competência': '23/09/2026', // 23 + 2 = 25/09 (Passivo Vencido!)
    'Município': 'Suzano',
    'Bairro': 'Palmeiras',
    'Equipe': 'Carlos Oliveira'
  },
  {
    'Número OS': 'OS-10010',
    'PDE': '0000000100',
    'Descrição TSS': 'CORTAR LIGAÇÃO DE ÁGUA', // Carteira livre
    'Data de Competência': '26/09/2026',
    'Município': 'Suzano',
    'Bairro': 'Jardim Imperador',
    'Equipe': 'Marcos Almeida'
  }
];

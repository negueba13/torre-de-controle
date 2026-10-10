import * as XLSX from 'xlsx';

type ExcelKind = 'pendencias' | 'execucoes' | 'generic';

interface ParseExcelMessage {
  buffer: ArrayBuffer;
  kind: ExcelKind;
}

function normalizeSheetName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

self.onmessage = (event: MessageEvent<ParseExcelMessage>) => {
  try {
    const { buffer, kind } = event.data;
    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: 'array',
      cellDates: true
    });
    const matchingSheet = workbook.SheetNames.find((name) => {
      const normalized = normalizeSheetName(name);
      if (kind === 'pendencias') return normalized.includes('OS') || normalized.includes('PEND');
      if (kind === 'execucoes') return normalized.includes('EXEC') || normalized.includes('PROD');
      return false;
    });
    const sheetName = matchingSheet || workbook.SheetNames[0];

    if (!sheetName || !workbook.Sheets[sheetName]) {
      throw new Error('A planilha não contém nenhuma aba para leitura.');
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: ''
    });
    self.postMessage({ rows, sheetName });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : 'Erro desconhecido ao ler a planilha.'
    });
  }
};

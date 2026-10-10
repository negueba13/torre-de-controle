export type ExcelImportKind = 'pendencias' | 'execucoes' | 'generic';

export interface ExcelRowsResult {
  rows: Record<string, unknown>[];
  sheetName: string;
}

interface ExcelWorkerResponse {
  rows?: Record<string, unknown>[];
  sheetName?: string;
  error?: string;
}

export function readExcelInWorker(file: File, kind: ExcelImportKind): Promise<ExcelRowsResult> {
  return file.arrayBuffer().then(
    (buffer) =>
      new Promise<ExcelRowsResult>((resolve, reject) => {
        const worker = new Worker(new URL('../workers/excel.worker.ts', import.meta.url), {
          type: 'module'
        });

        worker.onmessage = (event: MessageEvent<ExcelWorkerResponse>) => {
          worker.terminate();
          const response = event.data;
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          if (!response.rows || !response.sheetName) {
            reject(new Error('O Worker não retornou dados válidos da planilha.'));
            return;
          }
          resolve({ rows: response.rows, sheetName: response.sheetName });
        };

        worker.onerror = (event) => {
          worker.terminate();
          reject(new Error(event.message || 'Falha ao processar a planilha no Worker.'));
        };

        worker.onmessageerror = () => {
          worker.terminate();
          reject(new Error('Falha ao receber os dados processados pelo Worker.'));
        };

        worker.postMessage({ buffer, kind }, [buffer]);
      })
  );
}

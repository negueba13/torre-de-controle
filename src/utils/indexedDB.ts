import { HistoricoPDE, Operador, Usuario, RegistroCarga, SessaoAtiva } from '../types';

const DB_NAME = 'Enorsul_Alto_Leste_DB';
const DB_VERSION = 5;

let dbInstance: IDBDatabase | null = null;

export function openLocalDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      try {
        if (
          dbInstance.objectStoreNames.contains('equipe') &&
          dbInstance.objectStoreNames.contains('historico_pdes') &&
          dbInstance.objectStoreNames.contains('usuarios') &&
          dbInstance.objectStoreNames.contains('historico_cargas') &&
          dbInstance.objectStoreNames.contains('sessao_ativa')
        ) {
          resolve(dbInstance);
          return;
        }
      } catch {
        dbInstance = null;
      }
    }

    const setupStores = (db: IDBDatabase) => {
      if (!db.objectStoreNames.contains('equipe')) {
        db.createObjectStore('equipe', { keyPath: 'nomeNormalizado' });
      }

      if (!db.objectStoreNames.contains('historico_pdes')) {
        db.createObjectStore('historico_pdes', { keyPath: 'pde' });
      }

      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('historico_cargas')) {
        db.createObjectStore('historico_cargas', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('sessao_ativa')) {
        db.createObjectStore('sessao_ativa', { keyPath: 'id' });
      }
    };

    const tryOpen = (targetVer?: number) => {
      let request: IDBOpenDBRequest;
      try {
        request = targetVer !== undefined
          ? indexedDB.open(DB_NAME, targetVer)
          : indexedDB.open(DB_NAME);
      } catch (err) {
        reject(err);
        return;
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        setupStores(db);
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const hasEquipe = db.objectStoreNames.contains('equipe');
        const hasHistorico = db.objectStoreNames.contains('historico_pdes');
        const hasUsuarios = db.objectStoreNames.contains('usuarios');
        const hasCargas = db.objectStoreNames.contains('historico_cargas');
        const hasSessao = db.objectStoreNames.contains('sessao_ativa');

        // If any required store is missing, upgrade version to create them
        if (!hasEquipe || !hasHistorico || !hasUsuarios || !hasCargas || !hasSessao) {
          const nextVer = db.version + 1;
          db.close();
          tryOpen(nextVer);
          return;
        }

        dbInstance = db;

        db.onversionchange = () => {
          db.close();
          dbInstance = null;
        };

        db.onclose = () => {
          dbInstance = null;
        };

        resolve(dbInstance);
      };

      request.onerror = () => {
        const error = request.error;
        if (error && error.name === 'VersionError' && targetVer !== undefined) {
          console.warn(`IndexedDB: Versão solicitada (${targetVer}) menor que a existente. Conectando à versão atual do navegador...`);
          tryOpen(undefined);
          return;
        }

        reject(error);
      };

      request.onblocked = () => {
        console.warn('Conexão ao IndexedDB bloqueada por outra aba aberta.');
      };
    };

    tryOpen(DB_VERSION);
  });
}

// ========================
// HISTÓRICO DE PDES
// ========================

export async function carregarTodosPDEs(): Promise<Map<string, HistoricoPDE>> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historico_pdes', 'readonly');
    const store = tx.objectStore('historico_pdes');
    const request = store.getAll();

    request.onsuccess = () => {
      const map = new Map<string, HistoricoPDE>();
      const results: HistoricoPDE[] = request.result || [];
      results.forEach((item) => {
        if (item.pde) {
          map.set(item.pde, item);
        }
      });
      resolve(map);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function salvarPDEsEmLote(pdeList: HistoricoPDE[]): Promise<void> {
  if (!pdeList || pdeList.length === 0) return;
  const db = await openLocalDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction('historico_pdes', 'readwrite');
    const store = tx.objectStore('historico_pdes');

    for (const item of pdeList) {
      store.put(item);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function limparBancoPDEs(): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historico_pdes', 'readwrite');
    const store = tx.objectStore('historico_pdes');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ========================
// EQUIPE OPERACIONAL
// ========================

export async function carregarEquipe(): Promise<Operador[]> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('equipe', 'readonly');
    const store = tx.objectStore('equipe');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function salvarOperador(op: Operador): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('equipe', 'readwrite');
    const store = tx.objectStore('equipe');
    const req = store.put(op);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function salvarEquipeEmLote(equipe: Operador[]): Promise<void> {
  if (!equipe.length) return;
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('equipe', 'readwrite');
    const store = tx.objectStore('equipe');
    equipe.forEach((op) => store.put(op));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function excluirOperador(nomeNormalizado: string): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('equipe', 'readwrite');
    const store = tx.objectStore('equipe');
    const req = store.delete(nomeNormalizado);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ========================
// CONTROLE DE ACESSO & USUÁRIOS
// ========================

export async function carregarUsuarios(): Promise<Usuario[]> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('usuarios', 'readonly');
    const store = tx.objectStore('usuarios');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function salvarUsuario(u: Usuario): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('usuarios', 'readwrite');
    const store = tx.objectStore('usuarios');
    const req = store.put(u);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function salvarUsuariosEmLote(usuarios: Usuario[]): Promise<void> {
  if (!usuarios.length) return;
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('usuarios', 'readwrite');
    const store = tx.objectStore('usuarios');
    usuarios.forEach((u) => store.put(u));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function excluirUsuario(id: string): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('usuarios', 'readwrite');
    const store = tx.objectStore('usuarios');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ========================
// AUDITORIA E HISTÓRICO DE CARGAS
// ========================

export async function carregarHistoricoCargas(): Promise<RegistroCarga[]> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historico_cargas', 'readonly');
    const store = tx.objectStore('historico_cargas');
    const request = store.getAll();

    request.onsuccess = () => {
      const records: RegistroCarga[] = request.result || [];
      records.sort((a, b) => (b.id > a.id ? 1 : -1));
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function salvarRegistroCarga(reg: RegistroCarga): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historico_cargas', 'readwrite');
    const store = tx.objectStore('historico_cargas');
    const req = store.put(reg);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function limparHistoricoCargas(): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('historico_cargas', 'readwrite');
    const store = tx.objectStore('historico_cargas');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ========================
// PERSISTÊNCIA DA SESSÃO ATIVA (ÚLTIMO SERVIÇO PUXADO)
// ========================

export async function salvarSessaoAtiva(sessao: SessaoAtiva): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessao_ativa', 'readwrite');
    const store = tx.objectStore('sessao_ativa');
    const req = store.put({ ...sessao, id: 'ultima_sessao' });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function carregarSessaoAtiva(): Promise<SessaoAtiva | null> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessao_ativa', 'readonly');
    const store = tx.objectStore('sessao_ativa');
    const req = store.get('ultima_sessao');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function limparSessaoAtiva(): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessao_ativa', 'readwrite');
    const store = tx.objectStore('sessao_ativa');
    const req = store.delete('ultima_sessao');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ========================
// BACKUP E RESTAURAÇÃO
// ========================

export async function gerarBackupCompleto(): Promise<{
  equipe: Operador[];
  historico: HistoricoPDE[];
  usuarios?: Usuario[];
  cargas?: RegistroCarga[];
}> {
  const [equipe, pdeMap, usuarios, cargas] = await Promise.all([
    carregarEquipe(),
    carregarTodosPDEs(),
    carregarUsuarios(),
    carregarHistoricoCargas()
  ]);
  return {
    equipe,
    historico: Array.from(pdeMap.values()),
    usuarios,
    cargas
  };
}

export async function restaurarBackupCompleto(dados: {
  equipe?: Operador[];
  historico?: HistoricoPDE[];
  usuarios?: Usuario[];
  cargas?: RegistroCarga[];
}): Promise<{ opsCount: number; pdesCount: number; usersCount: number; cargasCount: number }> {
  let opsCount = 0;
  let pdesCount = 0;
  let usersCount = 0;
  let cargasCount = 0;

  if (dados.equipe && Array.isArray(dados.equipe)) {
    await salvarEquipeEmLote(dados.equipe);
    opsCount = dados.equipe.length;
  }

  if (dados.historico && Array.isArray(dados.historico)) {
    await salvarPDEsEmLote(dados.historico);
    pdesCount = dados.historico.length;
  }

  if (dados.usuarios && Array.isArray(dados.usuarios)) {
    await salvarUsuariosEmLote(dados.usuarios);
    usersCount = dados.usuarios.length;
  }

  if (dados.cargas && Array.isArray(dados.cargas)) {
    for (const c of dados.cargas) {
      await salvarRegistroCarga(c);
    }
    cargasCount = dados.cargas.length;
  }

  return { opsCount, pdesCount, usersCount, cargasCount };
}

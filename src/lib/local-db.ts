import { v4 as uuidv4 } from 'uuid'
import type { Cliente, Veiculo, Servico, Peca, OrdemServico, Transacao, NotaFiscal } from '@/types'

const DB_NAME = 'OficinaDB'
const DB_VERSION = 1

const STORES = [
  'clientes', 'veiculos', 'servicos', 'pecas', 
  'ordens', 'transacoes', 'notasFiscais', 'config'
] as const

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' })
        }
      })
    }
  })
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

async function getById<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(id)
    request.onsuccess = () => resolve((request.result as T) || null)
    request.onerror = () => reject(request.error)
  })
}

async function add<T extends { id: string }>(storeName: string, item: T): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.put(item)
    request.onsuccess = () => resolve(item)
    request.onerror = () => reject(request.error)
  })
}

async function update<T extends { id: string }>(storeName: string, item: T): Promise<T> {
  return add(storeName, item)
}

async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function query<T>(storeName: string, predicate: (item: T) => boolean): Promise<T[]> {
  const all = await getAll<T>(storeName)
  return all.filter(predicate)
}

// ===== CLIENTES =====
export const clienteDB = {
  getAll: () => getAll<Cliente>('clientes'),
  getById: (id: string) => getById<Cliente>('clientes', id),
  add: (cliente: Omit<Cliente, 'id' | 'createdAt'>) => 
    add('clientes', { ...cliente, id: uuidv4(), createdAt: new Date().toISOString() }),
  update: (cliente: Cliente) => update('clientes', cliente),
  delete: (id: string) => remove('clientes', id),
  search: (term: string) => query<Cliente>('clientes', c => 
    c.nome.toLowerCase().includes(term.toLowerCase()) || 
    c.telefone.includes(term) ||
    (c.cpf && c.cpf.includes(term))
  )
}

// ===== VEICULOS =====
export const veiculoDB = {
  getAll: () => getAll<Veiculo>('veiculos'),
  getById: (id: string) => getById<Veiculo>('veiculos', id),
  getByCliente: (clienteId: string) => query<Veiculo>('veiculos', v => v.clienteId === clienteId),
  add: (veiculo: Omit<Veiculo, 'id' | 'createdAt'>) =>
    add('veiculos', { ...veiculo, id: uuidv4(), createdAt: new Date().toISOString() }),
  update: (veiculo: Veiculo) => update('veiculos', veiculo),
  delete: (id: string) => remove('veiculos', id)
}

// ===== SERVICOS =====
export const servicoDB = {
  getAll: () => getAll<Servico>('servicos'),
  getById: (id: string) => getById<Servico>('servicos', id),
  add: (servico: Omit<Servico, 'id' | 'createdAt'>) =>
    add('servicos', { ...servico, id: uuidv4(), createdAt: new Date().toISOString() }),
  update: (servico: Servico) => update('servicos', servico),
  delete: (id: string) => remove('servicos', id)
}

// ===== PECAS =====
export const pecaDB = {
  getAll: () => getAll<Peca>('pecas'),
  getById: (id: string) => getById<Peca>('pecas', id),
  add: (peca: Omit<Peca, 'id' | 'createdAt'>) =>
    add('pecas', { ...peca, id: uuidv4(), createdAt: new Date().toISOString() }),
  update: (peca: Peca) => update('pecas', peca),
  delete: (id: string) => remove('pecas', id),
  getBaixoEstoque: () => query<Peca>('pecas', p => p.quantidade <= p.minimo)
}

// ===== ORDENS DE SERVICO =====
export const ordemDB = {
  getAll: () => getAll<OrdemServico>('ordens'),
  getById: (id: string) => getById<OrdemServico>('ordens', id),
  getByStatus: (status: OrdemServico['status']) => query<OrdemServico>('ordens', o => o.status === status),
  add: (ordem: Omit<OrdemServico, 'id' | 'createdAt'>) =>
    add('ordens', { ...ordem, id: uuidv4(), createdAt: new Date().toISOString() }),
  update: (ordem: OrdemServico) => update('ordens', ordem),
  delete: (id: string) => remove('ordens', id)
}

// ===== TRANSACOES =====
export const transacaoDB = {
  getAll: () => getAll<Transacao>('transacoes'),
  getById: (id: string) => getById<Transacao>('transacoes', id),
  add: (transacao: Omit<Transacao, 'id' | 'createdAt'>) =>
    add('transacoes', { ...transacao, id: uuidv4(), createdAt: new Date().toISOString() }),
  update: (transacao: Transacao) => update('transacoes', transacao),
  delete: (id: string) => remove('transacoes', id),
  getByPeriodo: (inicio: string, fim: string) => 
    query<Transacao>('transacoes', t => t.data >= inicio && t.data <= fim)
}

// ===== NOTAS FISCAIS =====
export const notaFiscalDB = {
  getAll: () => getAll<NotaFiscal>('notasFiscais'),
  getById: (id: string) => getById<NotaFiscal>('notasFiscais', id),
  add: (nf: Omit<NotaFiscal, 'id' | 'createdAt'>) =>
    add('notasFiscais', { ...nf, id: uuidv4(), createdAt: new Date().toISOString() }),
  update: (nf: NotaFiscal) => update('notasFiscais', nf),
  delete: (id: string) => remove('notasFiscais', id)
}

// ===== CONFIG =====
export const configDB = {
  get: async (key: string): Promise<unknown> => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readonly')
      const store = tx.objectStore('config')
      const request = store.get(key)
      request.onsuccess = () => resolve((request.result as { value: unknown } | undefined)?.value || null)
      request.onerror = () => reject(request.error)
    })
  },
  set: async (key: string, value: unknown): Promise<void> => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('config', 'readwrite')
      const store = tx.objectStore('config')
      const request = store.put({ id: key, value })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// ===== ESTATISTICAS =====
export async function getDashboardStats(): Promise<{
  ordensPendentes: number;
  ordensConcluidasMes: number;
  faturamentoMes: number;
  despesasMes: number;
  lucroMes: number;
  pecasBaixoEstoque: number;
  clientesNovosMes: number;
}> {
  const [ordens, transacoes, pecas, clientes] = await Promise.all([
    getAll<OrdemServico>('ordens'),
    getAll<Transacao>('transacoes'),
    getAll<Peca>('pecas'),
    getAll<Cliente>('clientes')
  ])

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString()

  const transacoesMes = transacoes.filter(t => t.data >= inicioMes && t.data <= fimMes)
  const receitas = transacoesMes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const despesas = transacoesMes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)

  return {
    ordensPendentes: ordens.filter(o => o.status === 'pendente' || o.status === 'em_andamento').length,
    ordensConcluidasMes: ordens.filter(o => o.status === 'concluida' && o.dataSaida && o.dataSaida >= inicioMes).length,
    faturamentoMes: receitas,
    despesasMes: despesas,
    lucroMes: receitas - despesas,
    pecasBaixoEstoque: pecas.filter(p => p.quantidade <= p.minimo).length,
    clientesNovosMes: clientes.filter(c => c.createdAt >= inicioMes).length
  }
}

// ===== EXPORTAR/IMPORTAR DADOS =====
export async function exportarDados(): Promise<string> {
  const dados: Record<string, unknown[]> = {}
  for (const store of STORES) {
    dados[store] = await getAll(store)
  }
  return JSON.stringify(dados, null, 2)
}

export async function importarDados(jsonStr: string): Promise<void> {
  const dados = JSON.parse(jsonStr) as Record<string, unknown[]>
  const db = await openDB()

  for (const store of STORES) {
    if (dados[store]) {
      const tx = db.transaction(store, 'readwrite')
      const objectStore = tx.objectStore(store)
      await new Promise<void>((resolve, reject) => {
        const clearReq = objectStore.clear()
        clearReq.onsuccess = () => resolve()
        clearReq.onerror = () => reject(clearReq.error)
      })
      for (const item of dados[store]) {
        await new Promise<void>((resolve, reject) => {
          const req = objectStore.put(item)
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error)
        })
      }
    }
  }
}

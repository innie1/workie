export type WorkieDocument = { id: string; title: string; body: string; updatedAt: number }

const KEY = 'workie.documents.v1'

function read(): WorkieDocument[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function write(items: WorkieDocument[]) { localStorage.setItem(KEY, JSON.stringify(items)) }

export function listDocuments(): WorkieDocument[] { return read().sort((a,b) => b.updatedAt - a.updatedAt) }

export function createDocument(title = 'Untitled Document'): WorkieDocument {
  const now = Date.now()
  const doc = { id: crypto.randomUUID(), title, body: '', updatedAt: now }
  write([doc, ...read()])
  return doc
}

export function saveDocument(doc: WorkieDocument) {
  write(read().map(x => x.id === doc.id ? { ...doc, updatedAt: Date.now() } : x))
}

export function deleteDocument(id: string) { write(read().filter(x => x.id !== id)) }

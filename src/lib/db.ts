export type ProjectType =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'design'
  | 'motion'
  | 'image'
  | 'video'
  | 'audio'

export interface WorkieProject<T = any> {
  id: string
  name: string
  type: ProjectType
  createdAt: number
  updatedAt: number
  data: T
  thumbnail?: string
}

const DB_NAME = 'WorkieDB'
const DB_VERSION = 1
const STORE_PROJECTS = 'projects'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
        store.createIndex('type', 'type', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllProjects(): Promise<WorkieProject[]> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly')
      const store = tx.objectStore(STORE_PROJECTS)
      const index = store.index('updatedAt')
      const request = index.openCursor(null, 'prev')
      const results: WorkieProject[] = []
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('IndexedDB getAllProjects error:', err)
    return []
  }
}

export async function getProjectsByType(type: ProjectType): Promise<WorkieProject[]> {
  const all = await getAllProjects()
  return all.filter((p) => p.type === type)
}

export async function getProjectById(id: string): Promise<WorkieProject | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readonly')
      const store = tx.objectStore(STORE_PROJECTS)
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return null
  }
}

export async function saveProject(project: WorkieProject): Promise<WorkieProject> {
  const db = await openDB()
  const updated: WorkieProject = {
    ...project,
    updatedAt: Date.now(),
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite')
    const store = tx.objectStore(STORE_PROJECTS)
    const request = store.put(updated)
    request.onsuccess = () => resolve(updated)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite')
      const store = tx.objectStore(STORE_PROJECTS)
      const request = store.delete(id)
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return false
  }
}

export async function duplicateProject(id: string): Promise<WorkieProject | null> {
  const existing = await getProjectById(id)
  if (!existing) return null
  const clone: WorkieProject = {
    ...existing,
    id: crypto.randomUUID(),
    name: `${existing.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return saveProject(clone)
}

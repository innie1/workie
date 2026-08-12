import { useEffect, useState } from 'react'
import {
  getAllProjects,
  getProjectsByType,
  getProjectById,
  saveProject as dbSaveProject,
  deleteProject as dbDeleteProject,
  duplicateProject as dbDuplicateProject,
  type WorkieProject,
  type ProjectType,
} from './db'

type ProjectListener = () => void
const listeners = new Set<ProjectListener>()

function notifyListeners() {
  listeners.forEach((fn) => fn())
}

export function subscribeProjects(listener: ProjectListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useProjects(typeFilter?: ProjectType) {
  const [projects, setProjects] = useState<WorkieProject[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    const data = typeFilter ? await getProjectsByType(typeFilter) : await getAllProjects()
    setProjects(data)
    setLoading(false)
  }

  useEffect(() => {
    reload()
    return subscribeProjects(() => {
      reload()
    })
  }, [typeFilter])

  return { projects, loading, reload }
}

export async function createProject<T = any>(
  type: ProjectType,
  name: string,
  data: T
): Promise<WorkieProject<T>> {
  const now = Date.now()
  const project: WorkieProject<T> = {
    id: crypto.randomUUID(),
    name: name.trim() || `Untitled ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    type,
    createdAt: now,
    updatedAt: now,
    data,
  }
  const saved = await dbSaveProject(project)
  notifyListeners()
  return saved
}

export async function saveProject(project: WorkieProject): Promise<WorkieProject> {
  const saved = await dbSaveProject(project)
  notifyListeners()
  return saved
}

export async function deleteProject(id: string): Promise<boolean> {
  const ok = await dbDeleteProject(id)
  if (ok) notifyListeners()
  return ok
}

export async function duplicateProject(id: string): Promise<WorkieProject | null> {
  const cloned = await dbDuplicateProject(id)
  if (cloned) notifyListeners()
  return cloned
}

export { getProjectById, getAllProjects }

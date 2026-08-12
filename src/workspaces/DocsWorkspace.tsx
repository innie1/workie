import { useEffect, useState } from 'react'
import { Plus, Save, Download, Trash2, Copy, FileText, FileCode, Check } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject, duplicateProject } from '../lib/project-store'
import type { WorkieProject } from '../lib/db'

interface DocumentData {
  title: string
  body: string
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

export function DocsWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: docs, reload } = useProjects('document')
  const [current, setCurrent] = useState<WorkieProject<DocumentData> | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [dirty, setDirty] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (docs.length > 0) {
      const found = activeProjectId ? docs.find((d) => d.id === activeProjectId) : null
      const selected = found || current || docs[0]
      if (selected) {
        setCurrent(selected)
        setTitle(selected.name || selected.data?.title || 'Untitled Document')
        setBody(selected.data?.body || '')
        setDirty(false)
      }
    } else {
      setCurrent(null)
      setTitle('')
      setBody('')
    }
  }, [docs, activeProjectId])

  // Auto-save debounced
  useEffect(() => {
    if (!current || !dirty) return
    const timer = setTimeout(async () => {
      const updated: WorkieProject<DocumentData> = {
        ...current,
        name: title.trim() || 'Untitled Document',
        data: { title: title.trim() || 'Untitled Document', body },
      }
      await saveProject(updated)
      setDirty(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [title, body, dirty, current])

  const handleNew = async () => {
    const p = await createProject('document', 'Untitled Document', { title: 'Untitled Document', body: '' })
    setCurrent(p)
    setTitle(p.name)
    setBody('')
    setDirty(false)
    onNotice('New document created.')
  }

  const handleSelect = (doc: WorkieProject<DocumentData>) => {
    setCurrent(doc)
    setTitle(doc.name)
    setBody(doc.data?.body || '')
    setDirty(false)
  }

  const handleSave = async () => {
    if (!current) return
    const updated: WorkieProject<DocumentData> = {
      ...current,
      name: title.trim() || 'Untitled Document',
      data: { title: title.trim() || 'Untitled Document', body },
    }
    await saveProject(updated)
    setDirty(false)
    onNotice('Document saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Document deleted.')
    await reload()
  }

  const handleDuplicate = async () => {
    if (!current) return
    const dup = await duplicateProject(current.id)
    if (dup) {
      onNotice('Document duplicated.')
      await reload()
    }
  }

  const exportAs = (format: 'txt' | 'md' | 'html') => {
    let content = body
    let mime = 'text/plain'
    if (format === 'html') {
      content = `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1><div>${body.replace(/\n/g, '<br/>')}</div></body></html>`
      mime = 'text/html'
    } else if (format === 'md') {
      content = `# ${title}\n\n${body}`
      mime = 'text/markdown'
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    onNotice(`Exported as .${format}`)
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <button className="primary" onClick={handleNew}>
            <Plus size={16} /> New document
          </button>
          {docs.length > 0 && (
            <select
              className="doc-select"
              value={current?.id || ''}
              onChange={(e) => {
                const found = docs.find((d) => d.id === e.target.value)
                if (found) handleSelect(found)
              }}
            >
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {current && (
          <div className="editor-actions">
            {dirty && <span className="status-tag">Unsaved changes</span>}
            <button onClick={handleSave}>
              <Save size={16} /> Save
            </button>
            <button onClick={handleDuplicate}>
              <Copy size={16} /> Duplicate
            </button>

            <div className="dropdown">
              <button onClick={() => exportAs('md')}>
                <Download size={16} /> Export MD
              </button>
            </div>
            <button onClick={() => exportAs('txt')}>
              <FileText size={16} /> TXT
            </button>

            <button className="danger-btn" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="doc-layout">
        <aside className="doc-sidebar">
          <div className="doc-sidebar-head">
            <strong>Documents ({docs.length})</strong>
            <button onClick={handleNew} title="New Document">
              <Plus size={16} />
            </button>
          </div>
          {docs.length === 0 ? (
            <div className="sidebar-empty">No documents saved</div>
          ) : (
            docs.map((d) => (
              <button
                key={d.id}
                className={`doc-list-item ${d.id === current?.id ? 'selected' : ''}`}
                onClick={() => handleSelect(d)}
              >
                <FileText size={15} />
                <span>{d.name}</span>
              </button>
            ))
          )}
        </aside>

        <div className="doc-paper">
          {current ? (
            <div className="doc-page">
              <div className="doc-tools">
                <button onClick={() => { setBody((b) => b + '\n**Bold Text**'); setDirty(true) }}>
                  <b>B</b>
                </button>
                <button onClick={() => { setBody((b) => b + '\n*Italic Text*'); setDirty(true) }}>
                  <i>I</i>
                </button>
                <button onClick={() => { setBody((b) => b + '\n# Heading 1'); setDirty(true) }}>H1</button>
                <button onClick={() => { setBody((b) => b + '\n## Heading 2'); setDirty(true) }}>H2</button>
                <button onClick={() => { setBody((b) => b + '\n- Bullet point'); setDirty(true) }}>• List</button>
                <button onClick={() => { setBody((b) => b + '\n```\nCode block\n```'); setDirty(true) }}>
                  <FileCode size={14} />
                </button>
              </div>

              <input
                className="doc-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setDirty(true)
                }}
                placeholder="Document Title"
              />

              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  setDirty(true)
                }}
                placeholder="Tell Workie what to write or start typing your document here..."
              />
            </div>
          ) : (
            <div className="empty-center">
              <FileText size={42} color="#7C3CFF" />
              <h2>No documents yet</h2>
              <p>Create your first document to start writing.</p>
              <button className="primary" onClick={handleNew}>
                <Plus size={16} /> New document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

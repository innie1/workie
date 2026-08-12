import { useState, useEffect } from 'react'
import {
  FileText,
  Sheet,
  LayoutTemplate,
  Palette,
  PlaySquare,
  Image,
  Video,
  Music2,
  Plus,
  Search,
  Settings,
  Sparkles,
  ArrowRight,
  Folder,
  Trash2,
  Grid2X2,
  Menu,
  Activity,
  Download,
} from 'lucide-react'

import { askWorkieAI, getGemmaStatus, getAIConfig } from './lib/workie-ai'
import { mapProjectToWorkspace } from './lib/workie-tools'
import { useProjects, deleteProject } from './lib/project-store'
import type { WorkieProject } from './lib/db'
import Workspace from './Workspace'
import { SettingsModal } from './components/SettingsModal'
import './styles.css'

interface Tool {
  name: string
  kind: string
  subtitle: string
  icon: any
  tone: string
}

const tools: Tool[] = [
  { name: 'Document', kind: 'Docs', subtitle: 'Write', icon: FileText, tone: 'blue' },
  { name: 'Spreadsheet', kind: 'Sheets', subtitle: 'Calculate', icon: Sheet, tone: 'green' },
  { name: 'Presentation', kind: 'Slides', subtitle: 'Present', icon: LayoutTemplate, tone: 'orange' },
  { name: 'Design', kind: 'Design', subtitle: 'Create', icon: Palette, tone: 'purple' },
  { name: 'Motion', kind: 'Motion Studio', subtitle: 'Animate', icon: PlaySquare, tone: 'violet' },
  { name: 'Image', kind: 'Images', subtitle: 'Create', icon: Image, tone: 'indigo' },
  { name: 'Video', kind: 'Video', subtitle: 'Edit', icon: Video, tone: 'pink' },
  { name: 'Audio', kind: 'Audio', subtitle: 'Sound', icon: Music2, tone: 'teal' },
]

const EXAMPLES = [
  'Create a business proposal',
  'Make a presentation about my business',
  'Create a spreadsheet for monthly expenses',
  'Make a 15 second animated advert',
  'Design a flyer',
  'Summarize this document',
]

function App() {
  const [active, setActive] = useState('Home')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { projects: recentProjects, reload: reloadProjects } = useProjects()

  const gemma = getGemmaStatus()
  const aiConfig = getAIConfig()

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  const go = (workspaceName: string, projectId?: string) => {
    setActive(workspaceName)
    setActiveProjectId(projectId || null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAskAI = async (textToSubmit = prompt) => {
    const text = textToSubmit.trim()
    if (!text || busy) return

    setBusy(true)
    setAnswer('')

    try {
      const response = await askWorkieAI({ prompt: text })
      setAnswer(response.text)

      if (response.toolResult?.workspace) {
        flash(response.toolResult.message)
        go(response.toolResult.workspace, response.toolResult.projectId)
        await reloadProjects()
      }
    } catch (err: any) {
      setAnswer(err?.message || 'AI request failed.')
    } finally {
      setBusy(false)
    }
  }

  const filteredProjects = recentProjects.filter((p) =>
    query ? p.name.toLowerCase().includes(query.toLowerCase()) : true
  )

  const iconForType = (type: string) => {
    const found = tools.find((t) => t.kind.toLowerCase() === type || t.name.toLowerCase() === type)
    return found ? found.icon : FileText
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand" onClick={() => go('Home')} style={{ cursor: 'pointer' }}>
          <span className="brand-mark">W</span>
          <span>Workie</span>
        </div>

        <nav className="nav">
          <button className={`nav-item ${active === 'Home' ? 'active' : ''}`} onClick={() => go('Home')}>
            <Grid2X2 size={18} />
            <span>Home</span>
          </button>

          {tools.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.kind}
                className={`nav-item ${active === t.kind ? 'active' : ''}`}
                onClick={() => go(t.kind)}
              >
                <Icon size={18} />
                <span>{t.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setShowSettings(true)}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main">
        {/* Top bar */}
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileMenuOpen((v) => !v)}>
            <Menu size={20} />
          </button>

          <div className="search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your Workie projects..."
            />
          </div>

          <div className="top-actions">
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="AI Settings">
              <Settings size={18} />
            </button>
            <div className="avatar">W</div>
          </div>
        </header>

        {/* Content */}
        <div className="content">
          {active === 'Home' ? (
            <>
              {/* AI Command Hero */}
              <section className="command-hero">
                <div className="hero-head">
                  <h1>Tell Workie what you want to create...</h1>
                </div>

                <div className="command-bar-box">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAskAI()
                      }
                    }}
                    placeholder="Create a presentation, document, spreadsheet, motion advert, or design..."
                  />
                  <button className="primary send-btn" onClick={() => handleAskAI()} disabled={busy}>
                    <Sparkles size={18} /> {busy ? 'Creating...' : 'Create'}
                  </button>
                </div>

                {answer && (
                  <div className="ai-response-box">
                    <strong>Workie AI:</strong>
                    <p>{answer}</p>
                  </div>
                )}

                <div className="example-chips">
                  {EXAMPLES.map((ex) => (
                    <button key={ex} onClick={() => { setPrompt(ex); handleAskAI(ex); }}>
                      {ex}
                    </button>
                  ))}
                </div>
              </section>

              {/* Create Section */}
              <section className="create-section">
                <h2>Create</h2>
                <div className="create-tools-grid">
                  {tools.map((t) => {
                    const Icon = t.icon
                    return (
                      <button key={t.kind} className="create-tool-card" onClick={() => go(t.kind)}>
                        <span className={`tool-icon ${t.tone}`}>
                          <Icon size={22} />
                        </span>
                        <strong>{t.name}</strong>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Recent Projects Section */}
              <section className="recent-section">
                <div className="panel-head">
                  <h2>Recent Projects</h2>
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="empty-projects-state">
                    <Folder size={36} color="#7C3CFF" />
                    <p>Your projects will appear here.</p>
                  </div>
                ) : (
                  <div className="projects-grid">
                    {filteredProjects.map((p) => {
                      const Icon = iconForType(p.type)
                      const targetWorkspace = mapProjectToWorkspace(p.type)
                      return (
                        <div key={p.id} className="project-card" onClick={() => go(targetWorkspace, p.id)}>
                          <div className="project-card-head">
                            <span className="project-icon">
                              <Icon size={20} />
                            </span>
                            <span className="project-type-badge">{p.type}</span>
                          </div>
                          <strong>{p.name}</strong>
                          <small>Updated {new Date(p.updatedAt).toLocaleDateString()}</small>
                          <button
                            className="delete-proj-btn"
                            onClick={async (e) => {
                              e.stopPropagation()
                              await deleteProject(p.id)
                              flash('Project deleted.')
                              await reloadProjects()
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          ) : (
            <Workspace kind={active} activeProjectId={activeProjectId} onNotice={flash} />
          )}
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onNotice={flash} />}

      {notice && (
        <div className="toast">
          <Activity size={17} />
          {notice}
        </div>
      )}
    </div>
  )
}

export default App

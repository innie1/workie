import { useMemo, useState } from 'react'
import {
  Activity, ArrowRight, Bell, Bot, ChevronDown, FileText, Folder, Grid2X2,
  HelpCircle, Image, LayoutTemplate, Menu, MoreHorizontal, Moon, Music2,
  Palette, PlaySquare, Plus, Search, Settings, Sheet, Sparkles, Trash2,
  Upload, Video, X, Zap,
} from 'lucide-react'

type Tool = { name: string; subtitle: string; icon: typeof FileText; tone: string }

const tools: Tool[] = [
  { name: 'Docs', subtitle: 'Write', icon: FileText, tone: 'blue' },
  { name: 'Sheets', subtitle: 'Calculate', icon: Sheet, tone: 'green' },
  { name: 'Slides', subtitle: 'Present', icon: LayoutTemplate, tone: 'orange' },
  { name: 'Design', subtitle: 'Create', icon: Palette, tone: 'purple' },
  { name: 'Motion Studio', subtitle: 'Animate', icon: PlaySquare, tone: 'violet' },
  { name: 'Video', subtitle: 'Edit', icon: Video, tone: 'pink' },
  { name: 'Images', subtitle: 'Create', icon: Image, tone: 'indigo' },
  { name: 'Audio', subtitle: 'Sound', icon: Music2, tone: 'teal' },
]

const files = [
  { name: 'Business Proposal.docx', type: 'Docs', icon: FileText, time: '2 min ago', tone: 'blue' },
  { name: 'Sales Dashboard.xlsx', type: 'Sheets', icon: Sheet, time: '1 hr ago', tone: 'green' },
  { name: 'Marketing Strategy.pptx', type: 'Slides', icon: LayoutTemplate, time: '3 hrs ago', tone: 'orange' },
  { name: 'Product Launch.moti', type: 'Motion Studio', icon: PlaySquare, time: 'Yesterday', tone: 'violet' },
  { name: 'Brand Assets.png', type: 'Images', icon: Image, time: '2 days ago', tone: 'indigo' },
]

function App() {
  const [active, setActive] = useState('Home')
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showAi, setShowAi] = useState(false)
  const [aiText, setAiText] = useState('')
  const [notice, setNotice] = useState('')

  const filteredFiles = useMemo(
    () => files.filter((file) => `${file.name} ${file.type}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  const openTool = (name: string) => {
    setActive(name)
    setNotice(`${name} workspace is ready to build.`)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const askAi = (prompt = aiText) => {
    if (!prompt.trim()) return
    setNotice(`Workie AI received: “${prompt.trim()}”`)
    setAiText('')
    setShowAi(true)
    window.setTimeout(() => setNotice(''), 2800)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">W</span><span>Workie</span></div>
        <nav className="nav">
          {['Home', 'Docs', 'Sheets', 'Slides', 'Design', 'Motion Studio', 'Video', 'Images', 'Audio', 'PDF Tools', 'Notes', 'Files', 'Browser', 'Apps'].map((item) => {
            const Icon = item === 'Home' ? Grid2X2 : item === 'Files' ? Folder : item === 'Apps' ? Grid2X2 : item === 'Motion Studio' ? PlaySquare : item === 'Video' ? Video : item === 'Images' ? Image : item === 'Audio' ? Music2 : item === 'Design' ? Palette : item === 'Notes' ? FileText : item === 'PDF Tools' ? FileText : item === 'Browser' ? Search : FileText
            return <button key={item} className={`nav-item ${active === item ? 'active' : ''}`} onClick={() => openTool(item)}><Icon size={18} strokeWidth={1.9} /><span>{item}</span></button>
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setNotice('Templates are coming into the workspace.') }><LayoutTemplate size={18}/><span>Templates</span></button>
          <button className="nav-item" onClick={() => setNotice('Trash is empty.') }><Trash2 size={18}/><span>Trash</span></button>
          <button className="nav-item" onClick={() => setNotice('Settings are ready.') }><Settings size={18}/><span>Settings</span></button>
          <div className="storage"><div><span>Storage</span><b>12%</b></div><div className="progress"><span /></div><small>19 GB / 160 GB</small></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu"><Menu size={20}/></button>
          <div className="search"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files, tools, templates..."/><kbd>Ctrl K</kbd></div>
          <div className="top-actions"><button aria-label="Theme"><Moon size={19}/></button><button aria-label="Notifications"><Bell size={19}/><i>3</i></button><button aria-label="Help"><HelpCircle size={19}/></button><div className="avatar">W</div><ChevronDown size={15}/></div>
        </header>

        <div className="content">
          <section className="hero">
            <div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good morning 👋</h1><p className="muted">What would you like to create today?</p></div>
            <div className="hero-actions"><button className="primary" onClick={() => setShowCreate(true)}><Plus size={18}/> Create New</button><button onClick={() => setNotice('File picker will open in the next build.') }><Upload size={17}/> Open File</button><button onClick={() => setShowAi(true)}><Sparkles size={17}/> AI Assistant</button></div>
          </section>

          <section className="tool-grid">{tools.map(({ name, subtitle, icon: Icon, tone }) => <button className="tool-card" key={name} onClick={() => openTool(name)}><span className={`tool-icon ${tone}`}><Icon size={21}/></span><strong>{name}</strong><small>{subtitle}</small></button>)}<button className="tool-card" onClick={() => setNotice('More Workie tools will appear here.')}><span className="tool-icon neutral"><MoreHorizontal size={21}/></span><strong>More</strong><small>Explore</small></button></section>

          <section className="dashboard-grid">
            <div className="panel recent"><div className="panel-head"><h2>Recent Files</h2><button>View all</button></div>{filteredFiles.map(({ name, type, icon: Icon, time, tone }) => <button className="file-row" key={name} onClick={() => openTool(type)}><span className={`file-icon ${tone}`}><Icon size={17}/></span><span className="file-meta"><strong>{name}</strong><small>{type}</small></span><time>{time}</time><MoreHorizontal size={17}/></button>)}{filteredFiles.length === 0 && <div className="empty">No matching files.</div>}</div>
            <div className="panel quick"><div className="panel-head"><h2>Quick Start</h2></div>{[['Blank Document', 'Start writing', FileText], ['New Spreadsheet', 'Start with data', Sheet], ['New Presentation', 'Start a deck', LayoutTemplate], ['New Motion Project', 'Create animation', PlaySquare], ['Import File', 'Upload from device', Upload]].map(([name, sub, Icon]) => <button className="quick-row" key={String(name)} onClick={() => setNotice(`${name} selected.`)}><span><Icon size={18}/></span><div><strong>{name}</strong><small>{sub}</small></div><ArrowRight size={17}/></button>)}</div>
          </section>

          <section className="lower-grid">
            <div className="panel templates"><div className="panel-head"><h2>Templates</h2><button>View all</button></div><div className="template-grid">{['Project Proposal','Marketing Plan','Business Report','Pitch Deck','Invoice','Social Post'].map((name, i) => <button key={name} onClick={() => setNotice(`${name} template selected.`)}><div className={`template-preview p${i}`}><div/><span/><span/></div><strong>{name}</strong></button>)}</div></div>
            <div className="right-stack"><div className="panel ai-card"><div className="ai-head"><span className="ai-symbol"><Sparkles size={20}/></span><div><h2>Workie AI</h2><small>Your workspace assistant</small></div><span className="model">Gemma 4</span></div><div className="ai-input"><textarea value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder="Ask Workie to create, edit, analyze or organize..."/><button onClick={() => askAi()}><ArrowRight size={18}/></button></div><div className="chips"><button onClick={() => askAi('Create a presentation')}>Create a presentation</button><button onClick={() => askAi('Analyze this document')}>Analyze a document</button><button onClick={() => askAi('Create a motion graphic')}>Create motion graphic</button></div></div><div className="panel motion-card"><div className="panel-head"><h2>Motion Studio</h2><button onClick={() => openTool('Motion Studio')}>New Project</button></div><button className="motion-preview" onClick={() => openTool('Motion Studio')}><div className="wave"><span/><span/><span/><span/><span/></div><span className="play"><Zap size={20} fill="currentColor"/></span><time>00:45</time></button><strong>Brand Intro Animation</strong><small>Edited 2 hours ago</small></div></div>
          </section>
        </div>
      </main>

      {showCreate && <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CREATE</p><h2>Start something new</h2></div><button onClick={() => setShowCreate(false)}><X/></button></div><div className="create-grid">{tools.slice(0, 7).map(({ name, icon: Icon, tone }) => <button key={name} onClick={() => { setShowCreate(false); openTool(name) }}><span className={`tool-icon ${tone}`}><Icon size={22}/></span><strong>{name}</strong></button>)}</div></div></div>}
      {showAi && <button className="ai-fab" onClick={() => setShowAi(false)}><Bot size={19}/> Workie AI</button>}
      {notice && <div className="toast"><Activity size={17}/>{notice}</div>}
    </div>
  )
}

export default App

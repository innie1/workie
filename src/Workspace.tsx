import { useEffect, useState } from 'react'
import { Download, FileText, Play, Plus, Save, Sparkles, Trash2, X } from 'lucide-react'
import { createDocument, deleteDocument, listDocuments, saveDocument, type WorkieDocument } from './document-store'

type WorkspaceProps = { kind: string; onNotice: (message: string) => void }
type Row = string[]
const STORAGE = 'workie-projects-v1'
function readStore(): Record<string, string> { try { return JSON.parse(localStorage.getItem(STORAGE) || '{}') } catch { return {} } }
function writeStore(data: Record<string, string>) { localStorage.setItem(STORAGE, JSON.stringify(data)) }

function Docs({ onNotice }: { onNotice: (message: string) => void }) {
  const [docs, setDocs] = useState<WorkieDocument[]>([])
  const [current, setCurrent] = useState<WorkieDocument | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const refresh = () => setDocs(listDocuments())
  useEffect(() => {
    const items = listDocuments()
    if (items.length) { setDocs(items); setCurrent(items[0]); setTitle(items[0].title); setBody(items[0].body) }
    else { const doc = createDocument(); setDocs([doc]); setCurrent(doc); setTitle(doc.title); setBody(doc.body) }
  }, [])
  const open = (doc: WorkieDocument) => { setCurrent(doc); setTitle(doc.title); setBody(doc.body) }
  const newDoc = () => { const doc = createDocument(); setDocs(listDocuments()); setCurrent(doc); setTitle(doc.title); setBody(doc.body); onNotice('New document created.') }
  const save = () => { if (!current) return; const doc = { ...current, title: title.trim() || 'Untitled Document', body }; saveDocument(doc); setCurrent(doc); refresh(); onNotice('Document saved on this device.') }
  const remove = () => { if (!current) return; const remaining = docs.filter(x => x.id !== current.id); deleteDocument(current.id); if (remaining.length) open(remaining[0]); else newDoc(); setDocs(listDocuments()); onNotice('Document moved to Trash.') }
  const download = () => { const blob = new Blob([`${title}\n\n${body}`], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title.replace(/\s+/g, '-') || 'document'}.txt`; a.click(); URL.revokeObjectURL(a.href) }
  return <div className="editor-shell">
    <div className="editor-toolbar"><div className="doc-top"><button className="new-doc" onClick={newDoc}><Plus size={16}/> New document</button><select value={current?.id || ''} onChange={e => { const doc = docs.find(x=>x.id===e.target.value); if(doc) open(doc) }} aria-label="Choose document">{docs.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></div><div className="editor-actions"><button onClick={save}><Save size={16}/> Save</button><button onClick={download}><Download size={16}/> Export</button><button onClick={remove} title="Delete document"><Trash2 size={16}/></button></div></div>
    <div className="doc-layout"><aside className="doc-sidebar"><div className="doc-sidebar-head"><strong>Documents</strong><button onClick={newDoc}><Plus size={16}/></button></div>{docs.map(d=><button className={`doc-list-item ${d.id===current?.id?'selected':''}`} key={d.id} onClick={()=>open(d)}><FileText size={15}/><span>{d.title}</span></button>)}</aside><div className="doc-paper"><div className="doc-page"><div className="doc-tools"><button><b>B</b></button><button><i>I</i></button><button>H1</button><button>H2</button><button>• List</button></div><input className="doc-title" value={title} onChange={e=>setTitle(e.target.value)} aria-label="Document title" /><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Start writing here..." aria-label="Document editor" /></div></div></div>
  </div>
}

function Sheets({ onNotice }: { onNotice: (message: string) => void }) {
  const [rows, setRows] = useState<Row[]>(Array.from({ length: 10 }, (_, r) => Array.from({ length: 6 }, (_, c) => r === 0 ? String.fromCharCode(65+c) : '')))
  const update = (r:number,c:number,v:string) => setRows(x => x.map((row,ri)=>ri===r?row.map((cell,ci)=>ci===c?v:cell):row))
  const sum = rows.slice(1).flatMap(r=>r).reduce((n,v)=>n+(Number(v)||0),0)
  const save = () => { writeStore({ ...readStore(), sheet: JSON.stringify(rows) }); onNotice('Spreadsheet saved on this device.') }
  const addRow = () => setRows(x=>[...x, Array(6).fill('')])
  const exportCsv = () => { const csv=rows.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(',')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='workie-sheet.csv'; a.click(); URL.revokeObjectURL(a.href) }
  return <div className="sheet-shell"><div className="editor-toolbar"><div><strong>Untitled Spreadsheet</strong><small> Local workbook</small></div><div className="editor-actions"><span className="sheet-total">Total: {sum}</span><button onClick={addRow}><Plus size={16}/> Row</button><button onClick={save}><Save size={16}/> Save</button><button onClick={exportCsv}><Download size={16}/> CSV</button></div></div><div className="sheet-wrap"><table><tbody>{rows.map((row,r)=><tr key={r}><th>{r===0?'':r}</th>{row.map((v,c)=><td key={c}><input value={v} onChange={e=>update(r,c,e.target.value)} aria-label={`cell ${r+1} ${c+1}`}/></td>)}</tr>)}</tbody></table></div></div>
}

function Motion({ onNotice }: { onNotice: (message: string) => void }) {
  const [playing,setPlaying]=useState(false); const [duration,setDuration]=useState(10); const [text,setText]=useState('WORKIE'); const [x,setX]=useState(42)
  const addKeyframe=()=>{setX(v=>Math.min(92,v+10));onNotice('Keyframe added to the timeline.')}
  return <div className="motion-shell"><div className="editor-toolbar"><div><strong>Motion Studio</strong><small> Brand Intro • {duration}s</small></div><div className="editor-actions"><button onClick={()=>setPlaying(v=>!v)}><Play size={16}/>{playing?'Pause':'Preview'}</button><button onClick={addKeyframe}><Plus size={16}/> Keyframe</button><button onClick={()=>onNotice('Motion project saved.') }><Save size={16}/> Save</button></div></div><div className="motion-stage"><div className={`motion-object ${playing?'motion-playing':''}`} style={{left:`${x}%`}}><span>{text}</span></div></div><div className="motion-controls"><label>Title <input value={text} onChange={e=>setText(e.target.value)} /></label><label>Duration <input type="number" min="1" max="60" value={duration} onChange={e=>setDuration(Number(e.target.value))} /></label></div><div className="timeline"><div className="timeline-head"><span>Timeline</span><small>0s</small><small>{duration/2}s</small><small>{duration}s</small></div><div className="track"><div className="track-fill" style={{width:`${Math.min(100,x)}%`}}/></div><div className="keyframes"><button onClick={addKeyframe} title="Add keyframe">◆</button></div></div></div>
}

export default function Workspace({ kind, onNotice }: WorkspaceProps) {
  if (kind === 'Docs') return <Docs onNotice={onNotice}/>
  if (kind === 'Sheets') return <Sheets onNotice={onNotice}/>
  if (kind === 'Motion Studio') return <Motion onNotice={onNotice}/>
  return <div className="tool-page"><div className="tool-page-icon"><Sparkles size={28}/></div><h2>{kind}</h2><p>This workspace is next in the Workie editor system.</p><button className="primary" onClick={()=>onNotice(`New ${kind} project created.`)}><Sparkles size={16}/> Start with Workie AI</button></div>
}

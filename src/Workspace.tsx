import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Grid3X3, Play, Plus, Save, Sparkles, Table2, Trash2 } from 'lucide-react'

type WorkspaceProps = { kind: string; onNotice: (message: string) => void }

type Row = string[]

const STORAGE = 'workie-projects-v1'
function readStore(): Record<string, string> { try { return JSON.parse(localStorage.getItem(STORAGE) || '{}') } catch { return {} } }
function writeStore(data: Record<string, string>) { localStorage.setItem(STORAGE, JSON.stringify(data)) }

function Docs({ onNotice }: { onNotice: (message: string) => void }) {
  const [title, setTitle] = useState('Untitled Document')
  const [body, setBody] = useState('Start writing here...')
  useEffect(() => { const saved = readStore()['doc']; if (saved) { const x = JSON.parse(saved); setTitle(x.title); setBody(x.body) } }, [])
  const save = () => { writeStore({ ...readStore(), doc: JSON.stringify({ title, body }) }); onNotice('Document saved on this device.') }
  const download = () => { const blob = new Blob([`${title}\n\n${body}`], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${title.replace(/\s+/g, '-') || 'document'}.txt`; a.click(); URL.revokeObjectURL(a.href) }
  return <div className="editor-shell"><div className="editor-toolbar"><input className="doc-title" value={title} onChange={e=>setTitle(e.target.value)} /><div className="editor-actions"><button onClick={save}><Save size={16}/> Save</button><button onClick={download}><Download size={16}/> Export</button></div></div><div className="doc-paper"><div className="doc-page"><div className="doc-tools"><button><b>B</b></button><button><i>I</i></button><button>H1</button><button>H2</button><button>• List</button></div><textarea value={body} onChange={e=>setBody(e.target.value)} aria-label="Document editor" /></div></div></div>
}

function Sheets({ onNotice }: { onNotice: (message: string) => void }) {
  const initial = Array.from({ length: 10 }, (_, r) => Array.from({ length: 6 }, (_, c) => r === 0 ? String.fromCharCode(65+c) : ''))
  const [rows, setRows] = useState<Row[]>(initial)
  const update = (r:number,c:number,v:string) => setRows(x => x.map((row,ri)=>ri===r?row.map((cell,ci)=>ci===c?v:cell):row))
  const sum = useMemo(() => rows.slice(1).flatMap(r=>r).reduce((n,v)=>n+(Number(v)||0),0), [rows])
  const save = () => { writeStore({ ...readStore(), sheet: JSON.stringify(rows) }); onNotice('Spreadsheet saved on this device.') }
  const addRow = () => setRows(x=>[...x, Array(6).fill('')])
  const exportCsv = () => { const csv=rows.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(',')).join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='workie-sheet.csv'; a.click(); URL.revokeObjectURL(a.href) }
  return <div className="sheet-shell"><div className="editor-toolbar"><div><strong>Untitled Spreadsheet</strong><small> Local workbook</small></div><div className="editor-actions"><span className="sheet-total">Total: {sum}</span><button onClick={addRow}><Plus size={16}/> Row</button><button onClick={save}><Save size={16}/> Save</button><button onClick={exportCsv}><Download size={16}/> CSV</button></div></div><div className="sheet-wrap"><table><tbody>{rows.map((row,r)=><tr key={r}><th>{r===0?'':r}</th>{row.map((v,c)=><td key={c}><input value={v} onChange={e=>update(r,c,e.target.value)} aria-label={`cell ${r+1} ${c+1}`}/></td>)}</tr>)}</tbody></table></div></div>
}

function Motion({ onNotice }: { onNotice: (message: string) => void }) {
  const [playing,setPlaying]=useState(false); const [duration,setDuration]=useState(10); const [text,setText]=useState('WORKIE'); const [x,setX]=useState(42)
  const addKeyframe=()=>{setX(v=>Math.min(92,v+10));onNotice('Keyframe added to the timeline.')}
  return <div className="motion-shell"><div className="editor-toolbar"><div><strong>Motion Studio</strong><small> Brand Intro • {duration}s</small></div><div className="editor-actions"><button onClick={()=>setPlaying(v=>!v)}><Play size={16}/>{playing?'Pause':'Preview'}</button><button onClick={addKeyframe}><Plus size={16}/> Keyframe</button><button onClick={()=>onNotice('Motion project saved.') }><Save size={16}/> Save</button></div></div><div className="motion-stage"><div className={`motion-object ${playing?'motion-playing':''}`} style={{left:`${x}%`}}><span>{text}</span></div></div><div className="motion-controls"><label>Title <input value={text} onChange={e=>setText(e.target.value)} /></label><label>Duration <input type="number" min="1" max="60" value={duration} onChange={e=>setDuration(Number(e.target.value))} /></label></div><div className="timeline"><div className="timeline-head"><span>Timeline</span><small>0s</small><small>{duration/2}s</small><small>{duration}s</small></div><div className="track"><div className="track-fill" style={{width:`${Math.min(100,(x/100)*100)}%`}}/></div><div className="keyframes"><button onClick={addKeyframe} title="Add keyframe">◆</button></div></div></div>
}

export default function Workspace({ kind, onNotice }: WorkspaceProps) {
  if (kind === 'Docs') return <Docs onNotice={onNotice}/>
  if (kind === 'Sheets') return <Sheets onNotice={onNotice}/>
  if (kind === 'Motion Studio') return <Motion onNotice={onNotice}/>
  const Icon = kind === 'Sheets' ? Table2 : kind === 'Motion Studio' ? Play : FileText
  return <div className="tool-page"><div className="tool-page-icon"><Icon size={28}/></div><h2>{kind}</h2><p>This workspace is next in the Workie editor system.</p><button className="primary" onClick={()=>onNotice(`New ${kind} project created.`)}><Sparkles size={16}/> Start with Workie AI</button></div>
}

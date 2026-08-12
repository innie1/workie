import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Image as ImageIcon, Music2, Play, Plus, Save, Sparkles, Trash2, Video } from 'lucide-react'
import { createDocument, deleteDocument, listDocuments, saveDocument, type WorkieDocument } from './document-store'

type WorkspaceProps = { kind: string; onNotice: (message: string) => void }
type Row = string[]
const PROJECTS = 'workie-projects-v2'

function readProjects(): Record<string, any> { try { return JSON.parse(localStorage.getItem(PROJECTS) || '{}') } catch { return {} } }
function writeProjects(value: Record<string, any>) { localStorage.setItem(PROJECTS, JSON.stringify(value)) }
function download(name: string, data: string, type: string) { const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([data], { type })); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url) }

function Docs({ onNotice }: { onNotice: (message: string) => void }) {
  const [docs, setDocs] = useState<WorkieDocument[]>([]), [current, setCurrent] = useState<WorkieDocument | null>(null), [title, setTitle] = useState(''), [body, setBody] = useState('')
  const refresh = () => setDocs(listDocuments())
  useEffect(() => { const items = listDocuments(); if (items.length) { setDocs(items); setCurrent(items[0]); setTitle(items[0].title); setBody(items[0].body) } else { const d = createDocument(); setDocs([d]); setCurrent(d); setTitle(d.title); setBody(d.body) } }, [])
  const open = (d: WorkieDocument) => { setCurrent(d); setTitle(d.title); setBody(d.body) }
  const newDoc = () => { const d = createDocument(); setDocs(listDocuments()); open(d); onNotice('New document created.') }
  const save = () => { if (!current) return; const d = { ...current, title: title.trim() || 'Untitled Document', body }; saveDocument(d); setCurrent(d); refresh(); onNotice('Document saved.') }
  const remove = () => { if (!current) return; deleteDocument(current.id); const left = listDocuments(); if (left.length) open(left[0]); else newDoc(); refresh(); onNotice('Document deleted.') }
  return <div className="editor-shell"><div className="editor-toolbar"><div className="doc-top"><button className="new-doc" onClick={newDoc}><Plus size={16}/> New document</button><select value={current?.id || ''} onChange={e=>{const d=docs.find(x=>x.id===e.target.value);if(d)open(d)}}>{docs.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></div><div className="editor-actions"><button onClick={save}><Save size={16}/> Save</button><button onClick={()=>download(`${title || 'document'}.txt`, `${title}\n\n${body}`, 'text/plain')}><Download size={16}/> Export</button><button onClick={remove}><Trash2 size={16}/></button></div></div><div className="doc-layout"><aside className="doc-sidebar"><div className="doc-sidebar-head"><strong>Documents</strong><button onClick={newDoc}><Plus size={16}/></button></div>{docs.map(d=><button className={`doc-list-item ${d.id===current?.id?'selected':''}`} key={d.id} onClick={()=>open(d)}><FileText size={15}/><span>{d.title}</span></button>)}</aside><div className="doc-paper"><div className="doc-page"><div className="doc-tools"><button onClick={()=>setBody(v=>v+'\n\n**Bold**')}>B</button><button onClick={()=>setBody(v=>v+'\n\n*Italic*')}>I</button><button onClick={()=>setBody(v=>v+'\n\n# Heading')}>H1</button><button onClick={()=>setBody(v=>v+'\n\n- List item')}>• List</button></div><input className="doc-title" value={title} onChange={e=>setTitle(e.target.value)} /><textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Start writing here..." /></div></div></div></div>
}

function Sheets({ onNotice }: { onNotice: (message: string) => void }) {
  const [rows,setRows]=useState<Row[][]>(()=>{try{return JSON.parse(readProjects().sheet?.rows||'null')||[['Item','Quantity','Price','Total'],['','','','=B2*C2'],['','','','=B3*C3'],['','','','=B4*C4']]}catch{return [['Item','Quantity','Price','Total']]}})
  const update=(r:number,c:number,v:string)=>setRows(x=>x.map((row,ri)=>ri===r?row.map((cell,ci)=>ci===c?v:cell):row))
  const add=()=>setRows(x=>[...x,Array(4).fill('')])
  const total=useMemo(()=>rows.slice(1).reduce((n,r)=>n+(Number(r[1])||0)*(Number(r[2])||0),0),[rows])
  const save=()=>{writeProjects({...readProjects(),sheet:{rows:JSON.stringify(rows)}});onNotice('Spreadsheet saved.')}
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
  return <div className="sheet-shell"><div className="editor-toolbar"><div><strong>Untitled Spreadsheet</strong><small> Local workbook</small></div><div className="editor-actions"><span className="sheet-total">Total: {total.toLocaleString()}</span><button onClick={add}><Plus size={16}/> Row</button><button onClick={save}><Save size={16}/> Save</button><button onClick={()=>download('workie-sheet.csv',csv,'text/csv')}><Download size={16}/> CSV</button></div></div><div className="sheet-wrap"><table><tbody>{rows.map((row,r)=><tr key={r}><th>{r+1}</th>{row.map((v,c)=><td key={c}><input value={v} onChange={e=>update(r,c,e.target.value)} /></td>)}</tr>)}</tbody></table></div></div>
}

function Slides({ onNotice }: { onNotice: (message: string) => void }) {
  const [slides,setSlides]=useState(()=>readProjects().slides?.slides||[{title:'Untitled Presentation',body:'Add your content here.'}]),[active,setActive]=useState(0)
  const current=slides[active]||slides[0]
  const update=(key:'title'|'body',value:string)=>setSlides((s:any[])=>s.map((x,i)=>i===active?{...x,[key]:value}:x))
  const add=()=>{setSlides((s:any[])=>[...s,{title:`Slide ${s.length+1}`,body:'Add your content here.'}]);setActive(slides.length)}
  const save=()=>{writeProjects({...readProjects(),slides:{slides}});onNotice('Presentation saved.')}
  return <div className="slides-shell"><div className="editor-toolbar"><strong>Slides</strong><div className="editor-actions"><button onClick={add}><Plus size={16}/> Slide</button><button onClick={save}><Save size={16}/> Save</button><button onClick={()=>download('workie-presentation.txt',slides.map((s:any,i:number)=>`SLIDE ${i+1}\n${s.title}\n${s.body}`).join('\n\n'),'text/plain')}><Download size={16}/> Export</button></div></div><div className="slides-layout"><aside className="slide-list">{slides.map((s:any,i:number)=><button key={i} className={i===active?'selected':''} onClick={()=>setActive(i)}><span>{i+1}</span><b>{s.title}</b></button>)}</aside><div className="slide-canvas"><input className="slide-title" value={current.title} onChange={e=>update('title',e.target.value)} /><textarea className="slide-body" value={current.body} onChange={e=>update('body',e.target.value)} /><button className="primary" onClick={()=>onNotice('Presentation preview ready.') }><Play size={16}/> Present</button></div></div></div>
}

function Design({ onNotice }: { onNotice: (message: string) => void }) {
  const [title,setTitle]=useState('Your Design'),[subtitle,setSubtitle]=useState('Create something beautiful'),[size,setSize]=useState('1080 × 1080')
  const save=()=>{writeProjects({...readProjects(),design:{title,subtitle,size}});onNotice('Design saved.')}
  return <div className="design-shell"><div className="editor-toolbar"><div><strong>Design Studio</strong><small> {size}</small></div><div className="editor-actions"><select value={size} onChange={e=>setSize(e.target.value)}><option>1080 × 1080</option><option>1920 × 1080</option><option>1080 × 1920</option><option>1200 × 628</option></select><button onClick={save}><Save size={16}/> Save</button><button onClick={()=>download('workie-design.txt',`${title}\n${subtitle}\nSize: ${size}`,'text/plain')}><Download size={16}/> Export</button></div></div><div className="design-stage"><div className="design-card"><input value={title} onChange={e=>setTitle(e.target.value)} /><textarea value={subtitle} onChange={e=>setSubtitle(e.target.value)} /><span>WORKIE DESIGN</span></div></div></div>
}

function Motion({ onNotice }: { onNotice: (message: string) => void }) {
  const [playing,setPlaying]=useState(false),[duration,setDuration]=useState(10),[text,setText]=useState('WORKIE'),[x,setX]=useState(20),[frames,setFrames]=useState<number[]>([20])
  const add=()=>{const next=Math.min(90,x+15);setX(next);setFrames(f=>[...f,next]);onNotice('Keyframe added.')}
  const save=()=>{writeProjects({...readProjects(),motion:{duration,text,frames}});onNotice('Motion project saved.')}
  return <div className="motion-shell"><div className="editor-toolbar"><div><strong>Motion Studio</strong><small> Timeline • {duration}s</small></div><div className="editor-actions"><button onClick={()=>setPlaying(v=>!v)}><Play size={16}/>{playing?'Pause':'Preview'}</button><button onClick={add}><Plus size={16}/> Keyframe</button><button onClick={save}><Save size={16}/> Save</button></div></div><div className="motion-stage"><div className={`motion-object ${playing?'motion-playing':''}`} style={{left:`${x}%`}}>{text}</div></div><div className="motion-controls"><label>Text<input value={text} onChange={e=>setText(e.target.value)}/></label><label>Duration<input type="number" min="1" max="60" value={duration} onChange={e=>setDuration(Number(e.target.value)||1)}/></label></div><div className="timeline"><div className="timeline-head"><span>Timeline</span><small>0s</small><small>{duration/2}s</small><small>{duration}s</small></div><div className="track"><div className="track-fill" style={{width:`${x}%`}}/></div><div className="keyframes">{frames.map((f,i)=><button key={i} onClick={()=>setX(f)} style={{left:`${f}%`}}>◆</button>)}</div></div></div>
}

function MediaWorkspace({kind,onNotice}:{kind:string;onNotice:(m:string)=>void}) {
  const icon=kind==='Video'?Video:kind==='Audio'?Music2:ImageIcon
  const Icon=icon
  const [name,setName]=useState(`Untitled ${kind} Project`),[prompt,setPrompt]=useState(''),[items,setItems]=useState<string[]>([])
  const add=()=>{if(!prompt.trim())return;setItems(x=>[...x,prompt.trim()]);setPrompt('');onNotice(`${kind} item added.`)}
  const save=()=>{writeProjects({...readProjects(),[kind.toLowerCase()]:{name,items}});onNotice(`${kind} project saved.`)}
  return <div className="media-shell"><div className="editor-toolbar"><div><strong>{kind} Studio</strong></div><div className="editor-actions"><button onClick={save}><Save size={16}/> Save</button><button onClick={()=>download(`${name.replace(/\s+/g,'-')}.txt`,items.join('\n'),'text/plain')}><Download size={16}/> Export</button></div></div><div className="media-head"><Icon size={30}/><input value={name} onChange={e=>setName(e.target.value)}/><p>Build this project with Workie AI or add elements manually.</p></div><div className="media-add"><input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={kind==='Images'?'Describe an image...':kind==='Video'?'Describe a scene or clip...':'Describe an audio element...'} onKeyDown={e=>{if(e.key==='Enter')add()}}/><button className="primary" onClick={add}><Plus size={16}/> Add</button></div><div className="media-list">{items.length?items.map((x,i)=><div key={i}><Icon size={18}/><span>{x}</span></div>):<div className="empty"><Sparkles size={22}/><strong>Your {kind.toLowerCase()} project is empty</strong><p>Add an element above or ask Workie AI to build it.</p></div>}</div></div>
}

export default function Workspace({ kind, onNotice }: WorkspaceProps) {
  if(kind==='Docs')return <Docs onNotice={onNotice}/>
  if(kind==='Sheets')return <Sheets onNotice={onNotice}/>
  if(kind==='Slides')return <Slides onNotice={onNotice}/>
  if(kind==='Design')return <Design onNotice={onNotice}/>
  if(kind==='Motion Studio')return <Motion onNotice={onNotice}/>
  if(['Video','Images','Audio'].includes(kind))return <MediaWorkspace kind={kind} onNotice={onNotice}/>
  return <div className="tool-page"><div className="tool-page-icon"><Sparkles size={28}/></div><h2>{kind}</h2><p>Workie is ready to build this workspace with you.</p><button className="primary" onClick={()=>onNotice(`New ${kind} project created.`)}><Sparkles size={16}/> Start with Workie AI</button></div>
}

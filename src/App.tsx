import { useState } from 'react'
import { Activity, ArrowRight, Bot, FileText, Folder, Grid2X2, Image, LayoutTemplate, Menu, Music2, Palette, PlaySquare, Plus, Search, Settings, Sheet, Sparkles, Trash2, Upload, Video, X } from 'lucide-react'
import { askWorkieAI, getGemmaStatus, loadLocalGemma, hasOpenRouterKey, setOpenRouterKey, clearOpenRouterKey } from './workie-ai'
import { interpretWorkieAction, workspaceForAction } from './workie-tools'
import Workspace from './Workspace'
import './styles.css'

type Tool={name:string;subtitle:string;icon:any;tone:string}
const tools:Tool[]=[
{name:'Docs',subtitle:'Write',icon:FileText,tone:'blue'},{name:'Sheets',subtitle:'Calculate',icon:Sheet,tone:'green'},{name:'Slides',subtitle:'Present',icon:LayoutTemplate,tone:'orange'},{name:'Design',subtitle:'Create',icon:Palette,tone:'purple'},{name:'Motion Studio',subtitle:'Animate',icon:PlaySquare,tone:'violet'},{name:'Video',subtitle:'Edit',icon:Video,tone:'pink'},{name:'Images',subtitle:'Create',icon:Image,tone:'indigo'},{name:'Audio',subtitle:'Sound',icon:Music2,tone:'teal'}]
const nav=['Home',...tools.map(t=>t.name),'PDF Tools','Notes','Files','Browser','Apps']
function App(){
 const[active,setActive]=useState('Home'),[query,setQuery]=useState(''),[create,setCreate]=useState(false),[ai,setAi]=useState(false),[prompt,setPrompt]=useState(''),[answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[gemma,setGemma]=useState(getGemmaStatus()),[cloud,setCloud]=useState(hasOpenRouterKey())
 const flash=(message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(''),2200)}
 const go=(name:string)=>{setActive(name);flash(`${name} workspace is ready.`)}
 const ask=async(text=prompt)=>{
  if(!text.trim()||busy)return
  setBusy(true);setAnswer('')
  try{
   const action=interpretWorkieAction(text)
   if(action){
    const workspace=workspaceForAction(action)
    setActive(workspace)
    setAnswer(`I opened ${workspace}. You can continue working there, and I'll use this action system to control Workie as more tools are added.`)
   } else {
    const result=await askWorkieAI({prompt:text})
    setAnswer(result.text)
   }
  }catch(e){setAnswer(e instanceof Error?e.message:'AI could not respond.')}finally{setBusy(false)}
 }
 const installGemma=async()=>{flash('Downloading Gemma 4 E2B Q4 model. This is about 3 GB and only happens once.');try{await loadLocalGemma((p)=>setNotice(`Gemma 4 download: ${p}%`));setGemma(getGemmaStatus());flash('Gemma 4 is ready on this device.')}catch(e){flash(e instanceof Error?e.message:'Gemma setup failed.')}}
 const connectOpenRouter=()=>{
  const key=window.prompt('Paste your new OpenRouter API key. It will be stored only on this device. Do not use a key that you have already posted publicly.')
  if(!key)return
  setOpenRouterKey(key);setCloud(true);flash('OpenRouter connected on this device.')
 }
 const disconnectOpenRouter=()=>{clearOpenRouterKey();setCloud(false);flash('OpenRouter disconnected.')}
 const iconFor=(name:string)=>name==='Home'?Grid2X2:name==='Files'?Folder:name==='Apps'?Grid2X2:tools.find(t=>t.name===name)?.icon||FileText
 return <div className="app-shell">
  <aside className="sidebar"><div className="brand"><span className="brand-mark">W</span><span>Workie</span></div><nav className="nav">{nav.map(name=>{const Icon=iconFor(name);return <button key={name} className={`nav-item ${active===name?'active':''}`} onClick={()=>go(name)}><Icon size={18}/><span>{name}</span></button>})}</nav><div className="sidebar-bottom"><button className="nav-item"><Trash2 size={18}/><span>Trash</span></button><button className="nav-item"><Settings size={18}/><span>Settings</span></button><div className="storage"><div><span>Storage</span><b>12%</b></div><div className="progress"><span/></div><small>19 GB / 160 GB</small></div></div></aside>
  <main className="main"><header className="topbar"><button className="mobile-menu"><Menu size={20}/></button><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search files, tools, templates..."/><kbd>Ctrl K</kbd></div><div className="top-actions"><div className="avatar">W</div></div></header>
   <div className="content">{active==='Home'?<>
    <section className="hero"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Good morning 👋</h1><p className="muted">What would you like to create today?</p></div><div className="hero-actions"><button className="primary" onClick={()=>setCreate(true)}><Plus size={18}/> Create New</button><button onClick={()=>flash('File picker is next in the workspace roadmap.') }><Upload size={17}/> Open File</button><button onClick={()=>setAi(true)}><Sparkles size={17}/> AI Assistant</button></div></section>
    <section className="tool-grid">{tools.map(t=>{const Icon=t.icon;return <button className="tool-card" key={t.name} onClick={()=>go(t.name)}><span className={`tool-icon ${t.tone}`}><Icon size={21}/></span><strong>{t.name}</strong><small>{t.subtitle}</small></button>})}</section>
    <section className="dashboard-grid"><div className="panel recent"><div className="panel-head"><h2>Recent Files</h2><button>View all</button></div>{['Business Proposal.docx','Sales Dashboard.xlsx','Marketing Strategy.pptx','Brand Intro.moti'].filter(x=>x.toLowerCase().includes(query.toLowerCase())).map((name,i)=><button className="file-row" key={name} onClick={()=>go(tools[i%tools.length].name)}><span className={`file-icon ${tools[i%tools.length].tone}`}><FileText size={17}/></span><span className="file-meta"><strong>{name}</strong><small>{tools[i%tools.length].name}</small></span><time>{i+1} hr ago</time></button>)}</div><div className="panel quick"><div className="panel-head"><h2>Quick Start</h2></div>{[['Blank Document','Docs',FileText],['New Spreadsheet','Sheets',Sheet],['New Presentation','Slides',LayoutTemplate],['New Motion Project','Motion Studio',PlaySquare]].map(([name,target,Icon]:any)=><button className="quick-row" key={name} onClick={()=>go(target)}><span><Icon size={18}/></span><div><strong>{name}</strong><small>Start creating</small></div><ArrowRight size={17}/></button>)}</div></section>
    <section className="lower-grid"><div className="panel templates"><div className="panel-head"><h2>Templates</h2><button>View all</button></div><div className="template-grid">{['Project Proposal','Marketing Plan','Business Report','Pitch Deck','Invoice','Social Post'].map((x,i)=><button key={x} onClick={()=>flash(`${x} selected.`)}><div className={`template-preview p${i}`}><div/><span/><span/></div><strong>{x}</strong></button>)}</div></div><div className="right-stack"><div className="panel ai-card"><div className="ai-head"><span className="ai-symbol"><Sparkles size={20}/></span><div><h2>Workie AI</h2><small>{gemma.ready?'Gemma 4 • Local':cloud?'OpenRouter • Cloud':'Choose Local or Cloud AI'}</small></div><span className="model">{gemma.ready?'LOCAL':cloud?'CLOUD':'AI'}</span></div><div className="ai-input"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask Workie to create, edit, analyze or organize..."/><button onClick={()=>ask()} disabled={busy}><ArrowRight size={18}/></button></div>{answer&&<div className="empty"><strong>{busy?'Thinking…':'Workie AI'}</strong><p>{answer}</p></div>}<div className="chips"><button onClick={()=>ask('Create a presentation')}>Create a presentation</button><button onClick={()=>ask('Create a motion graphic')}>Create motion graphic</button></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>{!gemma.ready&&<button className="gemma-install" onClick={installGemma}><Sparkles size={15}/> Install Gemma 4 locally (~3 GB)</button>}{cloud?<button onClick={disconnectOpenRouter}>Disconnect OpenRouter</button>:<button onClick={connectOpenRouter}>Connect OpenRouter</button>}</div></div><div className="panel motion-card"><div className="panel-head"><h2>Motion Studio</h2><button onClick={()=>go('Motion Studio')}>New Project</button></div><button className="motion-preview" onClick={()=>go('Motion Studio')}><span className="play">▶</span></button><strong>Brand Intro Animation</strong><small>Motion graphics workspace</small></div></div></section>
   </>:<Workspace kind={active} onNotice={flash}/>}</div></main>
  {create&&<div className="modal-backdrop" onMouseDown={()=>setCreate(false)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><div><p className="eyebrow">CREATE</p><h2>Start something new</h2></div><button onClick={()=>setCreate(false)}><X/></button></div><div className="create-grid">{tools.map(t=>{const I=t.icon;return <button key={t.name} onClick={()=>{setCreate(false);go(t.name)}}><span className={`tool-icon ${t.tone}`}><I size={22}/></span><strong>{t.name}</strong></button>})}</div></div></div>}
  {ai&&<button className="ai-fab" onClick={()=>{setAi(false);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}}><Bot size={19}/> Workie AI</button>}{notice&&<div className="toast"><Activity size={17}/>{notice}</div>}
 </div>
}
export default App

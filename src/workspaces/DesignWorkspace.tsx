import { useEffect, useState, useRef } from 'react'
import { Plus, Save, Download, Trash2, Type, Square, Circle, Sparkles, Image as ImageIcon } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject } from '../lib/project-store'
import type { WorkieProject } from '../lib/db'

export interface DesignElement {
  id: string
  type: 'text' | 'rect' | 'circle'
  content?: string
  x: number
  y: number
  width: number
  height: number
  color: string
  fontSize?: number
}

interface DesignData {
  title: string
  subtitle: string
  size: string
  bgColor: string
  elements?: DesignElement[]
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

export function DesignWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: designs, reload } = useProjects('design')
  const [current, setCurrent] = useState<WorkieProject<DesignData> | null>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [size, setSize] = useState('1080 × 1080')
  const [bgColor, setBgColor] = useState('#7C3CFF')
  const [elements, setElements] = useState<DesignElement[]>([])
  const stageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (designs.length > 0) {
      const found = activeProjectId ? designs.find((d) => d.id === activeProjectId) : null
      const selected = found || current || designs[0]
      if (selected) {
        setCurrent(selected)
        setTitle(selected.data?.title || selected.name)
        setSubtitle(selected.data?.subtitle || '')
        setSize(selected.data?.size || '1080 × 1080')
        setBgColor(selected.data?.bgColor || '#7C3CFF')
        setElements(selected.data?.elements || [])
      }
    } else {
      setCurrent(null)
      setTitle('')
      setSubtitle('')
      setBgColor('#7C3CFF')
      setElements([])
    }
  }, [designs, activeProjectId])

  const handleCreateNew = async () => {
    const defaultData: DesignData = {
      title: '',
      subtitle: '',
      size: '1080 × 1080',
      bgColor: '#7C3CFF',
      elements: [],
    }
    const p = await createProject('design', 'Untitled Design', defaultData)
    setCurrent(p)
    setTitle('')
    setSubtitle('')
    setSize('1080 × 1080')
    setBgColor('#7C3CFF')
    setElements([])
    onNotice('New design created.')
  }


  const handleAddText = () => {
    const newEl: DesignElement = {
      id: crypto.randomUUID(),
      type: 'text',
      content: 'Click to edit text',
      x: 50,
      y: 50 + elements.length * 40,
      width: 250,
      height: 40,
      color: '#FFFFFF',
      fontSize: 18,
    }
    setElements((prev) => [...prev, newEl])
  }

  const handleAddShape = (type: 'rect' | 'circle') => {
    const newEl: DesignElement = {
      id: crypto.randomUUID(),
      type,
      x: 80,
      y: 80 + elements.length * 30,
      width: 100,
      height: 100,
      color: '#FFFFFF33',
    }
    setElements((prev) => [...prev, newEl])
  }

  const handleSave = async () => {
    const data: DesignData = { title, subtitle, size, bgColor, elements }
    if (!current) {
      const p = await createProject('design', title, data)
      setCurrent(p)
    } else {
      await saveProject({
        ...current,
        name: title,
        data,
      })
    }
    onNotice('Design saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Design deleted.')
    await reload()
  }

  const generateTemplate = (templateType: string) => {
    if (templateType === 'instagram') {
      setTitle('NEW ARRIVALS')
      setSubtitle('Explore the latest 2026 collection now')
      setSize('1080 × 1080')
      setBgColor('#181024')
    } else if (templateType === 'banner') {
      setTitle('GROW YOUR BUSINESS')
      setSubtitle('All-in-one AI powered creative workspace')
      setSize('1200 × 628')
      setBgColor('#7C3CFF')
    } else if (templateType === 'flyer') {
      setTitle('ANNUAL SUMMIT')
      setSubtitle('Join top industry leaders live')
      setSize('1080 × 1920')
      setBgColor('#2B0E5A')
    }
    onNotice(`Loaded ${templateType} layout template.`)
  }

  const exportAsImage = () => {
    // Generate Canvas export
    const canvas = document.createElement('canvas')
    const [wStr, hStr] = size.split('×').map((s) => s.trim())
    const w = parseInt(wStr, 10) || 1080
    const h = parseInt(hStr, 10) || 1080

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw background
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, w, h)

    // Draw elements
    elements.forEach((el) => {
      if (el.type === 'rect') {
        ctx.fillStyle = el.color
        ctx.fillRect(el.x * (w / 600), el.y * (h / 600), el.width * (w / 600), el.height * (h / 600))
      } else if (el.type === 'circle') {
        ctx.fillStyle = el.color
        ctx.beginPath()
        ctx.arc(
          (el.x + el.width / 2) * (w / 600),
          (el.y + el.height / 2) * (h / 600),
          (el.width / 2) * (w / 600),
          0,
          2 * Math.PI
        )
        ctx.fill()
      } else if (el.type === 'text') {
        ctx.fillStyle = el.color
        ctx.font = `bold ${ (el.fontSize || 20) * (w / 600) }px "Plus Jakarta Sans", sans-serif`
        ctx.fillText(el.content || '', el.x * (w / 600), (el.y + 25) * (h / 600))
      }
    })

    // Draw Main Title & Subtitle
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `800 ${(w / 18)}px "Plus Jakarta Sans", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(title, w / 2, h / 2 - 30)

    ctx.font = `400 ${(w / 35)}px "DM Sans", sans-serif`
    ctx.fillText(subtitle, w / 2, h / 2 + 30)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`
      a.click()
      URL.revokeObjectURL(url)
      onNotice('Design exported as PNG.')
    })
  }

  return (
    <div className="design-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <input className="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design Name" />
          <select value={size} onChange={(e) => setSize(e.target.value)} className="doc-select">
            <option value="1080 × 1080">Instagram (1080 × 1080)</option>
            <option value="1920 × 1080">HD Landscape (1920 × 1080)</option>
            <option value="1080 × 1920">Story / Reel (1080 × 1920)</option>
            <option value="1200 × 628">Banner (1200 × 628)</option>
          </select>
        </div>

        <div className="editor-actions">
          <button onClick={handleCreateNew}>
            <Plus size={16} /> New Design
          </button>
          <button onClick={handleAddText}>
            <Type size={16} /> Text
          </button>
          <button onClick={() => handleAddShape('rect')}>
            <Square size={16} /> Box
          </button>
          <button onClick={() => handleAddShape('circle')}>
            <Circle size={16} /> Circle
          </button>

          <div className="template-picker">
            <button onClick={() => generateTemplate('instagram')}>
              <Sparkles size={14} /> Insta Preset
            </button>
            <button onClick={() => generateTemplate('banner')}>
              <Sparkles size={14} /> Banner Preset
            </button>
          </div>

          <button onClick={handleSave}>
            <Save size={16} /> Save
          </button>
          <button onClick={exportAsImage} className="primary">
            <Download size={16} /> Export PNG
          </button>
          {current && (
            <button className="danger-btn" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="design-stage-container">
        <div className="design-sidebar">
          <label>
            Background Color:
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
          </label>
          <label>
            Headline Text:
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Subtitle Text:
            <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </label>
        </div>

        <div className="design-stage-outer">
          <div ref={stageRef} className="design-card-canvas" style={{ backgroundColor: bgColor }}>
            {elements.map((el) => (
              <div
                key={el.id}
                className="design-layer-item"
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  color: el.color,
                  backgroundColor: el.type !== 'text' ? el.color : undefined,
                  borderRadius: el.type === 'circle' ? '50%' : undefined,
                  fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                }}
              >
                {el.type === 'text' && el.content}
              </div>
            ))}
            <h1 className="stage-title">{title}</h1>
            <p className="stage-subtitle">{subtitle}</p>
            <div className="design-watermark">WORKIE DESIGN STUDIO</div>
          </div>
        </div>
      </div>
    </div>
  )
}

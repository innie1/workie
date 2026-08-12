import { useEffect, useState } from 'react'
import { Plus, Save, Download, Trash2, Play, Copy, ArrowUp, ArrowDown, Image as ImageIcon, LayoutTemplate, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject } from '../lib/project-store'
import type { WorkieProject } from '../lib/db'

export interface SlideItem {
  id: string
  title: string
  body: string
  bgColor?: string
  layout?: 'standard' | 'headline' | 'split' | 'quote'
}

interface SlideData {
  slides: SlideItem[]
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

export function SlidesWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: decks, reload } = useProjects('presentation')
  const [current, setCurrent] = useState<WorkieProject<SlideData> | null>(null)
  const [slides, setSlides] = useState<SlideItem[]>([])
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [name, setName] = useState('Untitled Presentation')
  const [isPresenting, setIsPresenting] = useState(false)
  const [presentIndex, setPresentIndex] = useState(0)

  useEffect(() => {
    if (decks.length > 0) {
      const found = activeProjectId ? decks.find((d) => d.id === activeProjectId) : null
      const selected = found || current || decks[0]
      if (selected) {
        setCurrent(selected)
        setName(selected.name)
        const loadedSlides = selected.data?.slides || []
        setSlides(loadedSlides)
        setActiveSlideIndex(0)
      }
    } else {
      setCurrent(null)
      setName('Untitled Presentation')
      setSlides([])
      setActiveSlideIndex(0)
    }
  }, [decks, activeProjectId])

  const activeSlide = slides[activeSlideIndex]

  const handleCreateNew = async () => {
    const initialSlides: SlideItem[] = [
      { id: crypto.randomUUID(), title: '', body: '', layout: 'standard' },
    ]
    const p = await createProject('presentation', 'Untitled Presentation', { slides: initialSlides })
    setCurrent(p)
    setName(p.name)
    setSlides(initialSlides)
    setActiveSlideIndex(0)
    onNotice('New presentation created.')
  }


  const updateSlide = (key: keyof SlideItem, val: string) => {
    if (!activeSlide) return
    setSlides((prev) =>
      prev.map((s, idx) => (idx === activeSlideIndex ? { ...s, [key]: val } : s))
    )
  }

  const addSlide = () => {
    const newSlide: SlideItem = {
      id: crypto.randomUUID(),
      title: 'New Slide Title',
      body: '• Bullet point 1\n• Bullet point 2',
      layout: 'standard',
    }
    setSlides((prev) => [...prev, newSlide])
    setActiveSlideIndex(slides.length)
  }

  const duplicateSlide = () => {
    if (!activeSlide) return
    const clone: SlideItem = {
      ...activeSlide,
      id: crypto.randomUUID(),
      title: `${activeSlide.title} (Copy)`,
    }
    setSlides((prev) => [...prev.slice(0, activeSlideIndex + 1), clone, ...prev.slice(activeSlideIndex + 1)])
    setActiveSlideIndex((i) => i + 1)
  }

  const removeSlide = () => {
    if (slides.length <= 1) return
    setSlides((prev) => prev.filter((_, idx) => idx !== activeSlideIndex))
    setActiveSlideIndex((i) => Math.max(0, i - 1))
  }

  const moveSlide = (dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? activeSlideIndex - 1 : activeSlideIndex + 1
    if (targetIdx < 0 || targetIdx >= slides.length) return
    const updated = [...slides]
    const temp = updated[activeSlideIndex]
    updated[activeSlideIndex] = updated[targetIdx]
    updated[targetIdx] = temp
    setSlides(updated)
    setActiveSlideIndex(targetIdx)
  }

  const handleSave = async () => {
    if (!current) {
      const p = await createProject('presentation', name, { slides })
      setCurrent(p)
    } else {
      await saveProject({
        ...current,
        name,
        data: { slides },
      })
    }
    onNotice('Presentation saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Presentation deleted.')
    await reload()
  }

  const exportAsText = () => {
    const text = slides.map((s, idx) => `=== SLIDE ${idx + 1}: ${s.title} ===\n${s.body}\n`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-slides.txt`
    a.click()
    URL.revokeObjectURL(url)
    onNotice('Exported presentation.')
  }

  const startPresentation = () => {
    if (slides.length === 0) return
    setPresentIndex(activeSlideIndex)
    setIsPresenting(true)
  }

  return (
    <div className="slides-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <input className="doc-title" value={name} onChange={(e) => setName(e.target.value)} placeholder="Deck Title" />
          {decks.length > 0 && (
            <select
              className="doc-select"
              value={current?.id || ''}
              onChange={(e) => {
                const found = decks.find((d) => d.id === e.target.value)
                if (found) {
                  setCurrent(found)
                  setName(found.name)
                  setSlides(found.data?.slides || [])
                  setActiveSlideIndex(0)
                }
              }}
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="editor-actions">
          <button onClick={handleCreateNew}>
            <Plus size={16} /> New Presentation
          </button>
          <button onClick={addSlide}>+ Add Slide</button>
          <button onClick={duplicateSlide}>
            <Copy size={16} /> Duplicate
          </button>
          <button onClick={startPresentation} className="primary">
            <Play size={16} /> Present
          </button>
          <button onClick={handleSave}>
            <Save size={16} /> Save
          </button>
          <button onClick={exportAsText}>
            <Download size={16} /> Export
          </button>
          {current && (
            <button className="danger-btn" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="slides-layout">
        {slides.length > 0 ? (
          <>
            <aside className="slide-list">
              <div className="slide-list-actions">
                <button onClick={() => moveSlide('up')} disabled={activeSlideIndex === 0}>
                  <ArrowUp size={14} /> Move Up
                </button>
                <button onClick={() => moveSlide('down')} disabled={activeSlideIndex === slides.length - 1}>
                  <ArrowDown size={14} /> Move Down
                </button>
              </div>

              {slides.map((s, i) => (
                <button
                  key={s.id || i}
                  className={`slide-thumb ${i === activeSlideIndex ? 'selected' : ''}`}
                  onClick={() => setActiveSlideIndex(i)}
                >
                  <span className="thumb-num">{i + 1}</span>
                  <div className="thumb-preview">
                    <strong>{s.title || 'Untitled Slide'}</strong>
                  </div>
                </button>
              ))}
            </aside>

            <div className="slide-canvas-area">
              <div className="slide-editor-bar">
                <label>
                  Layout:
                  <select
                    value={activeSlide?.layout || 'standard'}
                    onChange={(e) => updateSlide('layout', e.target.value)}
                  >
                    <option value="standard">Standard Bullet List</option>
                    <option value="headline">Big Title Banner</option>
                    <option value="quote">Callout Quote</option>
                  </select>
                </label>
                <button onClick={removeSlide} className="danger-btn">
                  Remove Slide
                </button>
              </div>

              <div className={`slide-paper layout-${activeSlide?.layout || 'standard'}`}>
                <input
                  className="slide-title-input"
                  value={activeSlide?.title || ''}
                  onChange={(e) => updateSlide('title', e.target.value)}
                  placeholder="Slide Title"
                />
                <textarea
                  className="slide-body-input"
                  value={activeSlide?.body || ''}
                  onChange={(e) => updateSlide('body', e.target.value)}
                  placeholder="Slide Content (one bullet point per line)"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="empty-center">
            <LayoutTemplate size={42} color="#7C3CFF" />
            <h2>No slides yet</h2>
            <p>Create a presentation or use Workie AI to generate a full deck.</p>
            <button className="primary" onClick={handleCreateNew}>
              <Plus size={16} /> Create Presentation
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Deck Player */}
      {isPresenting && (
        <div className="presentation-modal">
          <button className="close-present" onClick={() => setIsPresenting(false)}>
            <X size={24} /> Exit
          </button>
          <div className="present-slide">
            <h2>{slides[presentIndex]?.title}</h2>
            <div className="present-content">
              {slides[presentIndex]?.body.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>

          <div className="present-controls">
            <button onClick={() => setPresentIndex((i) => Math.max(0, i - 1))} disabled={presentIndex === 0}>
              <ChevronLeft size={20} /> Prev
            </button>
            <span>
              {presentIndex + 1} / {slides.length}
            </span>
            <button onClick={() => setPresentIndex((i) => Math.min(slides.length - 1, i + 1))} disabled={presentIndex === slides.length - 1}>
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

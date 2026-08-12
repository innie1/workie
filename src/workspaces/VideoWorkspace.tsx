import { useEffect, useState } from 'react'
import { Plus, Video, Play, Pause, Save, Download, Trash2, Scissors, Film } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject } from '../lib/project-store'
import type { WorkieProject } from '../lib/db'

export interface VideoClip {
  id: string
  name: string
  startTime: number
  duration: number
  type: 'video' | 'text' | 'transition'
  text?: string
}

interface VideoData {
  name: string
  clips: VideoClip[]
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

export function VideoWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: videoProjects, reload } = useProjects('video')
  const [current, setCurrent] = useState<WorkieProject<VideoData> | null>(null)
  const [name, setName] = useState('Video Project')
  const [playing, setPlaying] = useState(false)
  const [clips, setClips] = useState<VideoClip[]>([
    { id: '1', name: 'Intro Text Banner', startTime: 0, duration: 4, type: 'text', text: 'Welcome to Workie Video' },
    { id: '2', name: 'Main Scene Clip', startTime: 4, duration: 8, type: 'video' },
    { id: '3', name: 'Fade Transition', startTime: 12, duration: 2, type: 'transition' },
  ])

  useEffect(() => {
    if (videoProjects.length > 0) {
      const found = activeProjectId ? videoProjects.find((v) => v.id === activeProjectId) : null
      const selected = found || current || videoProjects[0]
      if (selected) {
        setCurrent(selected)
        setName(selected.name)
        setClips(selected.data?.clips || [])
      }
    }
  }, [videoProjects, activeProjectId])

  const handleCreateNew = async () => {
    const defaultClips: VideoClip[] = [
      { id: crypto.randomUUID(), name: 'Scene 1: Introduction', startTime: 0, duration: 5, type: 'text', text: 'Workie Product Demo' },
    ]
    const p = await createProject('video', 'New Video Project', { name: 'New Video Project', clips: defaultClips })
    setCurrent(p)
    setName(p.name)
    setClips(defaultClips)
    onNotice('New video project created.')
  }

  const addClip = (type: 'video' | 'text' | 'transition') => {
    const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0)
    const newClip: VideoClip = {
      id: crypto.randomUUID(),
      name: type === 'text' ? 'Text Overlay' : type === 'transition' ? 'Dissolve Transition' : 'Video Footage Clip',
      startTime: totalDuration,
      duration: 4,
      type,
      text: type === 'text' ? 'Add Overlay Text' : undefined,
    }
    setClips((prev) => [...prev, newClip])
    onNotice(`Added ${type} layer.`)
  }

  const handleSave = async () => {
    const data: VideoData = { name, clips }
    if (!current) {
      const p = await createProject('video', name, data)
      setCurrent(p)
    } else {
      await saveProject({
        ...current,
        name,
        data,
      })
    }
    onNotice('Video project saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Video project deleted.')
    await reload()
  }

  return (
    <div className="media-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <input className="doc-title" value={name} onChange={(e) => setName(e.target.value)} placeholder="Video Project Name" />
          {videoProjects.length > 0 && (
            <select
              className="doc-select"
              value={current?.id || ''}
              onChange={(e) => {
                const found = videoProjects.find((v) => v.id === e.target.value)
                if (found) {
                  setCurrent(found)
                  setName(found.name)
                  setClips(found.data?.clips || [])
                }
              }}
            >
              {videoProjects.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="editor-actions">
          <button onClick={handleCreateNew}>
            <Plus size={16} /> New Video Project
          </button>
          <button onClick={() => addClip('video')}>+ Media Track</button>
          <button onClick={() => addClip('text')}>+ Text Overlay</button>
          <button onClick={() => addClip('transition')}>+ Transition</button>

          <button onClick={() => setPlaying((p) => !p)} className="primary">
            {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Play Timeline'}
          </button>
          <button onClick={handleSave}>
            <Save size={16} /> Save
          </button>
          {current && (
            <button className="danger-btn" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="video-stage">
        <div className="video-player-box">
          <Film size={48} color="#7C3CFF" />
          <h3>Video Preview Canvas</h3>
          <p>{playing ? 'Playing video timeline...' : 'Timeline paused at 0:00'}</p>
        </div>
      </div>

      <div className="timeline-panel">
        <div className="timeline-header">
          <span>Video Tracks Timeline ({clips.reduce((s, c) => s + c.duration, 0)}s total)</span>
        </div>
        <div className="video-tracks-list">
          {clips.map((clip, i) => (
            <div key={clip.id} className={`video-track-item track-${clip.type}`}>
              <div className="track-info">
                <strong>{clip.name}</strong>
                <small>{clip.duration}s duration</small>
              </div>
              {clip.type === 'text' && (
                <input
                  className="clip-text-input"
                  value={clip.text || ''}
                  onChange={(e) => {
                    const txt = e.target.value
                    setClips((prev) => prev.map((c) => (c.id === clip.id ? { ...c, text: txt } : c)))
                  }}
                />
              )}
              <div className="track-actions">
                <button
                  onClick={() => {
                    setClips((prev) => prev.filter((c) => c.id !== clip.id))
                  }}
                  className="danger-btn"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

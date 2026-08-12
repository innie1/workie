import { useEffect, useState, useRef } from 'react'
import { Plus, Play, Pause, Save, Download, Trash2, Layers, Move, RefreshCw, Zap } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject } from '../lib/project-store'
import type { WorkieProject } from '../lib/db'

export interface MotionLayer {
  id: string
  name: string
  text: string
  type: 'text' | 'shape' | 'badge'
  color: string
}

export interface Keyframe {
  timePercent: number // 0 to 100
  x: number // position %
  y: number // position %
  scale: number // 0.5 to 2
  rotation: number // degrees
  opacity: number // 0 to 1
}

interface MotionData {
  duration: number
  text: string
  x: number
  frames: number[]
  layers?: MotionLayer[]
  keyframes?: Keyframe[]
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

export function MotionWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: motionProjects, reload } = useProjects('motion')
  const [current, setCurrent] = useState<WorkieProject<MotionData> | null>(null)
  const [name, setName] = useState('Untitled Motion')
  const [duration, setDuration] = useState(10)
  const [playing, setPlaying] = useState(false)
  const [text, setText] = useState('')
  const [playheadPercent, setPlayheadPercent] = useState(0)

  // Motion properties
  const [xPos, setXPos] = useState(50)
  const [yPos, setYPos] = useState(50)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [opacity, setOpacity] = useState(1)

  const [keyframes, setKeyframes] = useState<Keyframe[]>([])

  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (motionProjects.length > 0) {
      const found = activeProjectId ? motionProjects.find((m) => m.id === activeProjectId) : null
      const selected = found || current || motionProjects[0]
      if (selected) {
        setCurrent(selected)
        setName(selected.name)
        setDuration(selected.data?.duration || 10)
        setText(selected.data?.text || '')
        if (selected.data?.keyframes) {
          setKeyframes(selected.data.keyframes)
        }
      }
    } else {
      setCurrent(null)
      setName('Untitled Motion')
      setText('')
      setKeyframes([])
    }
  }, [motionProjects, activeProjectId])


  // Animation Loop engine
  useEffect(() => {
    if (!playing) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = (timestamp - startTimeRef.current) / 1000
      const currentPercent = (elapsed / duration) * 100

      if (currentPercent >= 100) {
        setPlayheadPercent(100)
        setPlaying(false)
        startTimeRef.current = null
        return
      }

      setPlayheadPercent(currentPercent)
      interpolateKeyframes(currentPercent)
      animFrameRef.current = requestAnimationFrame(animate)
    }

    startTimeRef.current = null
    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [playing, duration, keyframes])

  const interpolateKeyframes = (percent: number) => {
    if (keyframes.length === 0) return
    const sorted = [...keyframes].sort((a, b) => a.timePercent - b.timePercent)

    // Before first keyframe
    if (percent <= sorted[0].timePercent) {
      setXPos(sorted[0].x)
      setYPos(sorted[0].y)
      setScale(sorted[0].scale)
      setRotation(sorted[0].rotation)
      setOpacity(sorted[0].opacity)
      return
    }

    // After last keyframe
    if (percent >= sorted[sorted.length - 1].timePercent) {
      const last = sorted[sorted.length - 1]
      setXPos(last.x)
      setYPos(last.y)
      setScale(last.scale)
      setRotation(last.rotation)
      setOpacity(last.opacity)
      return
    }

    // Interpolate between two surrounding keyframes
    for (let i = 0; i < sorted.length - 1; i++) {
      const k1 = sorted[i]
      const k2 = sorted[i + 1]
      if (percent >= k1.timePercent && percent <= k2.timePercent) {
        const range = k2.timePercent - k1.timePercent
        const progress = range === 0 ? 0 : (percent - k1.timePercent) / range
        setXPos(k1.x + (k2.x - k1.x) * progress)
        setYPos(k1.y + (k2.y - k1.y) * progress)
        setScale(k1.scale + (k2.scale - k1.scale) * progress)
        setRotation(k1.rotation + (k2.rotation - k1.rotation) * progress)
        setOpacity(k1.opacity + (k2.opacity - k1.opacity) * progress)
        break
      }
    }
  }

  const handleCreateNew = async () => {
    const defaultData: MotionData = {
      duration: 10,
      text: '',
      x: 50,
      frames: [],
      keyframes: [],
    }
    const p = await createProject('motion', 'Untitled Motion', defaultData)
    setCurrent(p)
    setName(p.name)
    setDuration(10)
    setText('')
    setKeyframes([])
    onNotice('New motion project created.')
  }


  const addKeyframeAtPlayhead = () => {
    const newKf: Keyframe = {
      timePercent: Math.round(playheadPercent),
      x: Math.round(xPos),
      y: Math.round(yPos),
      scale,
      rotation,
      opacity,
    }
    setKeyframes((prev) => [...prev.filter((k) => Math.abs(k.timePercent - newKf.timePercent) > 2), newKf])
    onNotice(`Keyframe added at ${Math.round(playheadPercent)}%.`)
  }

  const handleSave = async () => {
    const data: MotionData = {
      duration,
      text,
      x: xPos,
      frames: keyframes.map((k) => k.timePercent),
      keyframes,
    }
    if (!current) {
      const p = await createProject('motion', name, data)
      setCurrent(p)
    } else {
      await saveProject({
        ...current,
        name,
        data,
      })
    }
    onNotice('Motion project saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Motion project deleted.')
    await reload()
  }

  return (
    <div className="motion-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <input className="doc-title" value={name} onChange={(e) => setName(e.target.value)} placeholder="Motion Project Name" />
          {motionProjects.length > 0 && (
            <select
              className="doc-select"
              value={current?.id || ''}
              onChange={(e) => {
                const found = motionProjects.find((m) => m.id === e.target.value)
                if (found) {
                  setCurrent(found)
                  setName(found.name)
                  setText(found.data?.text || '')
                  setDuration(found.data?.duration || 10)
                  if (found.data?.keyframes) setKeyframes(found.data.keyframes)
                }
              }}
            >
              {motionProjects.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="editor-actions">
          <button onClick={handleCreateNew}>
            <Plus size={16} /> New Motion Project
          </button>
          <button onClick={() => setPlaying((v) => !v)} className="primary">
            {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Preview'}
          </button>
          <button onClick={addKeyframeAtPlayhead}>+ Keyframe</button>
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

      <div className="motion-stage-area">
        <div
          className="motion-canvas"
          style={{
            transform: `scale(1)`,
          }}
        >
          <div
            className="animated-layer-text"
            style={{
              left: `${xPos}%`,
              top: `${yPos}%`,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
              opacity,
            }}
          >
            <span>{text}</span>
          </div>
        </div>
      </div>

      <div className="motion-controls-panel">
        <div className="control-group">
          <label>
            Text Content:
            <input value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label>
            Duration (Seconds):
            <input type="number" min="1" max="60" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 10)} />
          </label>
        </div>

        <div className="control-group properties">
          <label>
            Position X ({Math.round(xPos)}%):
            <input
              type="range"
              min="0"
              max="100"
              value={xPos}
              onChange={(e) => {
                setXPos(Number(e.target.value))
                if (playing) setPlaying(false)
              }}
            />
          </label>
          <label>
            Position Y ({Math.round(yPos)}%):
            <input
              type="range"
              min="0"
              max="100"
              value={yPos}
              onChange={(e) => {
                setYPos(Number(e.target.value))
                if (playing) setPlaying(false)
              }}
            />
          </label>
          <label>
            Scale ({scale.toFixed(1)}x):
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={scale}
              onChange={(e) => {
                setScale(Number(e.target.value))
                if (playing) setPlaying(false)
              }}
            />
          </label>
          <label>
            Rotation ({rotation}°):
            <input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => {
                setRotation(Number(e.target.value))
                if (playing) setPlaying(false)
              }}
            />
          </label>
          <label>
            Opacity ({Math.round(opacity * 100)}%):
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacity}
              onChange={(e) => {
                setOpacity(Number(e.target.value))
                if (playing) setPlaying(false)
              }}
            />
          </label>
        </div>
      </div>

      <div className="timeline-panel">
        <div className="timeline-header">
          <span>Timeline (0s - {duration}s)</span>
          <span>Playhead: {playheadPercent.toFixed(1)}%</span>
        </div>
        <div
          className="timeline-track"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const clickPercent = ((e.clientX - rect.left) / rect.width) * 100
            setPlayheadPercent(clickPercent)
            interpolateKeyframes(clickPercent)
          }}
        >
          <div className="track-fill" style={{ width: `${playheadPercent}%` }} />
          <div className="playhead-line" style={{ left: `${playheadPercent}%` }} />

          {keyframes.map((kf, i) => (
            <div
              key={i}
              className="keyframe-marker"
              style={{ left: `${kf.timePercent}%` }}
              title={`Keyframe ${i + 1} at ${kf.timePercent}%`}
              onClick={(e) => {
                e.stopPropagation()
                setPlayheadPercent(kf.timePercent)
                interpolateKeyframes(kf.timePercent)
              }}
            >
              ◆
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

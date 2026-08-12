import { useEffect, useState } from 'react'
import { Plus, Music2, Play, Pause, Save, Trash2, Volume2, Mic } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject } from '../lib/project-store'
import type { WorkieProject } from '../lib/db'

export interface AudioTrack {
  id: string
  name: string
  type: 'voiceover' | 'music' | 'sfx'
  volume: number // 0 to 100
  duration: number
  muted?: boolean
}

interface AudioData {
  name: string
  tracks: AudioTrack[]
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

export function AudioWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: audioProjects, reload } = useProjects('audio')
  const [current, setCurrent] = useState<WorkieProject<AudioData> | null>(null)
  const [name, setName] = useState('Audio Composition')
  const [playing, setPlaying] = useState(false)
  const [tracks, setTracks] = useState<AudioTrack[]>([
    { id: '1', name: 'AI Voiceover - Intro', type: 'voiceover', volume: 90, duration: 15 },
    { id: '2', name: 'Background Music Track', type: 'music', volume: 45, duration: 30 },
  ])

  useEffect(() => {
    if (audioProjects.length > 0) {
      const found = activeProjectId ? audioProjects.find((a) => a.id === activeProjectId) : null
      const selected = found || current || audioProjects[0]
      if (selected) {
        setCurrent(selected)
        setName(selected.name)
        setTracks(selected.data?.tracks || [])
      }
    }
  }, [audioProjects, activeProjectId])

  const handleCreateNew = async () => {
    const defaultTracks: AudioTrack[] = [
      { id: crypto.randomUUID(), name: 'Main Vocal Track', type: 'voiceover', volume: 80, duration: 20 },
    ]
    const p = await createProject('audio', 'New Audio Project', { name: 'New Audio Project', tracks: defaultTracks })
    setCurrent(p)
    setName(p.name)
    setTracks(defaultTracks)
    onNotice('New audio project created.')
  }

  const addTrack = (type: 'voiceover' | 'music' | 'sfx') => {
    const newTrack: AudioTrack = {
      id: crypto.randomUUID(),
      name: type === 'voiceover' ? 'Voiceover Narration' : type === 'music' ? 'Background Track' : 'Sound Effect',
      type,
      volume: 75,
      duration: 15,
    }
    setTracks((prev) => [...prev, newTrack])
    onNotice(`Added ${type} track.`)
  }

  const handleSave = async () => {
    const data: AudioData = { name, tracks }
    if (!current) {
      const p = await createProject('audio', name, data)
      setCurrent(p)
    } else {
      await saveProject({
        ...current,
        name,
        data,
      })
    }
    onNotice('Audio project saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Audio project deleted.')
    await reload()
  }

  return (
    <div className="media-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <input className="doc-title" value={name} onChange={(e) => setName(e.target.value)} placeholder="Audio Project Name" />
          {audioProjects.length > 0 && (
            <select
              className="doc-select"
              value={current?.id || ''}
              onChange={(e) => {
                const found = audioProjects.find((a) => a.id === e.target.value)
                if (found) {
                  setCurrent(found)
                  setName(found.name)
                  setTracks(found.data?.tracks || [])
                }
              }}
            >
              {audioProjects.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="editor-actions">
          <button onClick={handleCreateNew}>
            <Plus size={16} /> New Audio Project
          </button>
          <button onClick={() => addTrack('voiceover')}>+ Voiceover</button>
          <button onClick={() => addTrack('music')}>+ Music</button>
          <button onClick={() => addTrack('sfx')}>+ SFX</button>

          <button onClick={() => setPlaying((p) => !p)} className="primary">
            {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Pause' : 'Play Audio'}
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

      <div className="audio-stage">
        <div className="audio-player-box">
          <Music2 size={48} color="#7C3CFF" />
          <h3>Audio Workstation Studio</h3>
          <p>{playing ? 'Playing multitrack audio...' : 'Audio engine idle'}</p>
        </div>
      </div>

      <div className="timeline-panel">
        <div className="timeline-header">
          <span>Audio Multitrack Mix</span>
        </div>
        <div className="audio-tracks-list">
          {tracks.map((track) => (
            <div key={track.id} className="audio-track-item">
              <div className="track-icon">
                {track.type === 'voiceover' ? <Mic size={18} /> : <Music2 size={18} />}
              </div>
              <div className="track-details">
                <strong>{track.name}</strong>
                <small>{track.duration}s</small>
              </div>

              <div className="track-volume">
                <Volume2 size={16} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={track.volume}
                  onChange={(e) => {
                    const vol = Number(e.target.value)
                    setTracks((prev) => prev.map((t) => (t.id === track.id ? { ...t, volume: vol } : t)))
                  }}
                />
                <span>{track.volume}%</span>
              </div>

              <button
                className="danger-btn"
                onClick={() => {
                  setTracks((prev) => prev.filter((t) => t.id !== track.id))
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

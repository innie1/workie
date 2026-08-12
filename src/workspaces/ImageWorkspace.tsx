import { useEffect, useState } from 'react'
import { Plus, Sparkles, Download, Save, Trash2, Image as ImageIcon } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject } from '../lib/project-store'
import { getAIConfig } from '../lib/workie-ai'
import type { WorkieProject } from '../lib/db'

interface ImageData {
  prompt: string
  style: string
  imageUrl?: string
  history?: Array<{ prompt: string; url: string; createdAt: number }>
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

export function ImageWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: imageProjects, reload } = useProjects('image')
  const [current, setCurrent] = useState<WorkieProject<ImageData> | null>(null)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('Photorealistic')
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const aiConfig = getAIConfig()

  useEffect(() => {
    if (imageProjects.length > 0) {
      const found = activeProjectId ? imageProjects.find((i) => i.id === activeProjectId) : null
      const selected = found || current || imageProjects[0]
      if (selected) {
        setCurrent(selected)
        setPrompt(selected.data?.prompt || '')
        setStyle(selected.data?.style || 'Photorealistic')
        setImageUrl(selected.data?.imageUrl || null)
      }
    }
  }, [imageProjects, activeProjectId])

  const handleCreateNew = async () => {
    const p = await createProject('image', 'New Image Project', { prompt: '', style: 'Photorealistic' })
    setCurrent(p)
    setPrompt('')
    setImageUrl(null)
    setErrorMsg(null)
    onNotice('New image project created.')
  }

  const generateImage = async () => {
    if (!prompt.trim()) return
    setErrorMsg(null)

    if (!aiConfig.openRouterKey) {
      setErrorMsg('Connect an AI provider in Settings to generate images.')
      onNotice('AI Provider not connected.')
      return
    }

    setGenerating(true)
    try {
      // Call OpenRouter image generation API or OpenAI compatible endpoint
      const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.openRouterKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.imageModel || 'stabilityai/sdxl',
          prompt: `${prompt}, ${style} style, high quality 4k resolution`,
          n: 1,
          size: '1024x1024',
        }),
      })

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      const generatedUrl = data?.data?.[0]?.url || data?.images?.[0]?.url
      if (generatedUrl) {
        setImageUrl(generatedUrl)
        if (current) {
          await saveProject({
            ...current,
            name: `Image: ${prompt.slice(0, 20)}...`,
            data: { prompt, style, imageUrl: generatedUrl },
          })
        }
        onNotice('Image generated successfully!')
      } else {
        throw new Error('Image generation completed but no image URL returned.')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Image generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!current) return
    await saveProject({
      ...current,
      name: prompt ? `Image: ${prompt.slice(0, 20)}` : 'Image Project',
      data: { prompt, style, imageUrl: imageUrl || undefined },
    })
    onNotice('Image project saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Image project deleted.')
    await reload()
  }

  return (
    <div className="media-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <strong>Image Studio</strong>
        </div>
        <div className="editor-actions">
          <button onClick={handleCreateNew}>
            <Plus size={16} /> New Image Project
          </button>
          {current && (
            <button onClick={handleSave}>
              <Save size={16} /> Save
            </button>
          )}
          {current && (
            <button className="danger-btn" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="image-gen-box">
        <div className="prompt-row">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create (e.g. Futuristic glass skyscraper in Lagos sunset)..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') generateImage()
            }}
          />
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="Photorealistic">Photorealistic</option>
            <option value="Minimalist Vector">Minimalist Vector</option>
            <option value="3D Render">3D Render</option>
            <option value="Cyberpunk">Cyberpunk</option>
            <option value="Anime / Illustration">Anime / Illustration</option>
          </select>
          <button onClick={generateImage} disabled={generating} className="primary">
            <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate Image'}
          </button>
        </div>

        {!aiConfig.openRouterKey && (
          <div className="provider-warning">
            <Sparkles size={18} />
            <span>Connect an AI provider to generate images.</span>
          </div>
        )}

        {errorMsg && <div className="error-box">{errorMsg}</div>}
      </div>

      <div className="image-preview-stage">
        {imageUrl ? (
          <div className="generated-image-card">
            <img src={imageUrl} alt={prompt} />
            <div className="image-card-actions">
              <a href={imageUrl} download="workie-generated-image.png" target="_blank" rel="noreferrer" className="button">
                <Download size={16} /> Download High-Res
              </a>
            </div>
          </div>
        ) : (
          <div className="empty-center">
            <ImageIcon size={48} color="#7C3CFF" />
            <h3>No image generated yet</h3>
            <p>Type a prompt above and click Generate Image.</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { X, Sparkles, Key, HardDrive, Cpu, Check, AlertCircle } from 'lucide-react'
import { getAIConfig, saveAIConfig, loadLocalGemma, getGemmaStatus } from '../lib/workie-ai'

interface Props {
  onClose: () => void
  onNotice: (msg: string) => void
}

export function SettingsModal({ onClose, onNotice }: Props) {
  const [config, setConfig] = useState(getAIConfig())
  const [openRouterKeyInput, setOpenRouterKeyInput] = useState(config.openRouterKey)
  const [gemmaStatus, setGemmaStatus] = useState(getGemmaStatus())
  const [installing, setInstalling] = useState(false)

  const handleSaveAIConfig = () => {
    saveAIConfig({
      openRouterKey: openRouterKeyInput,
      reasoningModel: config.reasoningModel,
      textModel: config.textModel,
      imageModel: config.imageModel,
    })
    setConfig(getAIConfig())
    onNotice('AI Settings updated.')
  }

  const handleInstallGemma = async () => {
    setInstalling(true)
    onNotice('Downloading Gemma 4 E2B Q4 model (~3 GB). This runs entirely in your browser.')
    try {
      await loadLocalGemma((percent) => {
        setGemmaStatus(getGemmaStatus())
      })
      setGemmaStatus(getGemmaStatus())
      onNotice('Gemma 4 is ready on this device!')
    } catch (err: any) {
      onNotice(err?.message || 'Gemma installation failed.')
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal settings-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">SETTINGS</p>
            <h2>Workie Workstation Configuration</h2>
          </div>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* Cloud AI Section */}
          <section className="settings-section">
            <h3>
              <Key size={18} /> OpenRouter Cloud AI Provider
            </h3>
            <p className="section-desc">
              Connect your own OpenRouter API key to use cloud AI models. Your key is stored securely in your browser and never sent to any third-party server.
            </p>

            <div className="form-group">
              <label>OpenRouter API Key:</label>
              <input
                type="password"
                value={openRouterKeyInput}
                onChange={(e) => setOpenRouterKeyInput(e.target.value)}
                placeholder="sk-or-v1-..."
              />
            </div>

            <div className="model-selectors">
              <div className="form-group">
                <label>Text Model:</label>
                <select
                  value={config.textModel}
                  onChange={(e) => setConfig({ ...config, textModel: e.target.value })}
                >
                  <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini</option>
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                  <option value="google/gemini-flash-1.5">Gemini 1.5 Flash</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reasoning Model:</label>
                <select
                  value={config.reasoningModel}
                  onChange={(e) => setConfig({ ...config, reasoningModel: e.target.value })}
                >
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="deepseek/deepseek-r1">DeepSeek R1</option>
                  <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                </select>
              </div>

              <div className="form-group">
                <label>Image Generation Model:</label>
                <select
                  value={config.imageModel}
                  onChange={(e) => setConfig({ ...config, imageModel: e.target.value })}
                >
                  <option value="stabilityai/sdxl">Stable Diffusion XL</option>
                  <option value="black-forest-labs/flux-1-schnell">Flux 1 Schnell</option>
                  <option value="openai/dall-e-3">DALL-E 3</option>
                </select>
              </div>
            </div>

            <button className="primary" onClick={handleSaveAIConfig}>
              Save OpenRouter Settings
            </button>
          </section>

          {/* Local Gemma AI Section */}
          <section className="settings-section">
            <h3>
              <Cpu size={18} /> Local Gemma (Private On-Device AI)
            </h3>
            <p className="section-desc">
              Run Gemma locally inside your browser via WebAssembly. Works 100% offline with zero data leaving your device.
            </p>

            <div className="gemma-box">
              {gemmaStatus.ready ? (
                <div className="gemma-badge ready">
                  <Check size={18} />
                  <span>Gemma ready on this device</span>
                </div>
              ) : (
                <div className="gemma-install-box">
                  {gemmaStatus.loading ? (
                    <div>
                      <p>Downloading Gemma 4 model... ({gemmaStatus.progress}%)</p>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${gemmaStatus.progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button className="secondary" onClick={handleInstallGemma} disabled={installing}>
                      <Sparkles size={16} /> Install Gemma locally (~3 GB)
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* PWA & Storage Section */}
          <section className="settings-section">
            <h3>
              <HardDrive size={18} /> Storage & PWA
            </h3>
            <p className="section-desc">
              Workie uses IndexedDB for persistent local project storage.
            </p>
            <div className="storage-info">
              <span>Local Database: IndexedDB (WorkieDB v1)</span>
              <span>PWA Offline Shell: Registered</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

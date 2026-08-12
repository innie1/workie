import { parseIntentToToolCall, executeTool, type ToolCallResult } from './workie-tools'

export type WorkieAIProvider = 'local-gemma' | 'openrouter' | 'fallback'
export interface WorkieAIConfig { openRouterKey: string; reasoningModel: string; textModel: string; imageModel: string }
export interface WorkieAIRequest { prompt: string; context?: string }
export interface WorkieAIResponse { text: string; provider: WorkieAIProvider; toolResult?: ToolCallResult }
export interface GemmaStatus { ready: boolean; loading: boolean; progress: number; error?: string }

const STORAGE_KEYS = { REASONING_MODEL: 'workie.ai.reasoning_model', TEXT_MODEL: 'workie.ai.text_model', IMAGE_MODEL: 'workie.ai.image_model' }
let wllamaInstance: any = null
let loadingPromise: Promise<void> | null = null
let gemmaState: GemmaStatus = { ready: false, loading: false, progress: 0 }
const MODEL_CONFIG = { repo: 'reeselevine/wllama-split-models', file: 'gemma-4-E2B-it-Q4_0-00001-of-00005.gguf' }

export function getGemmaStatus(): GemmaStatus { return { ...gemmaState } }
export function getAIConfig(): WorkieAIConfig {
  return {
    // API keys are deliberately not persisted by this client module. The secure server-side proxy should supply the key.
    openRouterKey: '',
    reasoningModel: localStorage.getItem(STORAGE_KEYS.REASONING_MODEL) || 'openai/gpt-4o-mini',
    textModel: localStorage.getItem(STORAGE_KEYS.TEXT_MODEL) || 'openai/gpt-4o-mini',
    imageModel: localStorage.getItem(STORAGE_KEYS.IMAGE_MODEL) || '',
  }
}
export function saveAIConfig(config: Partial<WorkieAIConfig>) {
  if (config.reasoningModel) localStorage.setItem(STORAGE_KEYS.REASONING_MODEL, config.reasoningModel)
  if (config.textModel) localStorage.setItem(STORAGE_KEYS.TEXT_MODEL, config.textModel)
  if (config.imageModel !== undefined) localStorage.setItem(STORAGE_KEYS.IMAGE_MODEL, config.imageModel)
}

export async function loadLocalGemma(onProgress?: (percent: number) => void): Promise<void> {
  if (wllamaInstance) { gemmaState = { ready: true, loading: false, progress: 100 }; return }
  if (loadingPromise) return loadingPromise
  gemmaState = { ready: false, loading: true, progress: 0 }
  loadingPromise = (async () => {
    try {
      const { Wllama } = await import('@wllama/wllama')
      const wllama = new Wllama({
        'single-thread/wllama.wasm': 'https://unpkg.com/@wllama/wllama@2.2.0/esm/single-thread/wllama.wasm',
        'multi-thread/wllama.wasm': 'https://unpkg.com/@wllama/wllama@2.2.0/esm/multi-thread/wllama.wasm',
      } as any)
      await wllama.loadModelFromHF(MODEL_CONFIG as any, { progressCallback: ({ loaded, total }: { loaded: number; total: number }) => { const percent = total ? Math.round(loaded / total * 100) : 0; gemmaState = { ready: false, loading: true, progress: percent }; onProgress?.(percent) } } as any)
      wllamaInstance = wllama
      gemmaState = { ready: true, loading: false, progress: 100 }
    } catch (err: any) { gemmaState = { ready: false, loading: false, progress: 0, error: err?.message || 'Failed to load Gemma' }; throw err }
  })()
  try { await loadingPromise } finally { loadingPromise = null }
}

async function askOpenRouter(request: WorkieAIRequest, config: WorkieAIConfig): Promise<string> {
  // Cloud calls must go through a configured server-side proxy. No secret is accepted from localStorage.
  const proxy = import.meta.env.VITE_WORKIE_AI_PROXY as string | undefined
  if (!proxy) throw new Error('OpenRouter is not configured. Add the Workie AI proxy before using cloud AI.')
  const response = await fetch(proxy, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: config.textModel, messages: [{ role: 'system', content: 'You are Workie AI, a concise productivity assistant.' }, { role: 'user', content: request.context ? `Context: ${request.context}\n\nPrompt: ${request.prompt}` : request.prompt }] }) })
  if (!response.ok) throw new Error(`AI proxy HTTP ${response.status}`)
  const data = await response.json()
  return data?.choices?.[0]?.message?.content || 'No response returned.'
}

export async function askWorkieAI(request: WorkieAIRequest): Promise<WorkieAIResponse> {
  const toolCall = parseIntentToToolCall(request.prompt)
  if (toolCall) { const toolResult = await executeTool(toolCall.toolName, toolCall.args); return { text: toolResult.message, provider: 'fallback', toolResult } }
  const config = getAIConfig()
  if (wllamaInstance) {
    try {
      const completion = await wllamaInstance.createChatCompletion({ messages: [{ role: 'system', content: 'You are Workie AI. Be concise and helpful.' }, { role: 'user', content: request.prompt }], max_tokens: 512, temperature: 0.7 })
      return { text: completion?.choices?.[0]?.message?.content || completion?.choices?.[0]?.text || '', provider: 'local-gemma' }
    } catch (e) { console.warn('Local Gemma execution failed:', e) }
  }
  try { return { text: await askOpenRouter(request, config), provider: 'openrouter' } }
  catch (e: any) { return { text: e?.message || 'AI is not configured yet. Install Gemma or configure the Workie AI proxy.', provider: 'fallback' } }
}

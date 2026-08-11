import { Wllama } from '@wllama/wllama'
import WasmFromCDN from '@wllama/wllama/esm/wasm-from-cdn.js'

export type WorkieAIProvider = 'local-gemma' | 'remote-gemma'
export type WorkieAIRequest = { prompt: string; context?: string }
export type WorkieAIResponse = { text: string; provider: WorkieAIProvider }

type Status = { ready: boolean; loading: boolean; progress: number }
let runtime: Wllama | null = null
let loading: Promise<void> | null = null
let status: Status = { ready: false, loading: false, progress: 0 }

const MODEL = { repo: 'reeselevine/wllama-split-models', file: 'gemma-4-E2B-it-Q4_0-00001-of-00005.gguf' }

export function getGemmaStatus(): Status { return { ...status } }

export async function loadLocalGemma(onProgress?: (percent: number) => void) {
  if (runtime) { status = { ready: true, loading: false, progress: 100 }; return }
  if (loading) return loading
  status = { ready: false, loading: true, progress: 0 }
  loading = (async () => {
    const wllama = new Wllama(WasmFromCDN as any)
    await wllama.loadModelFromHF(MODEL, { progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
      const percent = total ? Math.round((loaded / total) * 100) : 0
      status = { ready: false, loading: true, progress: percent }
      onProgress?.(percent)
    } } as any)
    runtime = wllama
    status = { ready: true, loading: false, progress: 100 }
  })()
  try { await loading } finally { loading = null }
}

export async function askWorkieAI(request: WorkieAIRequest): Promise<WorkieAIResponse> {
  const endpoint = import.meta.env.VITE_GEMMA_ENDPOINT as string | undefined
  if (runtime) {
    const response = await runtime.createChatCompletion({ messages: [
      { role: 'system', content: 'You are Workie, an AI productivity assistant inside an all-in-one workspace. Be concise. When useful, suggest a concrete action in Workie.' },
      { role: 'user', content: `${request.context ? `Context: ${request.context}\n\n` : ''}${request.prompt}` },
    ], max_tokens: 512, temperature: 0.7, top_p: 0.9 } as any)
    const text = (response as any)?.choices?.[0]?.message?.content || (response as any)?.choices?.[0]?.text || ''
    return { text, provider: 'local-gemma' }
  }
  if (endpoint) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: import.meta.env.VITE_GEMMA_MODEL || 'gemma-4-E2B-it', prompt: request.prompt, context: request.context || '' }) })
    if (!response.ok) throw new Error(`Gemma endpoint returned ${response.status}`)
    const data = await response.json()
    return { text: data.text ?? data.response ?? '', provider: 'remote-gemma' }
  }
  return { text: 'Install Gemma 4 locally from the Workie AI card to enable on-device AI. The model is downloaded once and then runs in your browser.', provider: 'local-gemma' }
}

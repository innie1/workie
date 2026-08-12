import { parseIntentToToolCall, executeTool, type ToolCallResult } from './workie-tools'

export type WorkieAIProvider = 'local-gemma' | 'openrouter' | 'fallback'

export interface WorkieAIConfig {
  openRouterKey: string
  reasoningModel: string
  textModel: string
  imageModel: string
}

export interface WorkieAIRequest {
  prompt: string
  context?: string
}

export interface WorkieAIResponse {
  text: string
  provider: WorkieAIProvider
  toolResult?: ToolCallResult
}

export interface GemmaStatus {
  ready: boolean
  loading: boolean
  progress: number
  error?: string
}

const STORAGE_KEYS = {
  OPENROUTER_KEY: 'workie.openrouter.key',
  REASONING_MODEL: 'workie.ai.reasoning_model',
  TEXT_MODEL: 'workie.ai.text_model',
  IMAGE_MODEL: 'workie.ai.image_model',
}

let wllamaInstance: any = null
let loadingPromise: Promise<void> | null = null
let gemmaState: GemmaStatus = { ready: false, loading: false, progress: 0 }

const MODEL_CONFIG = {
  repo: 'reeselevine/wllama-split-models',
  file: 'gemma-4-E2B-it-Q4_0-00001-of-00005.gguf',
}

export function getGemmaStatus(): GemmaStatus {
  return { ...gemmaState }
}

export function getAIConfig(): WorkieAIConfig {
  return {
    openRouterKey: localStorage.getItem(STORAGE_KEYS.OPENROUTER_KEY) || '',
    reasoningModel: localStorage.getItem(STORAGE_KEYS.REASONING_MODEL) || 'anthropic/claude-3.5-sonnet',
    textModel: localStorage.getItem(STORAGE_KEYS.TEXT_MODEL) || 'openai/gpt-4o-mini',
    imageModel: localStorage.getItem(STORAGE_KEYS.IMAGE_MODEL) || 'stabilityai/sdxl',
  }
}

export function saveAIConfig(config: Partial<WorkieAIConfig>) {
  if (config.openRouterKey !== undefined) {
    if (config.openRouterKey.trim()) localStorage.setItem(STORAGE_KEYS.OPENROUTER_KEY, config.openRouterKey.trim())
    else localStorage.removeItem(STORAGE_KEYS.OPENROUTER_KEY)
  }
  if (config.reasoningModel) localStorage.setItem(STORAGE_KEYS.REASONING_MODEL, config.reasoningModel)
  if (config.textModel) localStorage.setItem(STORAGE_KEYS.TEXT_MODEL, config.textModel)
  if (config.imageModel) localStorage.setItem(STORAGE_KEYS.IMAGE_MODEL, config.imageModel)
}

export async function loadLocalGemma(onProgress?: (percent: number) => void): Promise<void> {
  if (wllamaInstance) {
    gemmaState = { ready: true, loading: false, progress: 100 }
    return
  }
  if (loadingPromise) return loadingPromise

  gemmaState = { ready: false, loading: true, progress: 0 }
  loadingPromise = (async () => {
    try {
      // Lazy load @wllama/wllama to isolate bundle dependencies
      const { Wllama } = await import('@wllama/wllama')
      const wllama = new Wllama({
        'single-thread/wllama.wasm': 'https://unpkg.com/@wllama/wllama@2.2.0/esm/single-thread/wllama.wasm',
        'multi-thread/wllama.wasm': 'https://unpkg.com/@wllama/wllama@2.2.0/esm/multi-thread/wllama.wasm',
      } as any)

      await wllama.loadModelFromHF(MODEL_CONFIG as any, {
        progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
          const percent = total ? Math.round((loaded / total) * 100) : 0
          gemmaState = { ready: false, loading: true, progress: percent }
          onProgress?.(percent)
        },
      } as any)
      wllamaInstance = wllama
      gemmaState = { ready: true, loading: false, progress: 100 }
    } catch (err: any) {
      gemmaState = { ready: false, loading: false, progress: 0, error: err?.message || 'Failed to load Gemma' }
      throw err
    }
  })()

  try {
    await loadingPromise
  } finally {
    loadingPromise = null
  }
}

async function askOpenRouter(request: WorkieAIRequest, config: WorkieAIConfig): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openRouterKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Workie PWA',
    },
    body: JSON.stringify({
      model: config.textModel || 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are Workie AI, an intelligent productivity assistant embedded in Workie workstation. Provide concise, direct, helpful answers.',
        },
        {
          role: 'user',
          content: request.context ? `Context: ${request.context}\n\nPrompt: ${request.prompt}` : request.prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter HTTP ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || 'No response returned from OpenRouter.'
}

export async function askWorkieAI(request: WorkieAIRequest): Promise<WorkieAIResponse> {
  // First, check if the prompt expresses a direct creation tool action
  const toolCall = parseIntentToToolCall(request.prompt)
  if (toolCall) {
    const toolResult = await executeTool(toolCall.toolName, toolCall.args)
    return {
      text: toolResult.message,
      provider: 'fallback',
      toolResult,
    }
  }

  const config = getAIConfig()

  // 1. Try Local Gemma if loaded
  if (wllamaInstance) {
    try {
      const completion = await wllamaInstance.createChatCompletion({
        messages: [
          { role: 'system', content: 'You are Workie AI. Be concise and helpful.' },
          { role: 'user', content: request.prompt },
        ],
        max_tokens: 512,
        temperature: 0.7,
      })
      const text = completion?.choices?.[0]?.message?.content || completion?.choices?.[0]?.text || ''
      return { text, provider: 'local-gemma' }
    } catch (e) {
      console.warn('Local Gemma execution failed, trying cloud fallback:', e)
    }
  }

  // 2. Try OpenRouter if configured
  if (config.openRouterKey) {
    try {
      const text = await askOpenRouter(request, config)
      return { text, provider: 'openrouter' }
    } catch (e: any) {
      return {
        text: `OpenRouter Error: ${e?.message || 'Could not connect'}. You can check your API key in Settings.`,
        provider: 'openrouter',
      }
    }
  }

  // 3. Clean fallback
  return {
    text: `Workie processed your request. Connect OpenRouter in Settings or Install Gemma locally for AI-generated text assistance.`,
    provider: 'fallback',
  }
}

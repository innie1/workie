export type WorkieAIProvider = 'local-gemma' | 'remote-gemma'
export type WorkieAIRequest = { prompt: string; context?: string }
export type WorkieAIResponse = { text: string; provider: WorkieAIProvider }
export async function askWorkieAI(request: WorkieAIRequest): Promise<WorkieAIResponse> {
  const endpoint = import.meta.env.VITE_GEMMA_ENDPOINT as string | undefined
  if (endpoint) {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: import.meta.env.VITE_GEMMA_MODEL || 'gemma-4-e4b-it', prompt: request.prompt, context: request.context || '' }) })
    if (!response.ok) throw new Error(`Gemma endpoint returned ${response.status}`)
    const data = await response.json()
    return { text: data.text ?? data.response ?? '', provider: 'remote-gemma' }
  }
  return { text: 'Gemma 4 is ready to connect. Add a local Gemma runtime or VITE_GEMMA_ENDPOINT to enable AI actions.', provider: 'local-gemma' }
}

export type WorkieActionName =
  | 'open_docs'
  | 'open_sheets'
  | 'open_slides'
  | 'open_design'
  | 'open_motion'
  | 'open_video'
  | 'open_images'
  | 'open_audio'

export type WorkieAction = {
  name: WorkieActionName
  arguments?: Record<string, unknown>
}

const aliases: Record<string, WorkieActionName> = {
  document: 'open_docs',
  docs: 'open_docs',
  write: 'open_docs',
  spreadsheet: 'open_sheets',
  sheet: 'open_sheets',
  sheets: 'open_sheets',
  presentation: 'open_slides',
  slides: 'open_slides',
  design: 'open_design',
  graphic: 'open_design',
  motion: 'open_motion',
  animation: 'open_motion',
  'motion graphic': 'open_motion',
  video: 'open_video',
  image: 'open_images',
  images: 'open_images',
  audio: 'open_audio',
}

export const WORKIE_TOOL_SCHEMAS = Object.entries(aliases).slice(0, 8).map(([label, name]) => ({
  type: 'function',
  function: {
    name,
    description: `Open the ${label} workspace in Workie.`,
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
}))

export function interpretWorkieAction(prompt: string): WorkieAction | null {
  const text = prompt.toLowerCase()
  const ordered: Array<[string, WorkieActionName]> = [
    ['motion graphic', 'open_motion'],
    ['presentation', 'open_slides'],
    ['spreadsheet', 'open_sheets'],
    ['document', 'open_docs'],
    ['design', 'open_design'],
    ['animation', 'open_motion'],
    ['video', 'open_video'],
    ['image', 'open_images'],
    ['audio', 'open_audio'],
  ]
  const match = ordered.find(([phrase]) => text.includes(phrase))
  return match ? { name: match[1] } : null
}

export function workspaceForAction(action: WorkieAction): string {
  const map: Record<WorkieActionName, string> = {
    open_docs: 'Docs',
    open_sheets: 'Sheets',
    open_slides: 'Slides',
    open_design: 'Design',
    open_motion: 'Motion Studio',
    open_video: 'Video',
    open_images: 'Images',
    open_audio: 'Audio',
  }
  return map[action.name]
}

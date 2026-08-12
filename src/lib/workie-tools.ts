import { createProject, saveProject, deleteProject, getProjectById } from './project-store'
import type { WorkieProject, ProjectType } from './db'

export type WorkieToolName =
  | 'create_document' | 'open_document' | 'edit_document' | 'delete_document'
  | 'create_spreadsheet' | 'edit_spreadsheet' | 'create_presentation' | 'add_slide' | 'edit_slide'
  | 'create_design' | 'create_motion_project' | 'add_motion_layer' | 'set_keyframe'
  | 'create_image' | 'open_project' | 'save_project' | 'export_project'

export interface ToolCallResult { tool: WorkieToolName; message: string; projectId?: string; workspace?: string; project?: WorkieProject }

export const WORKIE_TOOLS = [
  { name: 'create_document', description: 'Create a document.', parameters: { type: 'object', properties: { title: { type: 'string' }, body: { type: 'string' } }, required: ['title'] } },
  { name: 'create_spreadsheet', description: 'Create a spreadsheet. Do not invent user data; rows are optional.', parameters: { type: 'object', properties: { name: { type: 'string' }, headers: { type: 'array', items: { type: 'string' } }, rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } } }, required: ['name'] } },
  { name: 'create_presentation', description: 'Create a presentation from supplied slide content.', parameters: { type: 'object', properties: { title: { type: 'string' }, slides: { type: 'array' } }, required: ['title', 'slides'] } },
  { name: 'create_design', description: 'Create a design project.', parameters: { type: 'object', properties: { name: { type: 'string' }, size: { type: 'string' }, headline: { type: 'string' }, subheadline: { type: 'string' }, bgColor: { type: 'string' } }, required: ['name'] } },
  { name: 'create_motion_project', description: 'Create a motion graphics project.', parameters: { type: 'object', properties: { name: { type: 'string' }, duration: { type: 'number' }, text: { type: 'string' }, keyframes: { type: 'array' } }, required: ['name'] } },
  { name: 'create_image', description: 'Create an image-generation project from a prompt.', parameters: { type: 'object', properties: { prompt: { type: 'string' }, style: { type: 'string' } }, required: ['prompt'] } },
]

export function mapProjectToWorkspace(type: ProjectType): string {
  return ({ document: 'Docs', spreadsheet: 'Sheets', presentation: 'Slides', design: 'Design', motion: 'Motion Studio', image: 'Images', video: 'Video', audio: 'Audio' } as Record<ProjectType, string>)[type] || 'Home'
}

export async function executeTool(toolName: string, args: any): Promise<ToolCallResult> {
  if (toolName === 'create_document') {
    const title = args.title || 'Untitled Document'
    const project = await createProject('document', title, { title, body: args.body || '' })
    return { tool: 'create_document', message: `Created document "${project.name}".`, projectId: project.id, workspace: 'Docs', project }
  }
  if (toolName === 'create_spreadsheet') {
    const name = args.name || 'Untitled Spreadsheet'
    const headers = Array.isArray(args.headers) ? args.headers : []
    const rows = Array.isArray(args.rows) ? args.rows : (headers.length ? [headers] : [])
    const project = await createProject('spreadsheet', name, { rows })
    return { tool: 'create_spreadsheet', message: `Created spreadsheet "${project.name}".`, projectId: project.id, workspace: 'Sheets', project }
  }
  if (toolName === 'create_presentation') {
    const title = args.title || 'Untitled Presentation'
    const slides = Array.isArray(args.slides) ? args.slides.map((s: any) => ({ title: s.title || 'Slide', body: Array.isArray(s.bullets) ? s.bullets.map((b: string) => `• ${b}`).join('\n') : (s.body || '') })) : []
    const project = await createProject('presentation', title, { slides })
    return { tool: 'create_presentation', message: `Created presentation "${project.name}" with ${slides.length} slides.`, projectId: project.id, workspace: 'Slides', project }
  }
  if (toolName === 'create_design') {
    const name = args.name || 'Untitled Design'
    const project = await createProject('design', name, { title: args.headline || '', subtitle: args.subheadline || '', size: args.size || '1080 × 1080', bgColor: args.bgColor || '#7C3CFF' })
    return { tool: 'create_design', message: `Created design "${project.name}".`, projectId: project.id, workspace: 'Design', project }
  }
  if (toolName === 'create_motion_project') {
    const name = args.name || 'Untitled Motion'
    const keyframes = Array.isArray(args.keyframes) ? args.keyframes : []
    const project = await createProject('motion', name, { duration: Number(args.duration) || 10, text: args.text || '', frames: keyframes })
    return { tool: 'create_motion_project', message: `Created motion project "${project.name}".`, projectId: project.id, workspace: 'Motion Studio', project }
  }
  if (toolName === 'create_image') {
    const prompt = args.prompt || ''
    const project = await createProject('image', prompt ? `Image: ${prompt.slice(0, 30)}` : 'Untitled Image', { prompt, style: args.style || '', images: [] })
    return { tool: 'create_image', message: 'Created image project.', projectId: project.id, workspace: 'Images', project }
  }
  throw new Error(`Unknown tool: ${toolName}`)
}

export function parseIntentToToolCall(prompt: string): { toolName: WorkieToolName; args: any } | null {
  const p = prompt.toLowerCase().trim()
  if (p.includes('presentation') || p.includes('slides') || p.includes('deck')) return { toolName: 'create_presentation', args: { title: prompt, slides: [] } }
  if (p.includes('motion') || p.includes('advert') || p.includes('animation') || p.includes('animated')) return { toolName: 'create_motion_project', args: { name: prompt, duration: p.includes('15') ? 15 : 10, text: prompt, keyframes: [] } }
  if (p.includes('spreadsheet') || p.includes('sheet') || p.includes('expense') || p.includes('budget') || p.includes('revenue') || p.includes('financial')) return { toolName: 'create_spreadsheet', args: { name: prompt, headers: [], rows: [] } }
  if (p.includes('proposal') || p.includes('document') || p.includes('report') || p.includes('write')) return { toolName: 'create_document', args: { title: prompt, body: '' } }
  if (p.includes('design') || p.includes('flyer') || p.includes('banner') || p.includes('poster')) return { toolName: 'create_design', args: { name: prompt } }
  if (p.includes('image') || p.includes('picture') || p.includes('photo') || p.includes('illustration')) return { toolName: 'create_image', args: { prompt } }
  return null
}

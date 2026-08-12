import { createProject, saveProject, deleteProject, getProjectById } from './project-store'
import type { WorkieProject, ProjectType } from './db'

export type WorkieToolName =
  | 'create_document'
  | 'open_document'
  | 'edit_document'
  | 'delete_document'
  | 'create_spreadsheet'
  | 'edit_spreadsheet'
  | 'create_presentation'
  | 'add_slide'
  | 'edit_slide'
  | 'create_design'
  | 'create_motion_project'
  | 'add_motion_layer'
  | 'set_keyframe'
  | 'create_image'
  | 'open_project'
  | 'save_project'
  | 'export_project'

export interface ToolCallResult {
  tool: WorkieToolName
  message: string
  projectId?: string
  workspace?: string
  project?: WorkieProject
}

export const WORKIE_TOOLS = [
  {
    name: 'create_document',
    description: 'Create a new document with title and optional body content.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the document' },
        body: { type: 'string', description: 'Content/body of the document' },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_spreadsheet',
    description: 'Create a spreadsheet with title, columns, and initial row data.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the spreadsheet' },
        headers: { type: 'array', items: { type: 'string' }, description: 'Column headers' },
        rows: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: 'Row data grid' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_presentation',
    description: 'Create a full multi-slide presentation deck on a topic.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the presentation' },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              bullets: { type: 'array', items: { type: 'string' } },
            },
            required: ['title', 'bullets'],
          },
        },
      },
      required: ['title', 'slides'],
    },
  },
  {
    name: 'create_design',
    description: 'Create a visual graphic design project with dimensions, title, and elements.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Design title' },
        size: { type: 'string', description: 'Canvas size like 1080x1080 or 1920x1080' },
        headline: { type: 'string' },
        subheadline: { type: 'string' },
        bgColor: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_motion_project',
    description: 'Create an animated motion graphic project with timeline keyframes and layers.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Motion project name' },
        duration: { type: 'number', description: 'Duration in seconds (e.g. 10 or 15)' },
        text: { type: 'string', description: 'Main animated text overlay' },
        keyframes: { type: 'array', items: { type: 'number' }, description: 'Keyframe timestamps in percent' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_image',
    description: 'Create an image generation project from a text prompt.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Image description prompt' },
        style: { type: 'string', description: 'Visual style like Photorealistic or Vector' },
      },
      required: ['prompt'],
    },
  },
]

export function mapProjectToWorkspace(type: ProjectType): string {
  const map: Record<ProjectType, string> = {
    document: 'Docs',
    spreadsheet: 'Sheets',
    presentation: 'Slides',
    design: 'Design',
    motion: 'Motion Studio',
    image: 'Images',
    video: 'Video',
    audio: 'Audio',
  }
  return map[type] || 'Home'
}

/**
 * Executes a tool call directly, creating real projects in IndexedDB.
 */
export async function executeTool(toolName: string, args: any): Promise<ToolCallResult> {
  if (toolName === 'create_document') {
    const title = args.title || 'Untitled Document'
    const body = args.body || ''
    const project = await createProject('document', title, { title, body })
    return {
      tool: 'create_document',
      message: `Created document "${project.name}".`,
      projectId: project.id,
      workspace: 'Docs',
      project,
    }
  }

  if (toolName === 'create_spreadsheet') {
    const name = args.name || 'Expense Spreadsheet'
    const headers = args.headers || ['Category', 'Description', 'Amount', 'Date']
    const sampleRows = args.rows || [
      headers,
      ['Rent', 'Office space rental', '1200', '2026-08-01'],
      ['Utilities', 'Electricity & Internet', '250', '2026-08-03'],
      ['Software', 'Cloud services & tools', '340', '2026-08-05'],
      ['Total', '=SUM(C2:C4)', '', ''],
    ]
    const project = await createProject('spreadsheet', name, { rows: sampleRows })
    return {
      tool: 'create_spreadsheet',
      message: `Created spreadsheet "${project.name}".`,
      projectId: project.id,
      workspace: 'Sheets',
      project,
    }
  }

  if (toolName === 'create_presentation') {
    const title = args.title || 'Presentation'
    const inputSlides = args.slides || []
    const slidesData = inputSlides.length > 0 ? inputSlides.map((s: any) => ({
      title: s.title || 'Slide',
      body: Array.isArray(s.bullets) ? s.bullets.map((b: string) => `• ${b}`).join('\n') : (s.body || ''),
    })) : [
      { title: title, body: '• Overview of key goals\n• Market opportunities\n• Execution strategy' },
      { title: 'Market Strategy', body: '• Target audience identification\n• Competitive advantages\n• Growth metrics' },
      { title: 'Financial Plan', body: '• Revenue projections\n• Operating costs\n• Milestone timeline' },
    ]
    const project = await createProject('presentation', title, { slides: slidesData })
    return {
      tool: 'create_presentation',
      message: `Created presentation "${project.name}" with ${slidesData.length} slides.`,
      projectId: project.id,
      workspace: 'Slides',
      project,
    }
  }

  if (toolName === 'create_design') {
    const name = args.name || 'Marketing Graphic'
    const size = args.size || '1080 × 1080'
    const headline = args.headline || name
    const subheadline = args.subheadline || 'Designed with Workie AI'
    const project = await createProject('design', name, {
      title: headline,
      subtitle: subheadline,
      size,
      bgColor: args.bgColor || '#7C3CFF',
    })
    return {
      tool: 'create_design',
      message: `Created design "${project.name}".`,
      projectId: project.id,
      workspace: 'Design',
      project,
    }
  }

  if (toolName === 'create_motion_project') {
    const name = args.name || 'Motion Advert'
    const duration = args.duration || 10
    const text = args.text || 'Workie Motion Graphic'
    const keyframes = args.keyframes || [20, 50, 80]
    const project = await createProject('motion', name, {
      duration,
      text,
      frames: keyframes,
      x: keyframes[0] || 20,
    })
    return {
      tool: 'create_motion_project',
      message: `Created motion project "${project.name}".`,
      projectId: project.id,
      workspace: 'Motion Studio',
      project,
    }
  }

  if (toolName === 'create_image') {
    const prompt = args.prompt || 'Modern minimal art'
    const style = args.style || 'Digital Painting'
    const project = await createProject('image', `Image: ${prompt.slice(0, 20)}...`, {
      prompt,
      style,
      images: [],
    })
    return {
      tool: 'create_image',
      message: `Created image project for "${prompt}".`,
      projectId: project.id,
      workspace: 'Images',
      project,
    }
  }

  throw new Error(`Unknown tool: ${toolName}`)
}

/**
 * Intelligent prompt parser that detects user creation intent and returns structured tool parameters.
 */
export function parseIntentToToolCall(prompt: string): { toolName: WorkieToolName; args: any } | null {
  const p = prompt.toLowerCase().trim()

  // Presentation intent
  if (p.includes('presentation') || p.includes('slides') || p.includes('deck')) {
    const isNigeria = p.includes('nigeria') || p.includes('business')
    const topicMatch = prompt.replace(/(create|make|build|a|an|the|presentation|slides|deck|about|for)/gi, '').trim()
    const topic = topicMatch ? topicMatch.charAt(0).toUpperCase() + topicMatch.slice(1) : 'Business Overview'

    const slides = isNigeria ? [
      { title: `Starting a Small Business in ${topic.includes('Nigeria') ? 'Nigeria' : topic}`, bullets: ['Executive Summary & Vision', 'Legal Setup & CAC Registration', 'Target Customer Segments'] },
      { title: 'Market Opportunity & Research', bullets: ['Population demographics', 'Mobile money & digital payments growth', 'Unmet consumer demands'] },
      { title: 'Operational Strategy & Logistics', bullets: ['Local vendor sourcing', 'Distribution networks in key cities', 'Staffing & operational workflows'] },
      { title: 'Financial Forecast & Funding', bullets: ['Startup capital requirements', 'Pricing & margin targets', 'Cash flow management'] },
      { title: 'Growth & Expansion Roadmap', bullets: ['Digital marketing campaigns', 'Partnership development', 'Year 1 key milestones'] },
    ] : [
      { title: topic, bullets: ['Key Objectives', 'Problem Statement', 'Proposed Solution'] },
      { title: 'Market Overview', bullets: ['Industry Growth Trends', 'Target Audience', 'Competitive Edge'] },
      { title: 'Action Plan', bullets: ['Phase 1: Launch', 'Phase 2: Scale', 'Phase 3: Optimize'] },
      { title: 'Conclusion', bullets: ['Next steps & call to action'] },
    ]

    return {
      toolName: 'create_presentation',
      args: { title: `${topic} Presentation`, slides },
    }
  }

  // Motion graphic advert intent
  if (p.includes('motion') || p.includes('advert') || p.includes('animation') || p.includes('animated')) {
    const textMatch = prompt.replace(/(create|make|build|a|an|15|10|second|animated|advert|motion|graphic|project)/gi, '').trim()
    const text = textMatch ? textMatch.toUpperCase() : 'BOOST YOUR BRAND'
    return {
      toolName: 'create_motion_project',
      args: {
        name: `${text.slice(0, 15)} Motion`,
        duration: p.includes('15') ? 15 : 10,
        text,
        keyframes: [15, 45, 75],
      },
    }
  }

  // Spreadsheet / expenses intent
  if (p.includes('spreadsheet') || p.includes('sheet') || p.includes('expense') || p.includes('budget') || p.includes('revenue') || p.includes('financial')) {
    const isExpenses = p.includes('expense') || p.includes('monthly')
    return {
      toolName: 'create_spreadsheet',
      args: {
        name: isExpenses ? 'Monthly Expense Tracker' : 'Financial Planning Workbook',
        headers: ['Category', 'Description', 'Planned ($)', 'Actual ($)'],
        rows: [
          ['Category', 'Description', 'Planned ($)', 'Actual ($)'],
          ['Office Rent', 'Monthly facility lease', '1500', '1500'],
          ['Software Subscriptions', 'SaaS tools and AI utilities', '400', '380'],
          ['Marketing', 'Social media ads & promotion', '800', '650'],
          ['Utilities', 'Power & internet lines', '250', '210'],
          ['Total', '=SUM(C2:C5)', '=SUM(D2:D5)', ''],
        ],
      },
    }
  }

  // Proposal / Document intent
  if (p.includes('proposal') || p.includes('document') || p.includes('report') || p.includes('doc') || p.includes('write') || p.includes('summarize')) {
    const topic = prompt.replace(/(create|make|write|a|an|business|proposal|document|summary|summarize)/gi, '').trim()
    const docTitle = topic ? `${topic.charAt(0).toUpperCase() + topic.slice(1)} Proposal` : 'Business Proposal'
    const body = `# ${docTitle}\n\n## Executive Summary\nThis proposal outlines the strategic goals, scope, and key deliverables for ${topic || 'our initiative'}.\n\n## Objectives\n- Accelerate operational efficiency\n- Implement modern creative and AI workflows\n- Maximize return on investment\n\n## Next Steps\nReview the timeline and confirm resources for execution.`
    return {
      toolName: 'create_document',
      args: { title: docTitle, body },
    }
  }

  // Design / Flyer intent
  if (p.includes('design') || p.includes('flyer') || p.includes('banner') || p.includes('poster') || p.includes('instagram')) {
    const topic = prompt.replace(/(design|create|make|a|an|flyer|poster|banner|instagram)/gi, '').trim()
    return {
      toolName: 'create_design',
      args: {
        name: topic ? `${topic} Design` : 'Creative Flyer',
        size: p.includes('instagram') ? '1080 × 1080' : '1200 × 628',
        headline: topic ? topic.toUpperCase() : 'SPECIAL PROMOTION',
        subheadline: 'Crafted with Workie Design Studio',
      },
    }
  }

  // Image intent
  if (p.includes('image') || p.includes('picture') || p.includes('photo') || p.includes('illustration')) {
    return {
      toolName: 'create_image',
      args: { prompt: prompt },
    }
  }

  return null
}

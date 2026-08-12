import { DocsWorkspace } from './workspaces/DocsWorkspace'
import { SheetsWorkspace } from './workspaces/SheetsWorkspace'
import { SlidesWorkspace } from './workspaces/SlidesWorkspace'
import { DesignWorkspace } from './workspaces/DesignWorkspace'
import { MotionWorkspace } from './workspaces/MotionWorkspace'
import { ImageWorkspace } from './workspaces/ImageWorkspace'
import { VideoWorkspace } from './workspaces/VideoWorkspace'
import { AudioWorkspace } from './workspaces/AudioWorkspace'

interface WorkspaceProps {
  kind: string
  activeProjectId?: string | null
  onNotice: (message: string) => void
}

export default function Workspace({ kind, activeProjectId, onNotice }: WorkspaceProps) {
  if (kind === 'Docs' || kind === 'document') {
    return <DocsWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }
  if (kind === 'Sheets' || kind === 'spreadsheet') {
    return <SheetsWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }
  if (kind === 'Slides' || kind === 'presentation') {
    return <SlidesWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }
  if (kind === 'Design' || kind === 'design') {
    return <DesignWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }
  if (kind === 'Motion Studio' || kind === 'motion') {
    return <MotionWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }
  if (kind === 'Images' || kind === 'image') {
    return <ImageWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }
  if (kind === 'Video' || kind === 'video') {
    return <VideoWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }
  if (kind === 'Audio' || kind === 'audio') {
    return <AudioWorkspace activeProjectId={activeProjectId} onNotice={onNotice} />
  }

  return (
    <div className="tool-page">
      <h2>{kind} Workspace</h2>
      <p>Workspace ready.</p>
    </div>
  )
}

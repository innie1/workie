import { useEffect, useMemo, useState, useRef } from 'react'
import { Plus, Save, Download, Upload, Trash2, BarChart2, Filter, ArrowUpDown } from 'lucide-react'
import { useProjects, createProject, saveProject, deleteProject } from '../lib/project-store'
import type { WorkieProject } from '../lib/db'

type Grid = string[][]

interface SheetData {
  rows: Grid
}

interface Props {
  activeProjectId?: string | null
  onNotice: (msg: string) => void
}

function evaluateFormula(cellValue: string, grid: Grid): string {
  if (!cellValue.startsWith('=')) return cellValue
  const expr = cellValue.slice(1).toUpperCase().trim()

  // Evaluate SUM e.g. SUM(C2:C10) or SUM(A1,B1)
  const sumMatch = expr.match(/^SUM\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/)
  if (sumMatch) {
    const [, start, end] = sumMatch
    const vals = getRangeValues(start, end, grid)
    const sum = vals.reduce((a, b) => a + (Number(b) || 0), 0)
    return String(sum)
  }

  const avgMatch = expr.match(/^AVERAGE\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)$/)
  if (avgMatch) {
    const [, start, end] = avgMatch
    const vals = getRangeValues(start, end, grid)
    if (!vals.length) return '0'
    const sum = vals.reduce((a, b) => a + (Number(b) || 0), 0)
    return String((sum / vals.length).toFixed(2))
  }

  // Simple math evaluation like A1+B1
  try {
    const replaced = expr.replace(/[A-Z]+[0-9]+/g, (ref) => {
      const val = getCellValueByRef(ref, grid)
      return String(Number(val) || 0)
    })
    // Safe evaluation using Function
    const res = new Function(`return ${replaced}`)()
    return String(res)
  } catch {
    return '#ERROR!'
  }
}

function cellRefToCoords(ref: string): [number, number] | null {
  const match = ref.match(/^([A-Z]+)([0-9]+)$/)
  if (!match) return null
  const colStr = match[1]
  const rowNum = parseInt(match[2], 10) - 1

  let colIdx = 0
  for (let i = 0; i < colStr.length; i++) {
    colIdx = colIdx * 26 + (colStr.charCodeAt(i) - 64)
  }
  return [rowNum, colIdx - 1]
}

function getCellValueByRef(ref: string, grid: Grid): string {
  const coords = cellRefToCoords(ref)
  if (!coords) return '0'
  const [r, c] = coords
  return grid[r]?.[c] || '0'
}

function getRangeValues(startRef: string, endRef: string, grid: Grid): string[] {
  const start = cellRefToCoords(startRef)
  const end = cellRefToCoords(endRef)
  if (!start || !end) return []

  const values: string[] = []
  const [r1, c1] = start
  const [r2, c2] = end

  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      values.push(grid[r]?.[c] || '')
    }
  }
  return values
}

export function SheetsWorkspace({ activeProjectId, onNotice }: Props) {
  const { projects: sheets, reload } = useProjects('spreadsheet')
  const [current, setCurrent] = useState<WorkieProject<SheetData> | null>(null)
  const emptyGrid: Grid = [
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
  ]
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [name, setName] = useState('Untitled Spreadsheet')
  const [showChart, setShowChart] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (sheets.length > 0) {
      const found = activeProjectId ? sheets.find((s) => s.id === activeProjectId) : null
      const selected = found || current || sheets[0]
      if (selected) {
        setCurrent(selected)
        setName(selected.name)
        setGrid(selected.data?.rows || emptyGrid)
      }
    } else {
      setCurrent(null)
      setName('Untitled Spreadsheet')
      setGrid(emptyGrid)
    }
  }, [sheets, activeProjectId])

  const handleCreateNew = async () => {
    const p = await createProject('spreadsheet', 'Untitled Spreadsheet', { rows: emptyGrid })
    setCurrent(p)
    setName(p.name)
    setGrid(emptyGrid)
    onNotice('New spreadsheet created.')
  }


  const updateCell = (r: number, c: number, value: string) => {
    setGrid((prev) => prev.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row)))
  }

  const addRow = () => {
    const colCount = grid[0]?.length || 4
    const newRow = new Array(colCount).fill('')
    setGrid((g) => [...g, newRow])
  }

  const removeRow = (r: number) => {
    if (grid.length <= 1) return
    setGrid((g) => g.filter((_, ri) => ri !== r))
  }

  const addColumn = () => {
    setGrid((g) => g.map((row) => [...row, '']))
  }

  const removeColumn = () => {
    if ((grid[0]?.length || 0) <= 1) return
    setGrid((g) => g.map((row) => row.slice(0, -1)))
  }

  const handleSave = async () => {
    if (!current) {
      const p = await createProject('spreadsheet', name, { rows: grid })
      setCurrent(p)
    } else {
      await saveProject({
        ...current,
        name,
        data: { rows: grid },
      })
    }
    onNotice('Spreadsheet saved.')
  }

  const handleDelete = async () => {
    if (!current) return
    await deleteProject(current.id)
    onNotice('Spreadsheet deleted.')
    await reload()
  }

  const handleCSVExport = () => {
    const csvContent = grid
      .map((row) => row.map((cell, c) => `"${evaluateFormula(cell, grid).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.toLowerCase().replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onNotice('Exported to CSV.')
  }

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      if (text) {
        const lines = text.split(/\r?\n/).map((line) => line.split(',').map((cell) => cell.replace(/^"|"$/g, '')))
        if (lines.length > 0) {
          setGrid(lines)
          onNotice('CSV Imported.')
        }
      }
    }
    reader.readAsText(file)
  }

  // AI Commands
  const handleAIAddTotalColumn = () => {
    setGrid((g) => {
      const headers = [...g[0], 'Total / Sum']
      const rows = g.slice(1).map((r, i) => {
        const firstColRef = `C${i + 2}`
        const lastColRef = String.fromCharCode(65 + Math.max(0, r.length - 1)) + (i + 2)
        return [...r, `=SUM(${firstColRef}:${lastColRef})`]
      })
      return [headers, ...rows]
    })
    onNotice('AI added Total Column formula.')
  }

  // Compute calculated values for rendering
  const computedGrid = useMemo(() => {
    return grid.map((row) => row.map((cell) => evaluateFormula(cell, grid)))
  }, [grid])

  // Extract chart numerical data
  const chartData = useMemo(() => {
    const labels: string[] = []
    const values: number[] = []

    // Look for rows with a string label in col 0 and numeric value in col 1 or 2
    for (let r = 1; r < computedGrid.length; r++) {
      const label = computedGrid[r][0]
      const valStr = computedGrid[r][1] || computedGrid[r][2] || '0'
      const val = parseFloat(valStr)
      if (label && !isNaN(val) && label.toLowerCase() !== 'total') {
        labels.push(label)
        values.push(val)
      }
    }
    const maxVal = Math.max(...values, 1)
    return { labels, values, maxVal }
  }, [computedGrid])

  return (
    <div className="sheet-shell">
      <div className="editor-toolbar">
        <div className="doc-top">
          <input className="doc-title" value={name} onChange={(e) => setName(e.target.value)} placeholder="Spreadsheet Name" />
          {sheets.length > 0 && (
            <select
              className="doc-select"
              value={current?.id || ''}
              onChange={(e) => {
                const found = sheets.find((s) => s.id === e.target.value)
                if (found) {
                  setCurrent(found)
                  setName(found.name)
                  setGrid(found.data?.rows || [])
                }
              }}
            >
              {sheets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="editor-actions">
          <button onClick={handleCreateNew}>
            <Plus size={16} /> New Sheet
          </button>
          <button onClick={addRow}>+ Row</button>
          <button onClick={addColumn}>+ Column</button>
          <button onClick={handleAIAddTotalColumn}>AI Total Column</button>
          <button onClick={() => setShowChart((v) => !v)}>
            <BarChart2 size={16} /> {showChart ? 'Grid' : 'Chart'}
          </button>
          <button onClick={handleSave}>
            <Save size={16} /> Save
          </button>
          <button onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSVImport} />
          <button onClick={handleCSVExport}>
            <Download size={16} /> CSV
          </button>
          {current && (
            <button className="danger-btn" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {showChart ? (
        <div className="chart-view">
          <h3>Visual Data Chart</h3>
          {chartData.values.length === 0 ? (
            <p>Add numerical values in your spreadsheet to generate a chart.</p>
          ) : (
            <div className="bar-chart-container">
              {chartData.values.map((v, idx) => (
                <div key={idx} className="bar-group">
                  <div className="bar-label">{chartData.labels[idx]}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(v / chartData.maxVal) * 100}%` }} />
                  </div>
                  <div className="bar-value">{v.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="sheet-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                {grid[0]?.map((_, colIdx) => (
                  <th key={colIdx}>{String.fromCharCode(65 + colIdx)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, r) => (
                <tr key={r}>
                  <th onClick={() => removeRow(r)} title="Click to remove row">
                    {r + 1}
                  </th>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <input
                        value={cell}
                        onChange={(e) => updateCell(r, c, e.target.value)}
                        placeholder={`Cell ${String.fromCharCode(65 + c)}${r + 1}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

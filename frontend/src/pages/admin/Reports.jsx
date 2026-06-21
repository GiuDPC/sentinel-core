import { useState, useEffect } from 'react'
import { useAuth } from '../../Contexts/AuthContextObject.js'
import { metricsApi } from '../../api/metrics'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Download, Calendar, FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import KPICard from '../../components/dashboard/KPICard'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const DATE_RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'all', label: 'Todo' },
]


export default function Reports() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [slaBreached, setSlaBreached] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('all')
  const [openDateFilter, setOpenDateFilter] = useState(null)
  const [activeTab, setActiveTab] = useState('resumen_general')

  async function loadReports() {
    setLoading(true)
    try {
      const [m, sla] = await Promise.all([
        metricsApi.getDashboard(),
        metricsApi.getSlaBreached(),
      ])
      setMetrics(m)
      setSlaBreached(sla.tickets || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports() 
  }, [dateRange])

  async function exportToExcel() {
    const summary = metrics?.summary || {}
    const wb = new ExcelJS.Workbook()
    wb.creator = 'SentinelCore'
    wb.created = new Date()

    const styleSheet = (ws, title, columns) => {
      ws.columns = columns
      ws.insertRow(1, [])
      ws.insertRow(1, [title])
      ws.mergeCells(1, 1, 1, columns.length)
      ws.getRow(1).font = { size: 16, bold: true, color: { argb: 'FF001B52' } }
      ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
      
      ws.getRow(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      ws.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001B52' } }
      ws.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' }

      ws.getRow(3).eachCell((cell) => {
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
      })
    }

    const applyTableBorders = (ws) => {
      const rowCount = ws.rowCount
      for (let i = 4; i <= rowCount; i++) {
        const row = ws.getRow(i)
        if (i % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
        }
        row.eachCell((cell) => {
          cell.border = { top: {style:'thin', color:{argb:'FFEEEEEE'}}, bottom: {style:'thin', color:{argb:'FFEEEEEE'}} }
        })
      }
    }

    const ws1 = wb.addWorksheet('Resumen General')
    styleSheet(ws1, 'Reporte de Analíticas - Resumen General', [{ header: 'Métrica', key: 'metric', width: 45 }, { header: 'Valor', key: 'value', width: 25 }])
    ws1.addRows([
      ['Total Tickets', summary.totalTickets || 0],
      ['Tickets Abiertos', summary.openTickets || 0],
      ['Tickets En Proceso', summary.inProgressTickets || 0],
      ['Tickets Resueltos', summary.resolvedTickets || 0],
      ['Tickets Cerrados', summary.closedTickets || 0],
      ['SLA Vencidos', summary.slaBreached || 0],
      ['Tiempo Promedio Resolución (h)', summary.avgResolutionHours || 0]
    ])
    applyTableBorders(ws1)

    const ws2 = wb.addWorksheet('Por Categoría')
    styleSheet(ws2, 'Distribución de Tickets por Categoría', [{ header: 'Categoría', key: 'cat', width: 45 }, { header: 'Cantidad', key: 'count', width: 25 }])
    ws2.addRows((metrics?.ticketsByCategory || []).map(i => [i.category, i.count]))
    applyTableBorders(ws2)

    const ws3 = wb.addWorksheet('Por Estado')
    styleSheet(ws3, 'Distribución de Tickets por Estado', [{ header: 'Estado', key: 'status', width: 40 }, { header: 'Cantidad', key: 'count', width: 25 }])
    const estadoLabels = { OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Proceso', ON_HOLD: 'En Espera', RESOLVED: 'Resuelto', AWAITING_CONFIRMATION: 'Esperando Confirmación', CLOSED: 'Cerrado' }
    ws3.addRows((metrics?.ticketsByStatus || []).map(i => [estadoLabels[i.status] || i.status, i.count]))
    applyTableBorders(ws3)

    if (slaBreached.length > 0) {
      const ws4 = wb.addWorksheet('SLA Vencidos')
      styleSheet(ws4, 'Atención Crítica - SLA Vencidos', [
        { header: 'Código', key: 'code', width: 20 },
        { header: 'Título', key: 'title', width: 50 },
        { header: 'Categoría', key: 'cat', width: 40 },
        { header: 'Vencimiento', key: 'date', width: 25 }
      ])
      ws4.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } }
      ws4.addRows(slaBreached.map(t => [t.ticketCode, t.title || t.category?.name, t.category?.name, new Date(t.dueDate).toLocaleDateString('es-VE')]))
      applyTableBorders(ws4)
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fecha = new Date().toLocaleDateString('es-VE').replace(/\//g, '-')
    a.download = `SentinelCore_Reporte_${fecha}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  async function exportToPDF() {
    const doc = new jsPDF()
    const summary = metrics?.summary || {}
    const fechaStr = new Date().toLocaleDateString('es-VE')
    const periodoStr = DATE_RANGES.find(r => r.value === dateRange)?.label || 'Todo'
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Administrador'
    
    try {
      const img = new Image()
      img.src = '/logo.png'
      await new Promise((resolve) => {
        img.onload = () => { 
          try { doc.addImage(img, 'PNG', 14, 12, 12, 12) } catch (err) { console.warn('Error logo', err) } 
          resolve() 
        }
        img.onerror = resolve
      })
    } catch (e) { console.warn('Error loading logo for PDF', e) }

    doc.setDrawColor(0, 27, 82)
    doc.setLineWidth(1)
    doc.line(14, 10, 196, 10)

    doc.setFontSize(16)
    doc.setTextColor(0, 27, 82)
    doc.setFont('helvetica', 'bold')
    doc.text('REPORTE OPERACIONAL Y DE RENDIMIENTO', 30, 18)
    
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.text('SentinelCore - Gestión de Incidencias', 30, 23)

    doc.setFontSize(9)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text(`Fecha de Emisión: ${fechaStr}`, 196, 15, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.text(`Período: ${periodoStr}`, 196, 19, { align: 'right' })
    doc.text(`Generado por: ${userName}`, 196, 23, { align: 'right' })

    doc.setLineWidth(0.2)
    doc.setDrawColor(200)
    doc.line(14, 28, 196, 28)

    doc.setFontSize(11)
    doc.setTextColor(0, 27, 82)
    doc.setFont('helvetica', 'bold')
    doc.text('1. RESUMEN EJECUTIVO', 14, 38)
    
    const drawKpiBox = (x, y, w, h, title, value, isAlert = false) => {
      doc.setDrawColor(200)
      doc.setFillColor(248, 250, 252)
      if (isAlert) doc.setFillColor(254, 242, 242)
      doc.roundedRect(x, y, w, h, 2, 2, 'FD')
      
      doc.setFillColor(0, 27, 82)
      if (isAlert) doc.setFillColor(220, 38, 38)
      doc.rect(x, y, w, 2, 'F')
      
      doc.setFontSize(9)
      doc.setTextColor(70, 70, 70)
      if (isAlert) doc.setTextColor(185, 28, 28)
      doc.setFont('helvetica', 'bold')
      doc.text(title, x + 4, y + 8)
      
      doc.setFontSize(18)
      doc.setTextColor(15, 23, 42)
      if (isAlert) doc.setTextColor(185, 28, 28)
      doc.setFont('helvetica', 'bold')
      doc.text(String(value), x + 4, y + 18)
    }

    drawKpiBox(14, 42, 42, 24, 'Total Tickets', summary.totalTickets || 0)
    drawKpiBox(60, 42, 42, 24, 'Abiertos', summary.openTickets || 0)
    drawKpiBox(106, 42, 42, 24, 'Resueltos', summary.resolvedTickets || 0)
    drawKpiBox(152, 42, 42, 24, 'SLA Vencidos', summary.slaBreached || 0, (summary.slaBreached || 0) > 0)

    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'normal')
    const total = summary.totalTickets || 0
    const resolved = summary.resolvedTickets || 0
    const resRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
    const insightText = `El presente reporte detalla el desempeño operativo correspondiente al período "${periodoStr}". Durante este ciclo, se registró un total de ${total} incidencias operativas. De ellas, se ha resuelto con éxito un ${resRate}%. El tiempo promedio de resolución global se mantiene en ${summary.avgResolutionHours || 0} horas. Es imperativo atender las alarmas relacionadas con tickets fuera del Acuerdo de Nivel de Servicio (SLA).`
    const splitText = doc.splitTextToSize(insightText, 182)
    doc.text(splitText, 14, 76)

    doc.setFontSize(12)
    doc.setTextColor(0, 27, 82)
    doc.setFont('helvetica', 'bold')
    doc.text('2. DESGLOSE ANALÍTICO', 14, 100)

    const tableTheme = {
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 5, textColor: [40, 40, 40] },
      headStyles: { fillColor: [235, 240, 245], textColor: [15, 23, 42], fontStyle: 'bold', lineWidth: 0, borderBottom: [1, [200, 200, 200]] },
      alternateRowStyles: { fillColor: [250, 252, 255] },
      margin: { top: 10, left: 14, right: 14 },
    }

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text('2.1 Incidencias por Área de Infraestructura', 14, 108)
    autoTable(doc, {
      startY: 111,
      head: [['Categoría Operativa', 'Volumen de Incidencias']],
      body: (metrics?.ticketsByCategory || []).map(i => [i.category, i.count]),
      ...tableTheme,
      didDrawCell: (data) => {
        if (data.row.section === 'body' && data.row.index !== data.table.body.length - 1) {
          doc.setDrawColor(220, 220, 220)
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height)
        }
      }
    })

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 130
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'bold')
    doc.text('2.2 Estado de Operaciones', 14, finalY + 12)
    
    const estadoLabels = { OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Proceso', ON_HOLD: 'En Espera', RESOLVED: 'Resuelto', AWAITING_CONFIRMATION: 'Esperando Confirmación', CLOSED: 'Cerrado' }
    autoTable(doc, {
      startY: finalY + 15,
      head: [['Estado de Atención', 'Volumen']],
      body: (metrics?.ticketsByStatus || []).map(i => [estadoLabels[i.status] || i.status, i.count]),
      ...tableTheme,
      didDrawCell: (data) => {
        if (data.row.section === 'body' && data.row.index !== data.table.body.length - 1) {
          doc.setDrawColor(240, 240, 240)
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height)
        }
      }
    })

    if (slaBreached.length > 0) {
      doc.addPage()
      
      doc.setDrawColor(220, 38, 38)
      doc.setLineWidth(1)
      doc.line(14, 10, 196, 10)
      
      doc.setFontSize(14)
      doc.setTextColor(220, 38, 38)
      doc.setFont('helvetica', 'bold')
      doc.text('3. ATENCIÓN CRÍTICA: SLA VENCIDOS', 14, 20)
      
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.setFont('helvetica', 'normal')
      doc.text('El siguiente listado exige acciones correctivas inmediatas por parte del personal de mantenimiento.', 14, 26)

      autoTable(doc, {
        startY: 32,
        head: [['Código', 'Título / Detalle', 'Área / Categoría', 'Fecha Límite']],
        body: slaBreached.map(t => [t.ticketCode, t.title || t.category?.name, t.category?.name, new Date(t.dueDate).toLocaleDateString('es-VE')]),
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 4, textColor: [80, 80, 80] },
        headStyles: { fillColor: [254, 242, 242], textColor: [220, 38, 38], fontStyle: 'bold', lineWidth: 0, borderBottom: [0.5, [252, 165, 165]] },
        didDrawCell: (data) => {
          if (data.row.section === 'body' && data.row.index !== data.table.body.length - 1) {
            doc.setDrawColor(240, 240, 240)
            doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height)
          }
        }
      })
    }

    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setLineWidth(0.2)
      doc.setDrawColor(200)
      doc.line(14, 285, 196, 285)
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(`Página ${i} de ${pageCount} — Documento de Uso Interno - SentinelCore Analytics`, doc.internal.pageSize.getWidth() / 2, 290, { align: 'center' })
    }

    doc.save(`SentinelCore_Reporte_${fechaStr.replace(/\//g, '-')}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">Cargando Reportes...</p>
      </div>
    )
  }

  const s = metrics?.summary || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Reportes</h2>
          <p className="text-sm font-medium text-slate-600 mt-1 mb-5">Analíticas del centro comercial</p>
          
          {/* Pestañas compactas */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg w-max">
            <button
              onClick={() => setActiveTab('resumen_general')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                activeTab === 'resumen_general'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              Resumen General
            </button>
            <button
              onClick={() => setActiveTab('analisis_detallado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                activeTab === 'analisis_detallado'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              Análisis Detallado
            </button>
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full sm:w-auto">
          <div className="relative">
            <button onClick={() => setOpenDateFilter(openDateFilter === 'date' ? null : 'date')} className='h-10 px-4 border border-slate-200 rounded-lg flex items-center gap-2 text-sm font-medium bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm'>
              <Calendar className='h-4 w-4' />
              {DATE_RANGES.find(r => r.value === dateRange)?.label || 'Todo'}
            </button>
            {openDateFilter === 'date' && (
              <div className='absolute right-0 mt-2 z-50 w-40 p-2 border border-slate-200 rounded-md shadow-lg bg-white'>
                {DATE_RANGES.map((opt) => (
                  <div key={opt.value} onClick={() => { setDateRange(opt.value); setOpenDateFilter(null) }} className={`px-3 py-2 rounded-sm text-sm cursor-pointer hover:bg-slate-50 ${dateRange === opt.value ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="h-10 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-sm cursor-pointer flex items-center gap-2">
              <Download className="h-4 w-4" />
              Excel
            </button>
            <button onClick={exportToPDF} className="h-10 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all shadow-sm cursor-pointer flex items-center gap-2">
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Contenido: Resumen General */}
      {activeTab === 'resumen_general' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPIs estilo minimalista */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Tickets" value={s.totalTickets || 0} subtitle={`${s.ticketsThisMonth || 0} este mes`} icon={FileText} />
            <KPICard title="Abiertos" value={s.openTickets || 0} icon={Clock} />
            <KPICard title="SLA Vencidos" value={s.slaBreached || 0} subtitle={`${s.slaAtRisk || 0} por vencer`} icon={AlertTriangle} />
            <KPICard title="Tiempo Promedio" value={`${s.avgResolutionHours || 0}h`} icon={CheckCircle} />
          </div>

          {/* Tickets por Estado - BarChart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tickets por Estado</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Volumen actual según fase de atención</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={(metrics?.ticketsByStatus || []).map(i => {
                  const statusLabels = { OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'Proceso', ON_HOLD: 'Espera', RESOLVED: 'Resuelto', AWAITING_CONFIRMATION: 'Confirmar', CLOSED: 'Cerrado' }
                  return { name: statusLabels[i.status] || i.status, total: i.count, status: i.status }
                })}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#475569', fontWeight: 500 }} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#64748b', fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tendencia por Prioridad - AreaChart (full width) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tendencia por Prioridad</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Distribución semanal simulada</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" />Baja</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Media</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" />Alta</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Crítica</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics?.ticketsByDateAndPriority || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={13} tick={{ fill: '#64748b', fontWeight: 500 }} />
                <YAxis tickLine={false} axisLine={false} fontSize={13} tick={{ fill: '#64748b', fontWeight: 500 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Baja" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Media" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Alta" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Crítica" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Contenido: Análisis Detallado */}
      {activeTab === 'analisis_detallado' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Componentes apilados verticalmente */}
          <div className="grid grid-cols-1 gap-6">
            {/* Tickets por Categoría */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tickets por Categoría</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Volumen de incidencias por área</p>
              </div>
              <div className="w-full">
                <ResponsiveContainer width="100%" height={Math.max(300, (metrics?.ticketsByCategory || []).length * 48)}>
                  <BarChart
                    layout="vertical"
                    data={(metrics?.ticketsByCategory || []).map(i => ({ name: i.category, total: i.count }))}
                    margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={13} tick={{ fill: '#64748b', fontWeight: 500 }} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={13} width={150} tick={{ fill: '#334155', fontWeight: 500 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                    <Bar dataKey="total" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SLA Vencidos */}
            {slaBreached.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-100/50">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tickets con SLA Vencido</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Requiere atención inmediata</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {slaBreached.slice(0, 8).map((t) => (
                    <div key={t.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-indigo-950 bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">{t.ticketCode}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{t.title || t.category?.name}</p>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{t.category?.name || '—'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 shrink-0 ml-3">{new Date(t.dueDate).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
                {slaBreached.length > 8 && (
                  <div className="px-6 py-3 border-t border-slate-200 bg-slate-100/50 text-center shrink-0">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">+{slaBreached.length - 8} más</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Sin SLA vencidos</p>
                <p className="text-sm font-medium text-slate-500 mt-1">Todos los tickets están dentro de plazo</p>
              </div>
            )}
          </div>
          
          {/* <div className="grid grid-cols-1 gap-6"> */}
            {/* Espacio reservado para inyectar nuevas tarjetas/tablas de análisis detallado en el futuro */}
          {/* </div> */}
        </div>
      )}
    </div>
  )
}
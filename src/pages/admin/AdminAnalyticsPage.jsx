import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/Common'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency, groupBy } from '@/lib/helpers'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts'

const CHART_COLORS = ['#8b5cf6','#06d6a0','#f59e0b','#60a5fa','#f87171','#a78bfa','#34d399']
const TOOLTIP_STYLE = { background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8 }

export default function AdminAnalyticsPage() {
  const [events, setEvents]   = useState([])
  const [halls, setHalls]     = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('id,status,event_type,total_cost,hall_cost,vendor_cost,event_date,created_at').order('event_date'),
      supabase.from('halls').select('id,name,city'),
      supabase.from('vendors').select('id,business_name,category'),
    ]).then(([{ data: ev }, { data: h }, { data: v }]) => {
      setEvents(ev || [])
      setHalls(h || [])
      setVendors(v || [])
      setLoading(false)
    })
  }, [])

  // Chart data
  const statusData = Object.entries(
    events.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name: name.replace('_',' '), value }))

  const typeData = Object.entries(
    events.reduce((acc, e) => { acc[e.event_type] = (acc[e.event_type] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name, value }))

  const revenueByMonth = Object.entries(
    events.filter((e) => e.status === 'completed').reduce((acc, e) => {
      const m = e.event_date?.slice(0, 7)
      if (m) acc[m] = (acc[m] || 0) + (+e.total_cost || 0)
      return acc
    }, {})
  ).sort().map(([month, revenue]) => ({ month, revenue }))

  const totalRevenue = events.filter((e) => e.status === 'completed').reduce((s, e) => s + (+e.total_cost || 0), 0)

  if (loading) return <AppShell title="Analytics"><PageLoader /></AppShell>

  return (
    <AppShell title="Analytics">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Platform-wide insights</div>
        </div>
      </div>

      <div className="section-gap">
        {/* KPIs row */}
        <div className="kpi-grid">
          <div className="kpi-card brand"><div className="kpi-label">Total Events</div><div className="kpi-value">{events.length}</div></div>
          <div className="kpi-card accent"><div className="kpi-label">Total Halls</div><div className="kpi-value">{halls.length}</div></div>
          <div className="kpi-card success"><div className="kpi-label">Total Vendors</div><div className="kpi-value">{vendors.length}</div></div>
          <div className="kpi-card brand"><div className="kpi-label">Platform Revenue</div><div className="kpi-value" style={{ fontSize: 'var(--text-2xl)' }}>{formatCurrency(totalRevenue)}</div></div>
        </div>

        {/* Revenue over time */}
        {revenueByMonth.length > 0 && (
          <div className="chart-card">
            <div className="chart-title">Revenue Over Time (Completed Events)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `RM${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="var(--brand)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="analytics-grid">
          <div className="chart-card">
            <div className="chart-title">Events by Type</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} width={100} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="var(--accent)" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <div className="chart-title">Booking Status</div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

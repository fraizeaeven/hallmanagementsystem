import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageLoader } from '@/components/ui/Common'
import Avatar from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/helpers'
import { useToast } from '@/components/ui/Toast'

const ROLE_LABELS = { guest: '🎉 Guest', hall_owner: '🏢 Hall Owner', vendor: '🛠️ Vendor', admin: '🧑‍💼 Admin' }
const ROLES = ['guest', 'hall_owner', 'vendor', 'admin']

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false) })
  }, [])

  async function changeRole(userId, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (!error) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
      toast({ type: 'success', title: 'Role updated' })
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  if (loading) return <AppShell title="Users"><PageLoader /></AppShell>

  return (
    <AppShell title="Users">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-title">All Users</div>
          <div className="page-subtitle">{users.length} registered users</div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrapper">
          <input id="user-search" type="text" className="form-input" style={{ paddingLeft: 'var(--space-4)' }}
            placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-chips">
          <div className={`filter-chip${!roleFilter ? ' active' : ''}`} onClick={() => setRoleFilter('')}>All Roles</div>
          {ROLES.map((r) => <div key={r} className={`filter-chip${roleFilter === r ? ' active' : ''}`} onClick={() => setRoleFilter(r)}>{ROLE_LABELS[r]}</div>)}
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Change Role</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-chip">
                    <Avatar name={u.full_name} size="sm" />
                    <span className="user-chip-name">{u.full_name || '—'}</span>
                  </div>
                </td>
                <td className="text-sm text-muted">{u.email}</td>
                <td><span className="badge badge-brand">{ROLE_LABELS[u.role] || u.role}</span></td>
                <td className="text-sm text-muted">{formatDate(u.created_at)}</td>
                <td>
                  <select className="form-select" style={{ height: 32, padding: '0 var(--space-3)', fontSize: 'var(--text-xs)' }}
                    value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                    id={`role-select-${u.id}`}>
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  )
}

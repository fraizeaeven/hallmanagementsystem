import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, MessageSquare, Flame, X, Search, Filter, ShieldInfo, Sparkles, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { FORUM_CATEGORIES, FORUM_CATEGORY_MAP } from '@/lib/constants'
import ForumLayout from '@/components/forum/ForumLayout'
import PostCard from '@/components/forum/PostCard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import GuestBanner from '@/components/ui/GuestBanner'
import Skeleton from '@/components/ui/Skeleton'
import DynamicIcon from '@/components/ui/DynamicIcon'
import '@/styles/forum.css'

const POSTS_PER_PAGE = 10

export default function ForumPage() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('latest')
  const [search, setSearch] = useState('')
  const [tags, setTags] = useState([])
  const [stats, setStats] = useState({ posts: 0, users: 0, comments: 0 })
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('guest_forum_banner_dismissed') === '1'
  )

  // SEO meta
  useEffect(() => {
    document.title = 'Community Forum — EventNest | Hall & Event Discussions'
  }, [])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('forum_posts')
      .select(`
        id, title, slug, content, category, upvote_count, comment_count, created_at, hall_id, vendor_id,
        author:profiles!author_id(id, full_name, avatar_url),
        hall:halls!hall_id(id, name, city),
        vendor:vendors!vendor_id(id, business_name),
        tags:forum_post_tags(tag:forum_tags(name))
      `)
      .eq('status', 'published')

    if (category !== 'all') q = q.eq('category', category)
    if (search.trim()) q = q.ilike('title', `%${search.trim()}%`)

    if (sort === 'popular') {
      q = q.order('upvote_count', { ascending: false })
    } else {
      q = q.order('created_at', { ascending: false })
    }

    q = q.limit(POSTS_PER_PAGE)

    const { data } = await q
    const normalized = (data || []).map(p => ({
      ...p,
      tags: p.tags?.map(t => t.tag?.name).filter(Boolean) || [],
      liked_by_me: false,
    }))
    setPosts(normalized)
    setLoading(false)
  }, [category, sort, search])

  const fetchStats = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([
      supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('forum_comments').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      posts: pRes.count || 0,
      comments: cRes.count || 0,
    })
  }, [])

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('forum_tags').select('name').limit(20)
    setTags(data?.map(t => t.name) || [])
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { fetchStats(); fetchTags() }, [fetchStats, fetchTags])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchPosts, 350)
    return () => clearTimeout(t)
  }, [search, fetchPosts])

  const handleVote = async (post) => {
    if (!user) {
      openAuthModal({ intent: 'general' })
      return
    }
    const { error } = await supabase.from('forum_likes').insert({ post_id: post.id, user_id: user.id })
    if (error?.code === '23505') {
      await supabase.from('forum_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    }
    fetchPosts()
  }

  const dismissBanner = () => {
    sessionStorage.setItem('guest_forum_banner_dismissed', '1')
    setBannerDismissed(true)
  }

  return (
    <ForumLayout>
      <div className="forum-page animate-in">
        
        {/* Guest indicator banner */}
        {!user && !bannerDismissed && (
          <GuestBanner 
            message="Browsing as guest — read freely. Sign in to post."
            onSignIn={() => openAuthModal({ intent: 'general' })}
            onDismiss={dismissBanner}
          />
        )}

        <div className="forum-header mb-12 mt-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--s-4)', flexWrap: 'wrap' }}>
            <div className="stack" style={{ gap: 'var(--s-1)' }}>
              <h1 className="fw-bold" style={{ fontSize: 'var(--text-4xl)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Community Forum</h1>
              <p className="text-gray-400">Get advice, share reviews, and discuss event planning.</p>
            </div>
            <Button variant="primary" size="xl" onClick={() => navigate('/forum/create')} className="shadow-lg shadow-blue-500/10">
              <Plus size={18} className="mr-2" /> Start Discussion
            </Button>
          </div>
        </div>

        <div className="forum-controls mb-10" style={{ display: 'flex', gap: 'var(--s-4)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input input-lg" 
              placeholder="Search discussions..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 48, height: 52, borderRadius: 'var(--radius-xl)' }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <select 
              className="input pr-10" 
              style={{ width: 'auto', height: 52, borderRadius: 'var(--radius-xl)', appearance: 'none', paddingRight: 'var(--s-10)' }}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {FORUM_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          <div className="button-group" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-xl)', padding: 4, border: '1px solid var(--white-10)' }}>
            <Button 
              variant={sort === 'latest' ? 'primary' : 'ghost'} 
              className="btn-sm" 
              onClick={() => setSort('latest')}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-lg)' }}
            >
              Latest
            </Button>
            <Button 
              variant={sort === 'popular' ? 'primary' : 'ghost'} 
              className="btn-sm" 
              onClick={() => setSort('popular')}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-lg)' }}
            >
              Popular
            </Button>
          </div>
        </div>

        <div className="forum-main-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 'var(--s-10)' }}>
          <div className="post-list stack" style={{ gap: 'var(--s-4)' }}>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <Card key={i} className="p-8">
                  <div style={{ display: 'flex', gap: 'var(--s-3)', marginBottom: 'var(--s-4)' }}>
                    <Skeleton type="circle" width="40px" height="40px" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="40%" height="20px" className="mb-2" />
                      <Skeleton width="20%" height="14px" />
                    </div>
                  </div>
                  <Skeleton width="80%" height="24px" className="mb-4" />
                  <Skeleton width="100%" height="60px" className="mb-6" />
                  <div style={{ display: 'flex', gap: 'var(--s-4)' }}>
                    <Skeleton width="60px" height="24px" />
                    <Skeleton width="60px" height="24px" />
                  </div>
                </Card>
              ))
            ) : posts.length === 0 ? (
              <div className="card text-center p-16">
                <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-6">
                   <Search size={32} />
                </div>
                <h3 className="font-extrabold text-xl">No discussions found</h3>
                <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
                <Button variant="ghost" className="mt-8 text-blue-400" onClick={() => { setSearch(''); setCategory('all'); }}>Clear all filters</Button>
              </div>
            ) : (
              posts.map(p => (
                <PostCard 
                  key={p.id} 
                  post={p} 
                  onVote={() => handleVote(p)}
                />
              ))
            )}
          </div>

          <aside className="forum-sidebar stack" style={{ gap: 'var(--s-6)' }}>
            <Card className="p-6">
              <h3 className="font-black mb-6 text-[10px] uppercase tracking-[0.2em] text-gray-500">Community Stats</h3>
              <div className="stack" style={{ gap: 'var(--s-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><MessageSquare size={16} /></div>
                    <span className="text-sm font-medium">Discussions</span>
                  </div>
                  <span className="font-black text-white">{stats.posts}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><TrendingUp size={16} /></div>
                    <span className="text-sm font-medium">Comments</span>
                  </div>
                  <span className="font-black text-white">{stats.comments}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-black mb-6 text-[10px] uppercase tracking-[0.2em] text-gray-500">Popular Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map(t => (
                  <Link 
                    key={t} 
                    to={`/forum?tag=${t}`} 
                    className="text-xs font-bold px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-none relative overflow-hidden group">
              <div className="absolute top-[-20px] right-[-20px] opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                <Flame size={120} />
              </div>
              <div className="relative z-10">
                <div className="p-2 bg-white/20 rounded-lg w-fit mb-4">
                   <Flame size={20} />
                </div>
                <h3 className="font-black text-xl mb-2">Weekly Challenge</h3>
                <p className="text-sm text-white/80 leading-relaxed mb-6">Share your best DIY event decor tips and win a feature in our next newsletter!</p>
                <Button variant="ghost" className="bg-white text-blue-600 font-black border-none hover:bg-gray-100" block onClick={() => navigate('/forum/create')}>JOIN NOW</Button>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </ForumLayout>
  )
}

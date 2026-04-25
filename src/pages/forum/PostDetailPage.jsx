import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Flag, ThumbsUp, Clock, X, MessageSquare, Share2, CheckCircle2, AlertCircle, Bookmark } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { FORUM_CATEGORY_MAP } from '@/lib/constants'
import { timeAgo } from '@/lib/helpers'
import ForumLayout from '@/components/forum/ForumLayout'
import CommentThread from '@/components/forum/CommentThread'
import HallVendorAttachment from '@/components/forum/HallVendorAttachment'
import PostCard from '@/components/forum/PostCard'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import GuestBanner from '@/components/ui/GuestBanner'
import Skeleton from '@/components/ui/Skeleton'
import DynamicIcon from '@/components/ui/DynamicIcon'
import '@/styles/forum.css'

export default function PostDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLiked, setHasLiked] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)

  // Guest banner state (dismissed via X)
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('guest_forum_banner_dismissed') === '1'
  )

  const fetchPost = useCallback(async () => {
    const { data } = await supabase
      .from('forum_posts')
      .select(`
        id, title, slug, content, category, upvote_count, comment_count, created_at, hall_id, vendor_id,
        author:profiles!author_id(id, full_name, avatar_url),
        hall:halls!hall_id(id, name, city, address),
        vendor:vendors!vendor_id(id, business_name, contact_email),
        tags:forum_post_tags(tag:forum_tags(name))
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (!data) { setLoading(false); return }

    const normalized = {
      ...data,
      tags: data.tags?.map(t => t.tag?.name).filter(Boolean) || [],
    }
    setPost(normalized)

    // SEO
    document.title = `${data.title} — EventNest Community`
    
    // Fetch related posts
    supabase
      .from('forum_posts')
      .select('id, title, slug, upvote_count, comment_count, created_at, category')
      .eq('category', data.category)
      .eq('status', 'published')
      .neq('id', data.id)
      .order('upvote_count', { ascending: false })
      .limit(4)
      .then(({ data: rel }) => setRelated(rel || []))

    setLoading(false)
  }, [slug])

  const fetchComments = useCallback(async () => {
    if (!post?.id) return
    const { data } = await supabase
      .from('forum_comments')
      .select('id, content, parent_id, created_at, author:profiles!author_id(id, full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }, [post?.id])

  const checkLiked = useCallback(async () => {
    if (!user || !post?.id) return
    const { data } = await supabase
      .from('forum_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
    setHasLiked(!!data)
  }, [user, post?.id])

  useEffect(() => { fetchPost() }, [fetchPost])
  useEffect(() => { fetchComments() }, [fetchComments])
  useEffect(() => { checkLiked() }, [checkLiked])

  const toggleUpvote = async () => {
    if (!user) {
      openAuthModal({
        intent: 'upvote',
        onSuccess: () => toggleUpvote(),
      })
      return
    }
    const oldLiked = hasLiked
    setHasLiked(!oldLiked)
    
    if (oldLiked) {
      await supabase.from('forum_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      setPost(p => ({ ...p, upvote_count: Math.max((p.upvote_count || 0) - 1, 0) }))
    } else {
      await supabase.from('forum_likes').insert({ post_id: post.id, user_id: user.id })
      setPost(p => ({ ...p, upvote_count: (p.upvote_count || 0) + 1 }))
    }
  }

  const handleReport = async () => {
    if (!user || !reportReason.trim()) return
    await supabase.from('forum_reports').insert({
      post_id: post.id,
      reporter_id: user.id,
      reason: reportReason.trim(),
    })
    setReportSubmitted(true)
    setReportOpen(false)
  }

  const dismissBanner = () => {
    setBannerDismissed(true)
    sessionStorage.setItem('guest_forum_banner_dismissed', '1')
  }

  if (loading) return (
    <ForumLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <Skeleton height="32px" width="100px" radius="12px" />
        <div className="space-y-4">
          <Skeleton height="48px" width="80%" radius="12px" />
          <Skeleton height="20px" width="40%" radius="8px" />
        </div>
        <Skeleton height="400px" radius="24px" />
      </div>
    </ForumLayout>
  )
  
  if (!post) return (
    <ForumLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="text-gray-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Post not found</h2>
        <Link to="/forum" className="text-blue-400 hover:underline">Back to Community</Link>
      </div>
    </ForumLayout>
  )

  const catMeta = FORUM_CATEGORY_MAP[post.category] || { icon: 'MessageSquare', label: post.category, color: '#6B7280' }

  return (
    <ForumLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 animate-in">
        
        {/* Guest indicator banner */}
        {!user && !bannerDismissed && (
          <div className="mb-8">
            <GuestBanner 
              message="Browsing as guest. Sign in to upvote, comment, and join the conversation."
              onSignIn={() => openAuthModal({ intent: 'general' })}
              onDismiss={dismissBanner}
            />
          </div>
        )}

        <header className="mb-8">
          <button 
            onClick={() => navigate('/forum')}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            COMMUNITY
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <span 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white/90"
              style={{ background: `${catMeta.color}40`, border: `1px solid ${catMeta.color}60` }}
            >
              <DynamicIcon name={catMeta.icon} size={12} />
              {catMeta.label}
            </span>
            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Clock size={12} />
              {timeAgo(post.created_at)}
            </span>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-6">{post.title}</h1>
          
          <div className="flex items-center gap-4">
            <Avatar name={post.author?.full_name} size="sm" className="ring-2 ring-white/10" />
            <div>
              <div className="text-base font-bold text-white">{post.author?.full_name || 'Anonymous'}</div>
              <div className="text-xs text-gray-400 font-medium">Community Member</div>
            </div>
          </div>
        </header>

        <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-10 shadow-2xl">
          <div className="text-lg text-gray-200 leading-relaxed whitespace-pre-wrap mb-8">
            {post.content}
          </div>

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map(t => (
                <span key={t} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Hall/Vendor Attachment */}
          {(post.hall || post.vendor) && (
            <div className="mt-10 pt-8 border-t border-white/5">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Attached Reference</h4>
              <HallVendorAttachment post={post} variant="card" />
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-white/5 flex items-center gap-4">
            <Button
              variant={hasLiked ? 'primary' : 'secondary'}
              onClick={toggleUpvote}
              className={`gap-2 h-11 px-6 ${hasLiked ? 'bg-blue-600 border-blue-500' : ''}`}
            >
              <ThumbsUp size={18} fill={hasLiked ? 'white' : 'none'} />
              <span className="font-black">{post.upvote_count || 0}</span>
            </Button>
            
            <div className="h-11 px-6 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 text-gray-400">
              <MessageSquare size={18} />
              <span className="font-black">{comments.length}</span>
            </div>

            <Button variant="secondary" className="w-11 h-11 p-0 flex items-center justify-center ml-auto">
              <Share2 size={18} />
            </Button>
            
            <Button variant="secondary" onClick={() => setReportOpen(true)} className="w-11 h-11 p-0 flex items-center justify-center text-gray-500 hover:text-red-400">
              <Flag size={18} />
            </Button>
          </div>
        </section>

        {/* Report Modal */}
        {reportOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setReportOpen(false)} />
            <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Report Content</h3>
                <Button variant="secondary" className="w-8 h-8 p-0" onClick={() => setReportOpen(false)}>
                  <X size={16} />
                </Button>
              </div>
              
              {reportSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="text-xl font-bold text-white mb-2">Report Submitted</div>
                  <p className="text-gray-400 text-sm">Thank you for helping us keep the community safe.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-gray-400 text-sm">Please tell us why you're reporting this post. Our team will review it shortly.</p>
                  <textarea 
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none" 
                    placeholder="e.g. Spam, offensive content, misleading info..."
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                  />
                  <Button 
                    variant="primary" 
                    className="w-full h-12"
                    disabled={!reportReason.trim()}
                    onClick={handleReport}
                  >
                    Submit Report
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-12">
          <CommentThread
            postId={post.id}
            comments={comments}
            onRefresh={fetchComments}
          />
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/10">
            <h3 className="text-2xl font-black text-white mb-8">Related Discussions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related.map(r => (
                <PostCard key={r.id} post={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ForumLayout>
  )
}

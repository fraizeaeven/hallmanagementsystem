import { Link } from 'react-router-dom'
import { MessageSquare, ThumbsUp, Clock, ChevronUp, MapPin, Building } from 'lucide-react'
import { FORUM_CATEGORY_MAP } from '@/lib/constants'
import { timeAgo, generateExcerpt } from '@/lib/helpers'
import Avatar from '@/components/ui/Avatar'
import HallVendorAttachment from './HallVendorAttachment'
import DynamicIcon from '@/components/ui/DynamicIcon'

export default function PostCard({ post, onVote, currentUserId }) {
  const cat = FORUM_CATEGORY_MAP[post.category] || { label: post.category, icon: 'MessageSquare', color: '#6B7280' }
  const tags = post.tags || []
  const hasLiked = post.liked_by_me || false

  const handleVote = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onVote?.(post)
  }

  return (
    <Link
      to={`/forum/post/${post.slug}`}
      className="group block bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 rounded-2xl transition-all duration-300 overflow-hidden"
      id={`post-card-${post.id}`}
    >
      <div className="flex">
        {/* Vote column */}
        <div className="w-16 flex flex-col items-center pt-6 pb-4 bg-white/[0.02] border-r border-white/5">
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              hasLiked 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'hover:bg-white/10 text-gray-500'
            }`}
            onClick={handleVote}
            title={hasLiked ? 'Remove upvote' : 'Upvote'}
          >
            <ChevronUp size={24} className={hasLiked ? 'scale-110' : ''} />
          </button>
          <span className={`mt-2 font-black text-lg ${hasLiked ? 'text-blue-400' : 'text-gray-400'}`}>
            {post.upvote_count ?? 0}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 p-6">
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white/90"
              style={{ background: `${cat.color}40`, border: `1px solid ${cat.color}60` }}
            >
              <DynamicIcon name={cat.icon} size={12} />
              {cat.label}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Avatar name={post.author?.full_name} size="xs" />
              <span className="font-medium">{post.author?.full_name || 'Anonymous'}</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-gray-500 font-bold uppercase tracking-wider">
              <Clock size={12} />
              {timeAgo(post.created_at)}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2 leading-tight">
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.content && (
            <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
              {generateExcerpt(post.content, 140)}
            </p>
          )}

          {/* Hall / Vendor attachment chip */}
          {(post.hall_id || post.vendor_id) && (
            <div className="mb-4">
              <HallVendorAttachment post={post} variant="chip" />
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.slice(0, 5).map((tag) => (
                <span key={tag} className="text-[11px] text-blue-400/70 font-bold">#{tag}</span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-6 pt-4 border-t border-white/5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <ThumbsUp size={14} />
              {post.upvote_count ?? 0}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <MessageSquare size={14} />
              {post.comment_count ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

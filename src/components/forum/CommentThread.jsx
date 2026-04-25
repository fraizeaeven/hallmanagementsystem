import { useState, useRef } from 'react'
import { Send, ChevronDown, ChevronUp, CornerDownRight, MessageSquare, Plus, Reply } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { supabase } from '@/lib/supabase'
import { timeAgo } from '@/lib/helpers'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import GuestBanner from '@/components/ui/GuestBanner'
import Card from '@/components/ui/Card'

/**
 * Renders a single comment + its replies (2 levels max).
 */
function CommentItem({ comment, postId, onRefresh, depth = 0 }) {
  const { user, profile } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [replyOpen, setReplyOpen] = useState(false)
  const [repliesOpen, setRepliesOpen] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const replyInputRef = useRef(null)
  const replies = comment.replies || []

  const submitReply = async () => {
    if (!replyText.trim() || !user) return
    setSubmitting(true)
    await supabase.from('forum_comments').insert({
      post_id: postId,
      author_id: user.id,
      parent_id: comment.id,
      content: replyText.trim(),
    })
    setReplyText('')
    setReplyOpen(false)
    setSubmitting(false)
    onRefresh()
  }

  const handleReplyClick = () => {
    if (user) {
      setReplyOpen(!replyOpen)
      setTimeout(() => replyInputRef.current?.focus(), 50)
    } else {
      openAuthModal({
        intent: 'comment',
        onSuccess: () => {
          setReplyOpen(true)
          setTimeout(() => replyInputRef.current?.focus(), 150)
        },
      })
    }
  }

  return (
    <div className={`p-6 bg-white/5 border border-white/10 rounded-3xl mb-4 ${depth > 0 ? 'ml-8 bg-black/20' : ''}`}>
      <div className="flex gap-4">
        <Avatar name={comment.author?.full_name} size="sm" className="ring-2 ring-white/10" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-white text-sm">{comment.author?.full_name || 'Anonymous'}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{timeAgo(comment.created_at)}</span>
          </div>
          
          <div className="text-gray-300 text-sm leading-relaxed mb-4">
            {comment.content}
          </div>

          <div className="flex items-center gap-4">
            {depth < 1 && (
              <button 
                onClick={handleReplyClick}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Reply size={12} /> REPLY
              </button>
            )}
            
            {replies.length > 0 && (
              <button 
                onClick={() => setRepliesOpen(!repliesOpen)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                {repliesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {repliesOpen ? 'HIDE REPLIES' : `VIEW ${replies.length} REPLIES`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline reply box */}
      {replyOpen && user && (
        <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
          <div className="flex gap-4">
            <Avatar name={profile?.full_name} size="xs" />
            <div className="flex-1">
              <textarea
                ref={replyInputRef}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                rows={3}
                placeholder={`Write a reply to ${comment.author?.full_name || 'this comment'}…`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitReply() }}
              />
              <div className="flex justify-end gap-3 mt-3">
                <Button variant="ghost" className="text-gray-500 font-bold" onClick={() => setReplyOpen(false)}>CANCEL</Button>
                <Button 
                  variant="primary" 
                  className="h-10 px-6 rounded-xl font-bold text-xs" 
                  onClick={submitReply}
                  disabled={submitting || !replyText.trim()}
                >
                  {submitting ? 'REPLYING...' : 'POST REPLY'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {repliesOpen && replies.length > 0 && (
        <div className="mt-6 space-y-4">
          {replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} postId={postId} onRefresh={onRefresh} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Full comment section: new comment box + threaded list.
 */
export default function CommentThread({ postId, comments, onRefresh }) {
  const { user, profile } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)

  // Build threaded structure
  const roots = comments.filter(c => !c.parent_id)
  const childrenMap = comments.reduce((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = []
      acc[c.parent_id].push(c)
    }
    return acc
  }, {})
  const threaded = roots.map(c => ({ ...c, replies: childrenMap[c.id] || [] }))

  const submitComment = async () => {
    if (!text.trim() || !user) return
    setSubmitting(true)
    await supabase.from('forum_comments').insert({
      post_id: postId,
      author_id: user.id,
      content: text.trim(),
    })
    setText('')
    setSubmitting(false)
    onRefresh()
  }

  const handleGuestCommentClick = () => {
    openAuthModal({
      intent: 'comment',
      onSuccess: () => {
        setTimeout(() => textareaRef.current?.focus(), 200)
      },
    })
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <h3 className="text-xl font-black text-white flex items-center gap-3">
          <MessageSquare size={20} className="text-blue-500" />
          DISCUSSIONS
          <span className="text-xs font-medium text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{comments.length}</span>
        </h3>
      </div>

      {/* New comment box / Guest Banner */}
      {user ? (
        <div className="bg-white/5 border border-white/5 rounded-[32px] p-6 focus-within:border-blue-500/30 transition-colors shadow-2xl">
          <div className="flex gap-5">
            <Avatar name={profile?.full_name} size="sm" className="ring-2 ring-white/10" />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                className="w-full bg-transparent border-none text-white text-base placeholder-gray-600 focus:outline-none resize-none pt-2"
                rows={4}
                placeholder="Join the conversation, share your insights..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment() }}
              />
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                  CTRL + ENTER TO QUICK POST
                </span>
                <Button
                  variant="primary"
                  className="h-12 px-8 rounded-2xl font-black text-xs tracking-widest gap-2 shadow-xl shadow-blue-600/20"
                  onClick={submitComment}
                  disabled={submitting || !text.trim()}
                >
                  {submitting ? 'POSTING...' : <><Send size={16} /> POST COMMENT</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10">
          <GuestBanner
            message="Sign in to join the conversation, upvote posts, and share your own experiences with the community."
            onSignIn={handleGuestCommentClick}
            onDismiss={() => {}}
          />
        </div>
      )}

      {/* Comment list */}
      <div className="space-y-6">
        {threaded.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[48px]">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={32} className="text-gray-700" />
            </div>
            <h4 className="text-xl font-bold text-gray-500 mb-2">No comments yet</h4>
            <p className="text-sm text-gray-600">Be the first to share your thoughts on this discussion.</p>
          </div>
        ) : (
          threaded.map(c => (
            <CommentItem key={c.id} comment={c} postId={postId} onRefresh={onRefresh} />
          ))
        )}
      </div>
    </div>
  )
}


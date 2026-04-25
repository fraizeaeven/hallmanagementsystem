import { useState, useRef } from 'react'
import { Send, ChevronDown, ChevronUp, MessageSquare, Reply } from 'lucide-react'
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
    <div className="comment-item" id={`comment-${comment.id}`}>
      <div className="comment-avatar-col">
        <Avatar name={comment.author?.full_name} size="sm" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author fw-bold">{comment.author?.full_name || 'Anonymous'}</span>
            <span className="comment-time">{timeAgo(comment.created_at)}</span>
          </div>
          <div className="comment-content mt-1">{comment.content}</div>

          {/* Actions */}
          {depth < 1 && (
            <div className="comment-actions mt-2">
              <button className="comment-action-btn" onClick={handleReplyClick}>
                <Reply size={12} /> Reply
              </button>
              {replies.length > 0 && (
                <button className="comment-action-btn" onClick={() => setRepliesOpen(!repliesOpen)}>
                  {repliesOpen
                    ? <><ChevronUp size={12} /> Hide {replies.length}</>
                    : <><ChevronDown size={12} /> Show {replies.length}</>
                  }
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inline reply box */}
        {replyOpen && user && (
          <Card className="p-3 mt-3">
            <div style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'flex-start' }}>
              <Avatar name={profile?.full_name} size="xs" />
              <textarea
                ref={replyInputRef}
                className="textarea"
                style={{ flex: 1, minHeight: 60, border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
                placeholder={`Reply to ${comment.author?.full_name || 'this comment'}…`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitReply() }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--s-2)', marginTop: 'var(--s-2)' }}>
              <Button variant="ghost" className="btn-sm" onClick={() => setReplyOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                className="btn-sm"
                onClick={submitReply}
                disabled={submitting || !replyText.trim()}
              >
                <Send size={13} /> Reply
              </Button>
            </div>
          </Card>
        )}

        {/* Nested replies */}
        {repliesOpen && replies.length > 0 && (
          <div className="comment-replies">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} postId={postId} onRefresh={onRefresh} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
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

  // Build threaded structure: parent comments + their replies
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
    <div className="comments-section">
      <div className="comments-header">
        <MessageSquare size={20} style={{ color: 'var(--brand)' }} />
        <span>Comments</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 400 }}>
          ({comments.length})
        </span>
      </div>

      {/* New comment box / Guest Banner */}
      {user ? (
        <div className="comment-box">
          <div style={{ display: 'flex', gap: 'var(--s-3)', alignItems: 'flex-start' }}>
            <Avatar name={profile?.full_name} size="sm" />
            <textarea
              ref={textareaRef}
              placeholder="Share your thoughts, experiences, or recommendations…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment() }}
            />
          </div>
          <div className="comment-box-footer">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginRight: 'auto' }}>
              Ctrl+Enter to post
            </span>
            <Button
              variant="primary"
              onClick={submitComment}
              disabled={submitting || !text.trim()}
              id="submit-comment-btn"
            >
              <Send size={14} /> Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <GuestBanner
            message="Sign in to join the conversation, upvote posts, and share your own experiences with the community."
            onSignIn={handleGuestCommentClick}
            onDismiss={() => {}}
          />
        </div>
      )}

      {/* Comment list */}
      <div className="stack" style={{ gap: 'var(--s-4)' }}>
        {threaded.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s-12) var(--s-6)', background: 'var(--bg-muted)', borderRadius: 'var(--r-xl)' }}>
            <MessageSquare size={36} style={{ color: 'var(--text-muted)', marginBottom: 'var(--s-3)' }} />
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>No comments yet</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Be the first to share your thoughts!</div>
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

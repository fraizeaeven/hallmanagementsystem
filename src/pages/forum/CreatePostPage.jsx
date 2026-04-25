import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Search, X, Send, ArrowLeft, PenSquare, Building, ShoppingBag, PlusCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useGuestSession } from '@/contexts/GuestSessionContext'
import { FORUM_CATEGORIES } from '@/lib/constants'
import { slugify } from '@/lib/helpers'
import ForumLayout from '@/components/forum/ForumLayout'
import TagInput from '@/components/forum/TagInput'
import { Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import GuestBanner from '@/components/ui/GuestBanner'
import DynamicIcon from '@/components/ui/DynamicIcon'
import '@/styles/forum.css'

export default function CreatePostPage() {
  const { user, profile } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { saveDraftPost, getDraftPost, clearDraftPost } = useGuestSession()
  const navigate = useNavigate()

  const [selectedCategory, setSelectedCategory] = useState('event_discussion')
  const [tags, setTags] = useState([])
  const [suggestedTags, setSuggestedTags] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Hall attachment
  const [attachType, setAttachType] = useState(null)
  const [attachSearch, setAttachSearch] = useState('')
  const [attachResults, setAttachResults] = useState([])
  const [attached, setAttached] = useState(null)
  const [searchingAttach, setSearchingAttach] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { title: '', content: '' }
  })
  const titleVal = watch('title')
  const contentVal = watch('content')
  const draftSaveTimer = useRef(null)

  // SEO
  useEffect(() => {
    document.title = 'Start a Discussion — EventNest Community'
  }, [])

  // Restore draft if guest returns (or was redirected back after login)
  useEffect(() => {
    const draft = getDraftPost()
    if (draft) {
      if (draft.title)    setValue('title',   draft.title)
      if (draft.content)  setValue('content', draft.content)
      if (draft.category) setSelectedCategory(draft.category)
      if (draft.tags)     setTags(draft.tags)
      if (draft.attached) setAttached(draft.attached)
    }
  }, [getDraftPost, setValue])

  // Auto-save draft to localStorage while guest types (debounced)
  useEffect(() => {
    if (user) return  // only persist when guest
    clearTimeout(draftSaveTimer.current)
    draftSaveTimer.current = setTimeout(() => {
      saveDraftPost({
        title: titleVal,
        content: contentVal,
        category: selectedCategory,
        tags,
        attached,
      })
    }, 800)
    return () => clearTimeout(draftSaveTimer.current)
  }, [titleVal, contentVal, selectedCategory, tags, attached, user, saveDraftPost])

  // Fetch suggested tags
  useEffect(() => {
    supabase.from('forum_tags').select('name').limit(30)
      .then(({ data }) => setSuggestedTags(data?.map(t => t.name) || []))
  }, [])

  // Attachment search
  useEffect(() => {
    if (!attachSearch.trim() || !attachType) { setAttachResults([]); return }
    const timer = setTimeout(async () => {
      setSearchingAttach(true)
      if (attachType === 'hall') {
        const { data } = await supabase
          .from('halls')
          .select('id, name, city')
          .ilike('name', `%${attachSearch}%`)
          .eq('is_active', true)
          .limit(6)
        setAttachResults(data || [])
      } else {
        const { data } = await supabase
          .from('vendors')
          .select('id, business_name, contact_email')
          .ilike('business_name', `%${attachSearch}%`)
          .eq('is_active', true)
          .limit(6)
        setAttachResults(data || [])
      }
      setSearchingAttach(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [attachSearch, attachType])

  /** Core submit logic — called after user is confirmed logged in */
  const submitPost = async ({ title, content }) => {
    setError('')
    setSubmitting(true)

    const base = slugify(title)
    const uid = Math.random().toString(36).slice(2, 7)
    const slug = `${base}-${uid}`

    const { data: postData, error: postErr } = await supabase
      .from('forum_posts')
      .insert({
        author_id: user.id,
        title: title.trim(),
        slug,
        content: content.trim(),
        category: selectedCategory,
        hall_id:   (attached?.type === 'hall'   ? attached.id : null),
        vendor_id: (attached?.type === 'vendor' ? attached.id : null),
      })
      .select('id, slug')
      .single()

    if (postErr) {
      setError('Failed to create post. Please try again.')
      setSubmitting(false)
      return
    }

    // Insert tags
    if (tags.length > 0) {
      for (const tagName of tags) {
        const { data: tagData } = await supabase
          .from('forum_tags')
          .upsert({ name: tagName }, { onConflict: 'name' })
          .select('id')
          .single()
        if (tagData?.id) {
          await supabase.from('forum_post_tags').insert({ post_id: postData.id, tag_id: tagData.id })
        }
      }
    }

    clearDraftPost()
    navigate(`/forum/post/${postData.slug}`)
  }

  /**
   * Form submit handler:
   * - If logged in → submit directly
   * - If guest → save draft, open auth modal, then auto-submit on success
   */
  const onSubmit = (formValues) => {
    if (user) {
      submitPost(formValues)
    } else {
      // Persist draft before opening modal
      saveDraftPost({
        title: formValues.title,
        content: formValues.content,
        category: selectedCategory,
        tags,
        attached,
      })
      openAuthModal({
        intent: 'forum_post',
        onSuccess: () => {
          setTimeout(() => submitPost(formValues), 100)
        },
      })
    }
  }

  return (
    <ForumLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 animate-in">
        <div className="mb-10">
          <button 
            onClick={() => navigate('/forum')}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            BACK TO FORUM
          </button>
          <h1 className="text-4xl font-black text-white mb-3">Start a Discussion</h1>
          <p className="text-gray-400 text-lg">Ask for recommendations, share experiences, or help others in the community.</p>
        </div>

        {/* Guest draft hint banner */}
        {!user && (
          <div className="mb-10">
            <GuestBanner 
              message="Write your question now — we'll save your draft automatically and only ask you to sign in when you're ready to post."
              onSignIn={() => openAuthModal({ intent: 'forum_post' })}
              onDismiss={() => {}}
            />
          </div>
        )}

        <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>

          {/* Category */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Select Category <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {FORUM_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  id={`category-${cat.value}`}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                    selectedCategory === cat.value 
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${selectedCategory === cat.value ? 'bg-blue-500 text-white' : 'bg-white/5'}`}>
                    <DynamicIcon name={cat.icon} size={20} />
                  </div>
                  <span className="text-xs font-bold text-center leading-tight">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Input 
              label="Discussion Title"
              id="post-title"
              variant="glass"
              error={errors.title?.message}
              placeholder="e.g. Looking for a wedding hall in Melaka for 200 pax…"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 10, message: 'Title must be at least 10 characters' },
                maxLength: { value: 150, message: 'Title is too long' },
              })}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Textarea 
              label="Share your details"
              id="post-content"
              variant="glass"
              rows={8}
              error={errors.content?.message}
              placeholder="Share more details — budget range, event date, number of guests, or what kind of experience you're looking for…"
              {...register('content', {
                required: 'Content is required',
                minLength: { value: 20, message: 'Please write at least 20 characters' },
              })}
            />
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500">Tags</label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestedTags={suggestedTags}
              placeholder="e.g. wedding, kl, 200pax, budget…"
            />
          </div>

          {/* Attach Hall/Vendor */}
          <div className="space-y-4 pt-6 border-t border-white/5">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-400" />
              Attach a Hall or Vendor <span className="text-xs font-medium text-gray-500 ml-2">(Optional)</span>
            </label>
            
            {attached ? (
              <div className="flex items-center gap-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                  {attached.type === 'hall' ? <Building size={24} /> : <ShoppingBag size={24} />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-white">{attached.name}</div>
                  <div className="text-xs text-blue-400/80 font-medium">{attached.sub}</div>
                </div>
                <Button variant="ghost" className="w-8 h-8 p-0 text-white hover:bg-white/10" onClick={() => setAttached(null)}>
                  <X size={16} />
                </Button>
              </div>
            ) : (
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setAttachType('hall')}
                  className="flex-1 flex items-center justify-center gap-3 h-14 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                >
                  <Building size={20} /> Attach a Hall
                </button>
                <button 
                  type="button"
                  onClick={() => setAttachType('vendor')}
                  className="flex-1 flex items-center justify-center gap-3 h-14 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                >
                  <ShoppingBag size={20} /> Attach a Vendor
                </button>
              </div>
            )}

            {attachType && !attached && (
              <div className="mt-4 p-4 bg-zinc-900 border border-white/10 rounded-2xl animate-in slide-in-from-top-2">
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={`Search ${attachType} name...`}
                    value={attachSearch}
                    onChange={e => setAttachSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {searchingAttach && <div className="text-center py-4 text-gray-500 text-sm">Searching...</div>}
                  {!searchingAttach && attachResults.length === 0 && attachSearch.length > 2 && (
                    <div className="text-center py-4 text-gray-500 text-sm">No results found</div>
                  )}
                  {attachResults.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
                      onClick={() => {
                        setAttached({
                          id: item.id,
                          name: attachType === 'hall' ? item.name : item.business_name,
                          sub: attachType === 'hall' ? item.city : item.contact_email,
                          type: attachType,
                        })
                        setAttachType(null)
                        setAttachSearch('')
                      }}
                    >
                      <span className="text-gray-300 font-medium group-hover:text-blue-400 transition-colors">
                        {attachType === 'hall' ? item.name : item.business_name}
                      </span>
                      <PlusCircle size={16} className="text-gray-600 group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-10 border-t border-white/10">
            <Link to="/forum">
              <Button variant="ghost" className="text-gray-500 font-bold hover:text-white">DISCARD DRAFT</Button>
            </Link>
            
            <div className="flex gap-4">
              <Button 
                type="submit" 
                variant="primary" 
                disabled={submitting}
                className="h-14 px-10 gap-2 min-w-[200px]"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send size={18} /> <span className="font-black">{user ? 'PUBLISH DISCUSSION' : 'SIGN IN & POST'}</span></>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </form>
      </div>
    </ForumLayout>
  )
}


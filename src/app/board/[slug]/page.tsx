'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'

type Post = {
  id: string
  content: string
  category: string
  upvotes: number
  pinned: boolean
  createdAt: string
}

type Board = {
  id: string
  slug: string
  title: string
  createdAt: string
  expiresAt: string | null
}

const CATEGORIES = ['General', 'Idea', 'Bug', 'Praise', 'Question', 'Other']

function getExpiryInfo(expiresAt: string | null): { label: string; expired: boolean; urgent: boolean } {
  if (!expiresAt) return { label: '', expired: false, urgent: false }
  const now = new Date()
  const exp = new Date(expiresAt)
  const diff = exp.getTime() - now.getTime()
  if (diff <= 0) return { label: 'Expired', expired: true, urgent: false }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days === 0) return { label: `Expires in ${hours}h`, expired: false, urgent: true }
  if (days === 1) return { label: 'Expires tomorrow', expired: false, urgent: true }
  return { label: `Expires in ${days} days`, expired: false, urgent: false }
}

export default function BoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [board, setBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [filter, setFilter] = useState('All')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('General')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  const [isAdmin, setIsAdmin] = useState(false)
  const [copied, setCopied] = useState(false)
  const [postError, setPostError] = useState('')

  useEffect(() => {
    const key = localStorage.getItem(`adminKey:${slug}`)
    if (key) setIsAdmin(true)
    const voted = JSON.parse(localStorage.getItem(`voted:${slug}`) || '[]')
    setVotedIds(new Set(voted))
    fetchBoard()
    fetchPosts()
  }, [slug])

  async function fetchBoard() {
    const res = await fetch(`/api/boards?slug=${slug}`)
    if (res.ok) setBoard(await res.json())
    setLoading(false)
  }

  async function fetchPosts(cat?: string) {
    const active = cat ?? filter
    const url = `/api/posts?slug=${slug}${active !== 'All' ? `&category=${active}` : ''}`
    const res = await fetch(url)
    if (res.ok) setPosts(await res.json())
  }

  function handleFilterChange(cat: string) {
    setFilter(cat)
    fetchPosts(cat)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setPostError('')
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, content, category }),
    })
    if (res.ok) {
      setContent('')
      fetchPosts()
    } else {
      const data = await res.json()
      setPostError(data.error || 'Failed to post')
    }
    setSubmitting(false)
  }

  async function handleUpvote(postId: string) {
    if (votedIds.has(postId)) return
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upvote' }),
    })
    const newVoted = new Set(votedIds)
    newVoted.add(postId)
    setVotedIds(newVoted)
    localStorage.setItem(`voted:${slug}`, JSON.stringify([...newVoted]))
    fetchPosts()
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite' }} />
    </main>
  )

  if (!board) return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem' }}>Board not found</h1>
      <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Create one</Link>
    </main>
  )

  const expiry = getExpiryInfo(board.expiresAt)

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
      <div className="animate-fade-up" style={{ marginBottom: '2.5rem' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '1.5rem' }}>
          ← FeedbackBoard
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 400, lineHeight: 1.2, marginBottom: '6px' }}>{board.title}</h1>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
              {expiry.label && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  border: `1px solid ${expiry.expired ? 'rgba(255,71,87,0.4)' : expiry.urgent ? 'rgba(255,211,42,0.4)' : 'var(--border)'}`,
                  color: expiry.expired ? 'var(--danger)' : expiry.urgent ? 'var(--pin)' : 'var(--text-muted)',
                  background: expiry.expired ? 'rgba(255,71,87,0.08)' : expiry.urgent ? 'rgba(255,211,42,0.08)' : 'transparent',
                }}>
                  {expiry.expired ? '⊘ ' : '◷ '}{expiry.label}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={copyLink} style={{ padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: copied ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              {copied ? '✓ Copied!' : '⬡ Share'}
            </button>
            {isAdmin && (
              <Link href={`/board/${slug}/admin`} style={{ padding: '7px 14px', background: 'rgba(200,255,87,0.1)', border: '1px solid rgba(200,255,87,0.3)', borderRadius: '8px', color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                Admin →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Expired banner */}
      {expiry.expired ? (
        <div style={{ padding: '1rem 1.25rem', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: '10px', marginBottom: '2rem', color: 'var(--danger)', fontSize: '0.9rem' }}>
          This board has expired. No new posts can be submitted.
        </div>
      ) : (
        <div className="card animate-fade-up delay-1" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Leave anonymous feedback</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              maxLength={500}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
            />
            {postError && <p style={{ color: 'var(--danger)', fontSize: '0.83rem' }}>{postError}</p>}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.82rem', fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" disabled={submitting || !content.trim()} style={{ padding: '8px 18px', background: content.trim() ? 'var(--accent)' : 'var(--surface-2)', color: content.trim() ? 'var(--bg)' : 'var(--text-dim)', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 700, cursor: content.trim() ? 'pointer' : 'not-allowed', marginLeft: 'auto' }}>
                {submitting ? 'Posting…' : 'Post →'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="animate-fade-up delay-2" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {['All', ...CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => handleFilterChange(cat)} style={{ padding: '5px 12px', borderRadius: '999px', border: `1px solid ${filter === cat ? 'var(--accent)' : 'var(--border)'}`, background: filter === cat ? 'rgba(200,255,87,0.1)' : 'transparent', color: filter === cat ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-sans)', cursor: 'pointer' }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            No posts yet. Be the first to share feedback.
          </div>
        )}
        {posts.map((post, i) => (
          <div key={post.id} className="card animate-fade-up" style={{ animationDelay: `${i * 0.04}s`, padding: '1rem 1.25rem', borderColor: post.pinned ? 'rgba(255,211,42,0.3)' : undefined, position: 'relative' }}>
            {post.pinned && (
              <span style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '10px', color: 'var(--pin)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,211,42,0.1)', padding: '2px 8px', borderRadius: '999px' }}>Pinned</span>
            )}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <button onClick={() => handleUpvote(post.id)} disabled={votedIds.has(post.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', background: 'none', border: `1px solid ${votedIds.has(post.id) ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', padding: '6px 10px', cursor: votedIds.has(post.id) ? 'default' : 'pointer', color: votedIds.has(post.id) ? 'var(--accent)' : 'var(--text-muted)', minWidth: '44px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px' }}>▲</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{post.upvotes}</span>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '8px', wordBreak: 'break-word' }}>{post.content}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border)' }}>{post.category}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
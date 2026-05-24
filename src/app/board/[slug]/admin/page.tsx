'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
}

export default function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()

  const [board, setBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [adminKey, setAdminKey] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [keyInput, setKeyInput] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(`adminKey:${slug}`)
    if (stored) {
      setAdminKey(stored)
      setAuthorized(true)
      fetchData(stored)
    } else {
      setLoading(false)
    }
  }, [slug])

  async function fetchData(key: string) {
    setLoading(true)
    const [boardRes, postsRes] = await Promise.all([
      fetch(`/api/boards?slug=${slug}`),
      fetch(`/api/posts?slug=${slug}`),
    ])
    if (!boardRes.ok) { router.push('/'); return }
    setBoard(await boardRes.json())
    if (postsRes.ok) setPosts(await postsRes.json())
    setLoading(false)
  }

  async function handleKeySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!keyInput.trim()) return
    localStorage.setItem(`adminKey:${slug}`, keyInput.trim())
    setAdminKey(keyInput.trim())
    setAuthorized(true)
    fetchData(keyInput.trim())
  }

  async function handlePin(postId: string) {
    setActionLoading(postId + '-pin')
    await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pin', adminKey, slug }),
    })
    await fetchData(adminKey)
    setActionLoading(null)
  }

  async function handleDelete(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setActionLoading(postId + '-delete')
    await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey, slug }),
    })
    await fetchData(adminKey)
    setActionLoading(null)
  }

  function copyAdminKey() {
    navigator.clipboard.writeText(adminKey)
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin-slow 0.7s linear infinite' }} />
    </main>
  )

  if (!authorized) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '380px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Admin Access</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Enter the admin key you received when creating this board.
        </p>
        <form onSubmit={handleKeySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Paste your admin key…"
            style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', outline: 'none', textAlign: 'center' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
          />
          <button type="submit" style={{ padding: '12px', background: 'var(--accent)', color: 'var(--bg)', border: 'none', borderRadius: '8px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            Enter Admin Panel →
          </button>
        </form>
        <Link href={`/board/${slug}`} style={{ display: 'block', marginTop: '1.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem' }}>
          ← Back to board
        </Link>
      </div>
    </main>
  )

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
      <div className="animate-fade-up" style={{ marginBottom: '2rem' }}>
        <Link href={`/board/${slug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '1.5rem' }}>
          ← Back to board
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 400 }}>{board?.title}</h1>
              <span style={{ fontSize: '11px', color: 'var(--accent)', background: 'rgba(200,255,87,0.1)', border: '1px solid rgba(200,255,87,0.2)', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{posts.length} total posts</p>
          </div>
          <button onClick={copyAdminKey} style={{ padding: '7px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: copiedKey ? 'var(--accent)' : 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {copiedKey ? '✓ Key Copied' : '⬡ Copy Admin Key'}
          </button>
        </div>
      </div>

      <div className="card animate-fade-up delay-1" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Posts', value: posts.length },
          { label: 'Pinned', value: posts.filter(p => p.pinned).length },
          { label: 'Total Upvotes', value: posts.reduce((a, p) => a + p.upvotes, 0) },
        ].map(({ label, value }) => (
          <div key={label}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {posts.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            No posts yet.
          </div>
        )}
        {posts.map((post, i) => (
          <div key={post.id} className="card animate-fade-up" style={{ animationDelay: `${i * 0.04}s`, padding: '1rem 1.25rem', borderColor: post.pinned ? 'rgba(255,211,42,0.3)' : undefined }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', minWidth: '44px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>▲</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{post.upvotes}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '8px', wordBreak: 'break-word' }}>{post.content}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border)' }}>{post.category}</span>
                  {post.pinned && <span style={{ fontSize: '11px', color: 'var(--pin)', background: 'rgba(255,211,42,0.08)', padding: '2px 8px', borderRadius: '999px' }}>📌 Pinned</span>}
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button onClick={() => handlePin(post.id)} disabled={actionLoading === post.id + '-pin'} style={{ padding: '6px 12px', background: post.pinned ? 'rgba(255,211,42,0.1)' : 'var(--surface-2)', border: `1px solid ${post.pinned ? 'rgba(255,211,42,0.3)' : 'var(--border)'}`, borderRadius: '7px', color: post.pinned ? 'var(--pin)' : 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  {actionLoading === post.id + '-pin' ? '…' : post.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={() => handleDelete(post.id)} disabled={actionLoading === post.id + '-delete'} style={{ padding: '6px 12px', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', borderRadius: '7px', color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  {actionLoading === post.id + '-delete' ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
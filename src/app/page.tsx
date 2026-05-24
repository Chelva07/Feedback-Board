'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [expiryDays, setExpiryDays] = useState('7')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, notifyEmail, expiryDays }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      localStorage.setItem(`adminKey:${data.slug}`, data.adminKey)
      router.push(`/board/${data.slug}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,255,87,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="animate-fade-up" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div className="animate-fade-up delay-1" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', border: '1px solid var(--border)', borderRadius: '999px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          No accounts. Fully anonymous.
        </div>

        <h1 className="animate-fade-up delay-2" style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2.4rem, 6vw, 3.6rem)', fontWeight: 400, lineHeight: 1.15, marginBottom: '1rem' }}>
          Anonymous feedback,{' '}
          <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>amplified.</em>
        </h1>

        <p className="animate-fade-up delay-3" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Create a board. Share the link. Collect honest feedback — no logins, no filters, no noise.
        </p>

        <form className="animate-fade-up delay-4" onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name your board…"
            maxLength={80}
            style={{ width: '100%', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.95rem', fontFamily: 'var(--font-sans)', outline: 'none' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
          />

          <input
            type="email"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            placeholder="Notify email (optional) — get alerted on new posts"
            style={{ width: '100%', padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.95rem', fontFamily: 'var(--font-sans)', outline: 'none' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Board expires in:</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              style={{ flex: 1, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="never">Never</option>
            </select>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'left' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !title.trim()}
            style={{ padding: '14px 18px', background: title.trim() ? 'var(--accent)' : 'var(--surface-2)', color: title.trim() ? 'var(--bg)' : 'var(--text-dim)', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', fontWeight: 700, cursor: title.trim() ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Creating…' : 'Create Board →'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          You&apos;ll get a shareable link + a secret admin key saved in your browser.
        </p>
      </div>
    </main>
  )
}
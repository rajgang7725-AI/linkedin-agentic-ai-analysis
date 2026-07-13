'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/app/lib/theme'

export default function SubmitPage() {
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [topic, setTopic] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const res = await fetch('/api/admin/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkedinUrl, excerpt, authorName, topic }),
    })

    const data = await res.json()

    if (!res.ok) {
      setStatus('error')
      setErrorMsg(data.error ?? 'Something went wrong')
      return
    }

    router.push('/admin')
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: theme.textDark, marginBottom: 6 }}>
        Submit a LinkedIn post
      </h1>
      <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>
        Paste a post you found yourself. Copy a short excerpt directly from what you're viewing —
        this is entered manually, not scraped.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>LinkedIn post URL</label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Author name</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Excerpt (short quote, your own transcription)</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value.slice(0, 300))}
            required
            rows={4}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4, fontFamily: 'sans-serif' }}
          />
          <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{excerpt.length}/300 characters</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            placeholder="e.g. agentic ai"
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4 }}
          />
        </div>

        {status === 'error' && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === 'submitting'}
          style={{ padding: '10px 20px', fontSize: 14, background: theme.blue, color: '#fff', border: 'none', borderRadius: 8 }}
        >
          {status === 'submitting' ? 'Analyzing with AI…' : 'Submit & Analyze'}
        </button>
      </form>
    </main>
  )
}
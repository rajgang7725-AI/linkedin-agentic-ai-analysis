'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { theme } from '@/app/lib/theme'

type Props = {
  id: string
  initialSummary: string
  initialCommentary: string
  initialDifficulty: string
  initialTags: string
  initialAudiences: string
  postExcerpt: string
  authorName: string
}

export default function EditForm({
  id, initialSummary, initialCommentary, initialDifficulty, initialTags, initialAudiences, postExcerpt, authorName,
}: Props) {
  const [summary, setSummary] = useState(initialSummary)
  const [commentary, setCommentary] = useState(initialCommentary)
  const [difficulty, setDifficulty] = useState(initialDifficulty)
  const [tags, setTags] = useState(initialTags)
  const [audiences, setAudiences] = useState(initialAudiences)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const router = useRouter()
  const [refineTarget, setRefineTarget] = useState<'summary' | 'commentary' | null>(null)
  const [refineInstruction, setRefineInstruction] = useState('')
  const [refining, setRefining] = useState(false)

  async function handleRefine() {
    if (!refineTarget || !refineInstruction.trim()) return
    setRefining(true)

    const currentText = refineTarget === 'summary' ? summary : commentary

    const res = await fetch('/api/admin/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentText, instruction: refineInstruction, fieldLabel: refineTarget }),
    })

    const data = await res.json()
    setRefining(false)

    if (!res.ok) {
      alert(data.error ?? 'Refine failed')
      return
    }

    if (refineTarget === 'summary') setSummary(data.revisedText)
    else setCommentary(data.revisedText)

    setRefineTarget(null)
    setRefineInstruction('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')

    const res = await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id, summary, commentary, difficulty,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        audiences: audiences.split(',').map((a) => a.trim()).filter(Boolean),
      }),
    })

    if (!res.ok) {
      setStatus('error')
      return
    }

    setStatus('saved')
    router.push('/admin')
    router.refresh()
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: theme.textDark, marginBottom: 4 }}>Edit analysis</h1>
      <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>By {authorName}</p>

      <div style={{ background: theme.bgPage, borderRadius: 10, padding: 12, fontSize: 13, fontStyle: 'italic', color: theme.textDark, marginBottom: 20 }}>
        "{postExcerpt}"
      </div>

      <form onSubmit={handleSave}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4, fontFamily: 'sans-serif' }}
          />
        </div>
<div style={{ marginBottom: 14 }}>
          {refineTarget === 'summary' ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder="e.g. make this more concise"
                autoFocus
                style={{ flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 6, border: `0.5px solid ${theme.border}` }}
              />
              <button type="button" onClick={handleRefine} disabled={refining} style={{ fontSize: 12, padding: '4px 10px', background: theme.blueLight, color: '#fff', border: 'none', borderRadius: 6 }}>
                {refining ? '…' : 'Go'}
              </button>
              <button type="button" onClick={() => setRefineTarget(null)} style={{ fontSize: 12, padding: '4px 10px', background: 'transparent', border: 'none', color: theme.textMuted }}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setRefineTarget('summary')} style={{ fontSize: 12, color: theme.blue, background: 'transparent', border: 'none', padding: 0 }}>
              ✨ Refine with AI
            </button>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Commentary</label>
          <textarea
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            rows={5}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4, fontFamily: 'sans-serif' }}
          />
        </div>
<div style={{ marginBottom: 14 }}>
          {refineTarget === 'commentary' ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder="e.g. make this more technical"
                autoFocus
                style={{ flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 6, border: `0.5px solid ${theme.border}` }}
              />
              <button type="button" onClick={handleRefine} disabled={refining} style={{ fontSize: 12, padding: '4px 10px', background: theme.blueLight, color: '#fff', border: 'none', borderRadius: 6 }}>
                {refining ? '…' : 'Go'}
              </button>
              <button type="button" onClick={() => setRefineTarget(null)} style={{ fontSize: 12, padding: '4px 10px', background: 'transparent', border: 'none', color: theme.textMuted }}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setRefineTarget('commentary')} style={{ fontSize: 12, color: theme.blue, background: 'transparent', border: 'none', padding: 0 }}>
              ✨ Refine with AI
            </button>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4 }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: theme.textDark }}>Audiences (comma-separated)</label>
          <input
            type="text"
            value={audiences}
            onChange={(e) => setAudiences(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontSize: 13, borderRadius: 8, border: `0.5px solid ${theme.border}`, marginTop: 4 }}
          />
        </div>

        {status === 'error' && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>Save failed — try again.</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={status === 'saving'}
            style={{ padding: '10px 20px', fontSize: 14, background: theme.blue, color: '#fff', border: 'none', borderRadius: 8 }}
          >
            {status === 'saving' ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            style={{ padding: '10px 20px', fontSize: 14, background: '#fff', color: theme.textMuted, border: `0.5px solid ${theme.border}`, borderRadius: 8 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  )
}
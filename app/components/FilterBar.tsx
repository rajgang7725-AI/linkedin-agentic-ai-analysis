'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { theme } from '@/app/lib/theme'

type Props = {
  allTags: { name: string }[]
  allAudiences: { name: string }[]
}

export default function FilterBar({ allTags, allAudiences }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(params.toString() ? `/?${params.toString()}` : '/')
  }

  const hasFilters = searchParams.get('topic') || searchParams.get('audience') || searchParams.get('difficulty')

  return (
    <section style={{ background: theme.bgPage, padding: '16px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <select
        value={searchParams.get('topic') ?? ''}
        onChange={(e) => updateParam('topic', e.target.value)}
        style={{ padding: '8px 10px', fontSize: 12, borderRadius: 8, border: `0.5px solid ${theme.border}` }}
      >
        <option value="">All topics</option>
        {allTags.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
      </select>

      <select
        value={searchParams.get('audience') ?? ''}
        onChange={(e) => updateParam('audience', e.target.value)}
        style={{ padding: '8px 10px', fontSize: 12, borderRadius: 8, border: `0.5px solid ${theme.border}` }}
      >
        <option value="">All audiences</option>
        {allAudiences.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
      </select>

      <select
        value={searchParams.get('difficulty') ?? ''}
        onChange={(e) => updateParam('difficulty', e.target.value)}
        style={{ padding: '8px 10px', fontSize: 12, borderRadius: 8, border: `0.5px solid ${theme.border}` }}
      >
        <option value="">All levels</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>

      {hasFilters && (
        <a href="/" style={{ fontSize: 12, color: theme.blue, alignSelf: 'center' }}>Clear ×</a>
      )}
    </section>
  )
}
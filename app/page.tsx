import { supabase } from '@/app/lib/supabase'
import { theme } from '@/app/lib/theme'
import Link from 'next/link'
import FilterBar from '@/app/components/FilterBar'

type SearchParams = { topic?: string; audience?: string; difficulty?: string }

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  // Fetch filter options
  const { data: allTags } = await supabase.from('tags').select('name').order('name')
  const { data: allAudiences } = await supabase.from('audiences').select('name').order('name')

  // Resolve tag/audience filters to analysis id lists first (join tables need this two-step approach)
  let analysisIdsFromTag: string[] | null = null
  if (params.topic) {
    const { data: tag } = await supabase.from('tags').select('id').eq('name', params.topic).maybeSingle()
    if (tag) {
      const { data: links } = await supabase.from('analysis_tags').select('analysis_id').eq('tag_id', tag.id)
      analysisIdsFromTag = links?.map((l) => l.analysis_id) ?? []
    } else {
      analysisIdsFromTag = []
    }
  }

  let analysisIdsFromAudience: string[] | null = null
  if (params.audience) {
    const { data: aud } = await supabase.from('audiences').select('id').eq('name', params.audience).maybeSingle()
    if (aud) {
      const { data: links } = await supabase.from('analysis_audiences').select('analysis_id').eq('audience_id', aud.id)
      analysisIdsFromAudience = links?.map((l) => l.analysis_id) ?? []
    } else {
      analysisIdsFromAudience = []
    }
  }

  let query = supabase
    .from('analyses')
    .select(`
      id, summary, commentary, difficulty,
      posts ( linkedin_url, author_name, excerpt ),
      analysis_tags ( tags ( name ) ),
      analysis_audiences ( audiences ( name ) )
    `)
    .order('created_at', { ascending: false })

  if (params.difficulty) query = query.eq('difficulty', params.difficulty)
  if (analysisIdsFromTag) query = query.in('id', analysisIdsFromTag)
  if (analysisIdsFromAudience) query = query.in('id', analysisIdsFromAudience)

  const { data: analyses, error } = await query

  function buildHref(overrides: Partial<SearchParams>) {
    const next = { ...params, ...overrides }
    const qs = new URLSearchParams(
      Object.entries(next).filter(([, v]) => v) as [string, string][]
    ).toString()
    return qs ? `/?${qs}` : '/'
  }

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '0 auto' }}>
      <header style={{ padding: '24px 20px 20px', borderBottom: `3px solid ${theme.blue}` }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: theme.blue, marginBottom: 18 }}>
          Agentic Signal
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: theme.textDark, margin: 0 }}>
          Analysis of public LinkedIn posts on agentic AI
        </h1>
      </header>
<FilterBar allTags={allTags ?? []} allAudiences={allAudiences ?? []} />

      <section style={{ padding: '8px 20px 20px' }}>
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        {!error && analyses?.length === 0 && (
          <p style={{ color: theme.textMuted, padding: '2rem 0' }}>No analyses match these filters.</p>
        )}
        {analyses?.map((a) => {
          const initials = ((a.posts as any)?.author_name ?? '?').slice(0, 2).toUpperCase()
          return (
            <Link
              key={a.id}
              href={`/analysis/${a.id}`}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: `0.5px solid ${theme.border}` }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: theme.blue, color: '#fff',
                fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: theme.textDark }}>{(a.posts as any)?.author_name ?? 'Unknown author'}</div>
                <div style={{ fontSize: 11, color: theme.textMuted }}>
                  {a.difficulty} · {a.analysis_audiences?.map((x: any) => x.audiences?.name).join(', ')}
                </div>
              </div>
              <div style={{ fontSize: 11, color: theme.blue }}>Read →</div>
            </Link>
          )
        })}
      </section>
      
    </main>
  )
}
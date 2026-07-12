import { supabase } from '@/app/lib/supabase'
import { theme } from '@/app/lib/theme'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: a, error } = await supabase
    .from('analyses')
    .select(`
      id, summary, commentary, difficulty,
      posts ( linkedin_url, author_name, excerpt ),
      analysis_tags ( tags ( name ) ),
      analysis_audiences ( audiences ( name ) )
    `)
    .eq('id', id)
    .single()

  if (error || !a) {
    notFound()
  }

  const post = a.posts as any
  const initials = (post?.author_name ?? '?').slice(0, 2).toUpperCase()

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 680, margin: '0 auto', padding: '24px 20px' }}>
      <Link href="/" style={{ fontSize: 13, color: theme.blue, textDecoration: 'none' }}>← Back to all analyses</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: theme.blue, color: '#fff',
          fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: theme.textDark }}>{post?.author_name ?? 'Unknown author'}</div>
          <a href={post?.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: theme.blue }}>
            View original post on LinkedIn →
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <span style={{ fontSize: 11, background: theme.blueLight, color: '#fff', padding: '4px 10px', borderRadius: 20 }}>
          {a.difficulty}
        </span>
        {a.analysis_tags?.map((t: any) => (
          <span key={t.tags?.name} style={{ fontSize: 11, background: theme.bgTint, color: '#0C447C', padding: '4px 10px', borderRadius: 20 }}>
            {t.tags?.name}
          </span>
        ))}
        {a.analysis_audiences?.map((x: any) => (
          <span key={x.audiences?.name} style={{ fontSize: 11, background: '#F1EFE8', color: '#444441', padding: '4px 10px', borderRadius: 20 }}>
            {x.audiences?.name}
          </span>
        ))}
      </div>

      <div style={{ background: theme.bgPage, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>Original post excerpt</div>
        <div style={{ fontSize: 14, color: theme.textDark, fontStyle: 'italic' }}>"{post?.excerpt}"</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: theme.textDark, marginBottom: 6 }}>Summary</h2>
        <p style={{ fontSize: 14, color: theme.textDark, lineHeight: 1.6 }}>{a.summary}</p>
      </div>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: theme.textDark, marginBottom: 6 }}>Analysis</h2>
        <p style={{ fontSize: 14, color: theme.textDark, lineHeight: 1.6 }}>{a.commentary}</p>
      </div>
    </main>
  )
}
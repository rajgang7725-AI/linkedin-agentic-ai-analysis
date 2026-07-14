import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { notFound } from 'next/navigation'
import EditForm from './EditForm'

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: analysis, error } = await supabaseAdmin
    .from('analyses')
    .select(`
      id, summary, commentary, difficulty, image_url,
      posts ( author_name, excerpt, linkedin_url, topic_searched ),
      analysis_tags ( tags ( name ) ),
      analysis_audiences ( audiences ( name ) )
    `)
    .eq('id', id)
    .single()

  if (error || !analysis) notFound()

  const initialTags = (analysis.analysis_tags ?? []).map((t: any) => t.tags?.name).filter(Boolean)
  const initialAudiences = (analysis.analysis_audiences ?? []).map((a: any) => a.audiences?.name).filter(Boolean)

  return (
    <EditForm
      id={analysis.id}
      initialSummary={analysis.summary ?? ''}
      initialCommentary={analysis.commentary ?? ''}
      initialDifficulty={analysis.difficulty ?? 'beginner'}
      initialTags={initialTags.join(', ')}
      initialAudiences={initialAudiences.join(', ')}
      postExcerpt={(analysis.posts as any)?.excerpt ?? ''}
      authorName={(analysis.posts as any)?.author_name ?? ''}
      initialImageUrl={analysis.image_url}
      topic={(analysis.posts as any)?.topic_searched ?? ''}
    />
  )
}
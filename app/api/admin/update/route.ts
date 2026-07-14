import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { findOrCreate } from '@/app/lib/analyzePost'
import { createSupabaseServerClient } from '@/app/lib/supabaseServer'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, summary, commentary, difficulty, tags, audiences, imageUrl } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error: updateError } = await supabaseAdmin
    .from('analyses')
    .update({ summary, commentary, difficulty, image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Replace tag links: clear existing, re-link based on the edited list
  await supabaseAdmin.from('analysis_tags').delete().eq('analysis_id', id)
  for (const tagName of tags ?? []) {
    const tagId = await findOrCreate('tags', tagName)
    await supabaseAdmin.from('analysis_tags').insert({ analysis_id: id, tag_id: tagId })
  }

  // Replace audience links the same way
  await supabaseAdmin.from('analysis_audiences').delete().eq('analysis_id', id)
  for (const audienceName of audiences ?? []) {
    const audienceId = await findOrCreate('audiences', audienceName)
    await supabaseAdmin.from('analysis_audiences').insert({ analysis_id: id, audience_id: audienceId })
  }

  return NextResponse.json({ success: true })
}
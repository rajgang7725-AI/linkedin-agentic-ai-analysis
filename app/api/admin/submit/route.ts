import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { analyzePost } from '@/app/lib/analyzePost'
import { createSupabaseServerClient } from '@/app/lib/supabaseServer'

export async function POST(request: NextRequest) {
  // Require login — this endpoint writes data, must not be publicly callable
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { linkedinUrl, excerpt, authorName, topic } = await request.json()

  if (!linkedinUrl || !excerpt || !topic) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: post, error: postError } = await supabaseAdmin
    .from('posts')
    .insert({
      linkedin_url: linkedinUrl,
      author_name: authorName || null,
      excerpt: excerpt.slice(0, 300),
      topic_searched: topic,
    })
    .select()
    .single()

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 })
  }

  try {
    const result = await analyzePost(post)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
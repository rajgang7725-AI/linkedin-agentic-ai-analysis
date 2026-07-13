import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'
import { analyzePost } from '@/app/lib/analyzePost'

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get('post_id')
  if (!postId) {
    return NextResponse.json({ error: 'Missing ?post_id= parameter' }, { status: 400 })
  }

  const { data: post, error: postError } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  try {
    const result = await analyzePost(post)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 502 })
  }
}
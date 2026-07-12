import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const VALID_AUDIENCES = ['founders', 'engineers', 'marketers', 'students']

async function findOrCreate(table: 'tags' | 'audiences', name: string): Promise<string> {
  const existing = await supabaseAdmin.from(table).select('id').eq('name', name).maybeSingle()
  if (existing.data) return existing.data.id

  const created = await supabaseAdmin.from(table).insert({ name }).select('id').single()
  if (created.error) throw new Error(`Failed to create ${table} "${name}": ${created.error.message}`)
  return created.data.id
}

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

  const prompt = `Given this excerpt from a LinkedIn post about "${post.topic_searched}":

"${post.excerpt}"

Provide:
- summary: 1-2 sentence neutral summary
- commentary: 2-4 sentence analysis (what's good, what's missing, technical accuracy)
- difficulty: exactly one of "beginner" | "intermediate" | "advanced"
- tags: 1-3 short topic tags (lowercase, hyphenated, e.g. "agentic-ai")
- audiences: 1-3 from ${JSON.stringify(VALID_AUDIENCES)}

Respond with ONLY valid JSON matching this shape, no markdown fences, no preamble:
{"summary": "...", "commentary": "...", "difficulty": "...", "tags": ["..."], "audiences": ["..."]}`

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!claudeRes.ok) {
    const errText = await claudeRes.text()
    return NextResponse.json({ error: 'Claude API request failed', detail: errText }, { status: 502 })
  }

  const claudeData = await claudeRes.json()
  const rawText = claudeData.content?.[0]?.text ?? ''

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'Could not parse Claude response as JSON', raw: rawText }, { status: 502 })
  }

  if (!VALID_DIFFICULTIES.includes(parsed.difficulty)) {
    return NextResponse.json({ error: 'Invalid difficulty from model', raw: parsed }, { status: 502 })
  }

  // Insert the analysis (defaults to status = 'pending_review' per our schema)
  const { data: analysis, error: analysisError } = await supabaseAdmin
    .from('analyses')
    .insert({
      post_id: post.id,
      summary: parsed.summary,
      commentary: parsed.commentary,
      difficulty: parsed.difficulty,
    })
    .select()
    .single()

  if (analysisError) {
    return NextResponse.json({ error: analysisError.message }, { status: 500 })
  }

  // Link tags (find-or-create each, then join)
  for (const tagName of parsed.tags ?? []) {
    const tagId = await findOrCreate('tags', tagName)
    await supabaseAdmin.from('analysis_tags').insert({ analysis_id: analysis.id, tag_id: tagId })
  }

  // Link audiences (only accept values from our known set)
  for (const audienceName of parsed.audiences ?? []) {
    if (!VALID_AUDIENCES.includes(audienceName)) continue
    const audienceId = await findOrCreate('audiences', audienceName)
    await supabaseAdmin.from('analysis_audiences').insert({ analysis_id: analysis.id, audience_id: audienceId })
  }

  return NextResponse.json({ analysis, tags: parsed.tags, audiences: parsed.audiences })
}
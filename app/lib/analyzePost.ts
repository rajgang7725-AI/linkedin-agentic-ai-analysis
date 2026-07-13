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

type Post = {
  id: string
  excerpt: string
  topic_searched: string | null
}

export async function analyzePost(post: Post) {
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
    throw new Error(`Claude API request failed: ${errText}`)
  }

  const claudeData = await claudeRes.json()
  const rawText = claudeData.content?.[0]?.text ?? ''

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error(`Could not parse Claude response as JSON: ${rawText}`)
  }

  if (!VALID_DIFFICULTIES.includes(parsed.difficulty)) {
    throw new Error(`Invalid difficulty from model: ${parsed.difficulty}`)
  }

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

  if (analysisError) throw new Error(analysisError.message)

  for (const tagName of parsed.tags ?? []) {
    const tagId = await findOrCreate('tags', tagName)
    await supabaseAdmin.from('analysis_tags').insert({ analysis_id: analysis.id, tag_id: tagId })
  }

  for (const audienceName of parsed.audiences ?? []) {
    if (!VALID_AUDIENCES.includes(audienceName)) continue
    const audienceId = await findOrCreate('audiences', audienceName)
    await supabaseAdmin.from('analysis_audiences').insert({ analysis_id: analysis.id, audience_id: audienceId })
  }

  return { analysis, tags: parsed.tags, audiences: parsed.audiences }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

// Phrases that indicate we only saw LinkedIn's login wall, not real content
const LOGIN_WALL_MARKERS = ['sign in', 'session_redirect', 'report this post', '/uas/login', '/login?']

function isLoginWallJunk(text: string): boolean {
  const lower = text.toLowerCase()
  return LOGIN_WALL_MARKERS.some((marker) => lower.includes(marker))
}

function extractAuthorSlug(url: string): string | null {
  // Matches the segment right after /posts/ up to the first underscore
  const match = url.match(/linkedin\.com\/posts\/([^_/]+)_/)
  if (!match) return null

  // Turn "bernardmarr" or "andrew-ng" style slugs into a readable guess
  return match[1]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get('topic')
  if (!topic) {
    return NextResponse.json({ error: 'Missing ?topic= parameter' }, { status: 400 })
  }

  const tavilyRes = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: `site:linkedin.com/posts ${topic}`,
      max_results: 5,
    }),
  })

  if (!tavilyRes.ok) {
    return NextResponse.json({ error: 'Tavily request failed' }, { status: 502 })
  }

  const tavilyData = await tavilyRes.json()
  const results = tavilyData.results ?? []

  const inserted = []
  const skipped = []

  for (const result of results) {
    if (!result.url?.includes('linkedin.com')) {
      skipped.push({ url: result.url, reason: 'not a linkedin.com URL' })
      continue
    }

    const rawContent = result.content ?? ''

    // Skip login-wall junk entirely — don't even store it
    if (isLoginWallJunk(rawContent) || isLoginWallJunk(result.url)) {
      skipped.push({ url: result.url, reason: 'login wall / no real content available' })
      continue
    }

    const excerpt = rawContent.slice(0, 150)
    const authorName = extractAuthorSlug(result.url)

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        linkedin_url: result.url,
        author_name: authorName,
        excerpt,
        topic_searched: topic,
      })
      .select()

    if (error) {
      skipped.push({ url: result.url, reason: error.message })
    } else {
      inserted.push(data[0])
    }
  }

  return NextResponse.json({ topic, inserted, skipped })
}
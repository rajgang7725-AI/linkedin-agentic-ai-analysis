import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/lib/supabaseServer'
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { analysisId, topic, summary } = await request.json()

  if (!analysisId || !summary) {
    return NextResponse.json({ error: 'Missing analysisId or summary' }, { status: 400 })
  }

  const prompt = `Create a simple, clean illustrative SVG diagram (viewBox="0 0 600 400") representing this concept from a LinkedIn post analysis:

Topic: ${topic}
Summary: ${summary}

Requirements:
- Simple flat shapes, no photorealism
- Use a blue color palette (#0070AD, #12ABDB, #E6F1FB, white background)
- Include readable text labels if relevant
- Keep it conceptual/diagrammatic, not decorative

Respond with ONLY the raw SVG code, starting with <svg and ending with </svg>. No markdown fences, no explanation.`

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!claudeRes.ok) {
    const errText = await claudeRes.text()
    return NextResponse.json({ error: `Claude API failed: ${errText}` }, { status: 502 })
  }

  const claudeData = await claudeRes.json()
  let svgCode = claudeData.content?.[0]?.text?.trim() ?? ''

  svgCode = svgCode.replace(/```svg|```/g, '').trim()
  if (!svgCode.startsWith('<svg')) {
    return NextResponse.json({ error: 'Claude did not return valid SVG' }, { status: 502 })
  }

  const fileName = `${analysisId}-${Date.now()}.svg`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('analysis-images')
    .upload(fileName, svgCode, { contentType: 'image/svg+xml', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from('analysis-images')
    .getPublicUrl(fileName)

  return NextResponse.json({ imageUrl: publicUrlData.publicUrl })
}
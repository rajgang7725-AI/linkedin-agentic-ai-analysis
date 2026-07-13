import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/app/lib/supabaseServer'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentText, instruction, fieldLabel } = await request.json()

  if (!currentText || !instruction) {
    return NextResponse.json({ error: 'Missing currentText or instruction' }, { status: 400 })
  }

  const prompt = `Here is the current ${fieldLabel ?? 'text'}:

"${currentText}"

Instruction: ${instruction}

Rewrite it following the instruction. Respond with ONLY the revised text — no preamble, no quotes around it, no explanation.`

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!claudeRes.ok) {
    const errText = await claudeRes.text()
    return NextResponse.json({ error: `Claude API failed: ${errText}` }, { status: 502 })
  }

  const claudeData = await claudeRes.json()
  const revisedText = claudeData.content?.[0]?.text?.trim() ?? ''

  return NextResponse.json({ revisedText })
}